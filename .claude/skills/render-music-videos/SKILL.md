---
name: render-music-videos
description: Use when the user wants to batch-render Mortek music-visualizer videos for a song folder — generates the TikTok short, YouTube short, and landscape .webm by driving music_visualizer.html headlessly. Triggers - "render the videos for <folder>", "make the visualizer videos", "batch render music videos".
---

# Render Music Videos

Batch-renders the three visualizer videos (TikTok short, YouTube short, landscape) for one song folder or a parent of song folders, using the headless renderer at `tools/batch-render/`. It drives the real `music_visualizer.html` via puppeteer-core + system Chrome, so output is identical to rendering by hand.

## Expected folder contents (per song)

- `<title>.mp3` — audio (defines `<title>`)
- `<title>.png` — landscape image
- `<title> Tik Tok.png` — TikTok portrait image
- `<title> Youtube shorts.png` — YouTube Shorts portrait image (matched case-insensitively)

Any other PNG (e.g. `<title> 2MB.png`) is ignored. The logo is always
`/home/maurice/Documents/Music/Youtube/profile_picture_transparant_background.png`.

## How to run

1. First time only, install deps: `cd tools/batch-render && npm install`
2. Run the batch (renders shorts first, then landscape; skips any `.webm` that already exists):
   `node tools/batch-render/render.mjs "<folder>"`

`<folder>` can be a single song folder (contains an `.mp3`) or a parent folder (recurses one level into song subfolders).

Outputs land in the same folder: `<title> Tik Tok.webm`, `<title> Youtube shorts.webm`, `<title>.webm`. Report the final `Summary:` line and any `FAIL`/`SKIP` reasons. A non-zero exit means a render failed or an image variant was missing.

### Flags
- `--overwrite` — re-render even if the target `.webm` exists (default: skip existing, so re-runs resume).
- `--headless` — run windowless (see performance note below).
- `--concurrency N` — render N videos at once (default 1). Each render is CPU/GPU-heavy; raising this competes for resources. Safe (each render is isolated), but 1 is recommended on a laptop.

## Performance & memory (important)

- **Headful is the default** and uses the **GPU**, which is far faster for this canvas+VP8 workload (~matches manual speed). A Chrome window appears per render — that's expected. `--headless` runs windowless but falls back to **CPU/SwiftShader software rendering**, which is several times slower (a 60-sec short can take minutes). Only use `--headless` when there is no display.
- The renderer **streams the encoded video straight to disk** (it shims `showSaveFilePicker` to pipe chunks to a Node write stream), so memory stays bounded — it does NOT buffer the whole video in RAM. This mirrors the low-memory path the manual UI uses with the File System Access API.
- It clicks the Download buttons via the element's own DOM `.click()` (not screen coordinates) so the fixed-position **Donate** button can't intercept the click.

## Locked look

Settings are applied explicitly before each render from a locked profile in `tools/batch-render/profile.mjs` (`LANDSCAPE_PROFILE` / `SHORTS_PROFILE`). Shorts use 60-sec clips from the start. Landscape uses the full song. Edit `profile.mjs` and re-run with `--overwrite` to change the look.

## Cleanup note

If a run is force-killed (not a clean exit), an orphaned automation Chrome may linger. Kill only puppeteer's Chrome (never the user's normal browser) with:
`for pid in $(pgrep -f enable-automation); do case "$(ps -o comm= -p $pid)" in *hrome*) kill $pid;; esac; done`
Leftover `.render-tmp-*` dirs in a song folder are safe to delete.
