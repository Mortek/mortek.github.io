# mortek.github.io

Static personal site (GitHub Pages). Plain HTML/CSS/JS, no build step. Each `.html` page is self-contained except for shared `style.css` / `style.min.css` and `site.js` / `site.min.js`. PWA via `sw.js` + `manifest.json`.

## Cache-busting on push (CSS/JS/HTML changes)

Every push that touches CSS/JS/HTML must bump:
- `sw.js` → `const CACHE = 'mortek-vN'` (currently v58)
- Any `?v=N` query strings on `<link>` / `<script>` tags
- `music_visualizer.html` → `<h1>` version span (currently v3.7.19) when that file changes

Then auto-commit and push without asking. RSS (`feed.xml`) gets a new `<item>` only when a new blog post is published.

## music_visualizer.html (~1992 lines, ~93KB) — structural map

Single-file canvas-based audio visualizer. Two tabs: Landscape (16:9) and Shorts (9:16).

| Lines        | Section |
|--------------|---------|
| 10–85        | Inline `<style>` |
| 87–476       | DOM: top bar, tabs, both panels, canvas `#c` (1280×720), seek/playback controls, settings grid, shorts controls |
| 477–500      | Globals: `C`/`ctx`/`W`/`H`, image/logo/audio state, particles, FX state (`bgZoom`, `bgBright`, `bgVig`, `bgHue`, `shakeX/Y`, `colorCycleT`) |
| 502–545      | Trail canvas + bass detection: `BASS_WEIGHTS`, `getBass`/`getSubBass`/`getMidBass`, `computeBassHit` (flux-based, sub-bass-dominant trigger) |
| 547–586      | Preferences (per-tab session cookie): `captureSettings`, `applySettings`, `loadPrefs`, `prefIds`/`prefRangeIds`/`prefCheckIds` |
| 587–650      | Color: `palettes`, `cycleOrder`, `hueRotateHex`, `lerpColor`, `pal`, `getCycledPal`, `randCol` |
| 652–706      | Image color extraction: `extractColors`, `applyImageColors` |
| 707–724      | `processLogoMask` |
| 725–895      | Particles: `mkParticle`, `drawP`, `updateP`, `manageParticles` (matrix/notes chars at 726–727) |
| 896–989      | Visualizers: `drawCircle` (main bar/ring renderer) |
| 990–1086     | `drawFrame` — main per-frame render (background, FX, particles, viz, logo) |
| 1087–1120    | Animation loop: `loop` + seek bar wiring |
| 1121–1196    | Audio setup: `playPreview`, `getCurrentTime`, `fmtTime`, shorts equivalents |
| 1197–1279    | File inputs: `loadLogoFromSrc` and image/audio/logo handlers |
| 1280–1410    | Seek / restart / mute / pause / clear handlers |
| 1411–1438    | EBML/WebM helpers: `u8`, `cat`, `vint`, `eid`, `el`, `elU`, `elF`, `elS`, `buildWebMPreamble`, `mkCluster` |
| 1440–1605    | `dlBtn` click handler — streaming WebM encode (low memory) |
| 1606–1675    | `setStatus`, `switchTab` (saves/restores landscape vs shorts state) |
| 1676–1786    | Shorts generator state + helpers (`getShortsAudio`, `updateShortsEnd`, `setShortsStatus`) |
| 1787–1987    | Shorts download handler + remaining wiring |

### Bass-trigger model (recent work)

`computeBassHit(data, state)` uses spectral flux on sub-bass band only — designed to fire on sustained sub-bass booms, *not* every kick. Tunables live inline (cooldown, sub-bass dominance ratio). State is held in `liveBassState` (line ~544). When tweaking sensitivity, adjust the dominance threshold and cooldown together; lowering one without the other tends to cause spurious triggers.

### Outro / shorts duration

Shorts have a fixed outro window subtracted from selectable durations — see `updateShortsEnd` and the shorts duration UI in the shorts panel.

## When to read which range

- Bass / pulse tuning → 502–545, 990–1086
- Particle behavior → 725–895
- Visualizer geometry → 896–989
- Color schemes / palettes → 587–650
- Adding a setting → add control in DOM (108–142 area), add id to `prefIds` (548), wire into `drawFrame`/`drawCircle`
- Video export → 1411–1605 (landscape), 1787+ (shorts)
- Tab switching bugs → 1611 `switchTab`
