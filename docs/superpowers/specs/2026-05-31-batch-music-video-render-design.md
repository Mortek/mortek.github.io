# Batch Music-Video Render — Design

**Date:** 2026-05-31
**Status:** Approved (pending spec review)

## Problem

Generating the visualizer videos by hand is slow and repetitive. For each song the user must, in `music_visualizer.html`:

1. Shorts tab → upload portrait image + audio + logo → render the **TikTok** short.
2. Shorts tab → swap portrait image → render the **YouTube Shorts** short.
3. Landscape tab → upload landscape image + audio + logo → render the **Landscape** video.

Each render is a long, attended wait. The goal is to automate all three (and a whole folder of songs) unattended.

## Key technical finding

The in-page download handlers (`#dlBtn` for landscape, `#shortsDlBtn` for shorts) are **fully offline encoders**: they use `OfflineAudioContext` + a manual FFT + WebCodecs (`VideoEncoder` VP8 / `AudioEncoder` Opus) and stream a hand-muxed WebM. They run **as fast as the CPU allows** (not real-time).

When `window.showSaveFilePicker` is **absent**, both handlers fall back to a Blob + `<a download>` path (`dlName = (imgName||...)+'.webm'`, shorts uses `portraitName`). That fallback is what automation exploits — Chrome's download mechanism captures the blob to a target directory.

The encoders read control values **live** at encode time (e.g. `document.getElementById('bassZoom').value`), so setting the DOM controls before clicking download is sufficient to control the look.

## Approach (chosen: A)

- **A — Drive the real HTML headlessly (chosen).** Reuse the exact in-page encoder via browser automation. Identical output, zero rendering drift, faster than real-time.
- B — Reimplement the render in Node (node-canvas + ffmpeg). Rejected: huge effort, silently drifts from `music_visualizer.html`.
- C — Real-time tab capture. Rejected: real-time-slow, fragile, lower quality.

## Components

1. **`tools/batch-render/render.mjs`** — Node ESM engine.
2. **`tools/batch-render/package.json`** — pins `puppeteer-core` only; drives system `/usr/bin/google-chrome` (no Chromium download).
3. **`.claude/skills/render-music-videos/SKILL.md`** — thin skill: "render music videos for `<folder>`" → runs the script, relays the summary.

## Engine behaviour

### Serving the page
Start an ephemeral static HTTP server on `127.0.0.1:<port>` rooted at the repo and load `http://127.0.0.1:<port>/music_visualizer.html`. `localhost` is a guaranteed secure context (WebCodecs requires one) and avoids `file://` quirks; relative `style.css` / `site.js` resolve normally.

### Browser
Launch system google-chrome via puppeteer-core. **Headless first; auto-fallback to headful** if `typeof VideoEncoder === 'undefined'` in the page. Inject (before page scripts) `delete window.showSaveFilePicker` to force the Blob download path. Point Chrome's download dir at a per-run temp folder via CDP `Page.setDownloadBehavior`.

### Asset discovery
Argument is a folder. If it directly contains a `*.mp3`, it is a **song folder**; otherwise recurse **one level** into subfolders, each treated as a song folder. For each song folder:

- `title` = basename of the `*.mp3` (first mp3 if several).
- Locate, **case-insensitively**, by exact suffix:
  - Landscape image: `<title>.png`
  - TikTok portrait: `<title> Tik Tok.png`
  - YouTube portrait: `<title> Youtube shorts.png`
- Any other PNG (e.g. `<title> 2MB.png`) is ignored because matching is anchored to those exact names.
- Logo is always `/home/maurice/Documents/Music/Youtube/profile_picture_transparant_background.png`.
- A missing image variant → warn and skip that one video; continue.

### Render order (per song): shorts first, then landscape
1. **TikTok** (Shorts tab): `portraitInput`=TikTok png, `shortsAudioInput`=mp3, `shortsLogoInput`=logo, `shortsDur`=`58` (60 sec), start=0 → click `#shortsDlBtn`. Output `<title> Tik Tok.webm`.
2. **YouTube Shorts** (Shorts tab): same with the YouTube png. Output `<title> Youtube shorts.webm`.
3. **Landscape** (Landscape tab): `imgInput`=`<title>.png`, `audioInput`=mp3, `logoInput`=logo → click `#dlBtn` (full song length). Output `<title>.webm`.

For each render: switch to the target tab first, load the asset inputs (and wait for the audio `decodeAudioData` + image color extraction to finish), then apply the **locked settings profile**, then click download.

### Locked settings profile
Set every control explicitly (assign `value` / `checked`, dispatch `input`+`change`) so output never depends on fresh-session defaults.

Shared on both tabs:
- partStyle=`sparksint`, partIntensity=`2` (High), partAmount=`500`, partSpeed=`1` (Fast), partSize=`1` (Normal), partLife=`4` (Very Long), bassReact=`70` (Strong)
- barThreshold=`0.08` (Low), barCount=`100`, barWidth=`2.5` (Normal), barLength=`0.07` (Short), barSmoothing=`0.003` (Smooth), innerRadius=`110` (Small), barCaps=`0` (Off), barGlow=`6` (Subtle), reactRadius=`0.5` (Strong)
- colorScheme=`imageColors`, overlay=`0` (None), centerShadow=`0.9` (Very Dark), logoTint=`40`, partGlow=`8` (Subtle), partTrails=`0.5` (Faint), vigColor=`0` (Off), colorCycle=`0` (Off)
- bassZoom=`0.003` (Very Subtle), brightPulse=`0` (Off), vigPulse=`0.35` (Strong), hueShiftOn=**unchecked**, hueShift=`0.1` (Very Slow, inert), hueSat=`100`, cameraShake=`1` (Very Subtle)

Per-tab difference (only one):
- **barIntensity**: Shorts = `1.5` (Medium-High); Landscape = `2` (High).

The profile is a clearly-commented constant at the top of `render.mjs` so it is easy to edit later.

### Completion detection & output placement
Await each render by polling the page status text (`Done! Video saved.` success / `Error: …` failure) **and** the temp download settling (final `.webm` present, no `.crdownload`, size stable). On success, **move** the file into the song folder under the canonical output name above. **Skip** a video if its target `.webm` already exists. Per-render timeout generous (e.g. 30 min) since full-song landscape encodes take minutes headless.

### Concurrency & errors
**Sequential by default** (encode is CPU-bound). A `--concurrency N` flag exists but defaults to `1` so it won't swamp the laptop. Per-song / per-render failures log a warning and continue; the script prints a final summary and exits non-zero if anything failed or was skipped-due-to-error.

## CLI

```
node tools/batch-render/render.mjs "<folder>" [--concurrency N] [--headful] [--overwrite]
```
- `<folder>`: song folder or parent of song folders.
- `--overwrite`: re-render even if target exists (default: skip existing).
- `--headful`: force visible Chrome (default: headless, auto-fallback to headful on WebCodecs failure).

## Test plan

Run against `/home/maurice/Downloads/Epic Viking Warrior Music/Age Of Heroes` and confirm three files land in that folder:
`Age Of Heroes Tik Tok.webm`, `Age Of Heroes Youtube shorts.webm`, `Age Of Heroes.webm`, each playable with video + audio.

## Out of scope (YAGNI)

- Choosing the "best" 60 s window for shorts (always starts at 0).
- Per-song custom looks (single locked profile; edit the constant if needed).
- Uploading to platforms.
```
