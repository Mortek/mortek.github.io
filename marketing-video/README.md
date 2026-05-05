# marketing-video

Remotion project for producing marketing videos for mortek books, apps, and music.

Lives in a subdirectory of the static site repo and is **not** deployed to GitHub Pages — only the rendered MP4s (which you upload separately to YouTube / socials) are the deliverable.

## Commands

Run all of these from this directory.

```bash
npm run studio          # open Remotion Studio in browser for live editing
npm run build:whole     # render Whole shorts (1080x1920) to out/whole-short.mp4
```

## Structure

- `src/index.ts` — Remotion entry.
- `src/Root.tsx` — composition registry. Add new compositions here.
- `src/books/` — generic `BookShort` composition + scene components + per-book metadata.
- `public/` — assets served via `staticFile()` (book art, music, voice WAVs).
- `.tools/` — local Piper TTS binary + voice model (gitignored).
- `remotion.config.ts` — render config.

## Audio assets

- `public/audio/music-bed.mp3` — "Heartwarming" by Kevin MacLeod (incompetech.com), CC BY 4.0. **Attribution required when publishing the rendered videos** — include in YouTube/Instagram description: *Music: "Heartwarming" by Kevin MacLeod (incompetech.com) — CC BY 4.0.*
- `public/audio/voice/<book>/{hook,cover,pillars,cta}.wav` — narration generated locally with Piper TTS (en_US-amy-medium voice).

## Regenerating voice lines

Voices are generated locally with Kokoro TTS (`af_bella` voice — warm American female):

```bash
PY=.tools/kokoro-env/bin/python
$PY .tools/gen_voice.py af_bella public/audio/voice/<book>/<scene>.wav "Your line."
```

Available Kokoro voices: `af_bella`, `af_nicole`, `af_sarah`, `af_sky`, `am_adam`, `am_michael`, `bf_emma`, `bf_isabella`, `bm_george`, `bm_lewis`.

The Kokoro model files (`kokoro-v1.0.onnx`, `kokoro-voices-v1.0.bin`) and the venv (`.tools/kokoro-env/`) are gitignored.

## Verifying the install

```bash
./node_modules/.bin/remotion versions
```

## Notes

- React is pinned to v18 to match Remotion 4.x.
- `out/`, `node_modules/`, and `.tools/` are gitignored.
- Bringing in book covers / app screenshots: drop assets in `public/books/<id>/` and reference via `staticFile()`.
