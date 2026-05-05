# marketing-video

Remotion project for producing marketing videos for mortek books, apps, and music.

Lives in a subdirectory of the static site repo and is **not** deployed to GitHub Pages — only the rendered MP4s (which you upload separately to YouTube / socials) are the deliverable.

## Commands

Run all of these from this directory (`marketing-video/`).

```bash
npm run studio          # open Remotion Studio in browser for live editing
npm run build           # render landscape 1920x1080 mp4 to out/
npm run build:shorts    # render portrait 1080x1920 mp4 to out/
```

## Structure

- `src/index.ts` — Remotion entry, registers the root.
- `src/Root.tsx` — composition registry (landscape + shorts).
- `src/MarketingVideo.tsx` — the actual scene. Edit this to design the video.
- `remotion.config.ts` — render config.

## Verifying the install

```bash
npx remotion versions
```

## Notes

- React is pinned to v18 to match Remotion 4.x.
- `out/` and `node_modules/` are gitignored.
- Bringing in book covers / app screenshots: drop assets in `src/assets/` and import them, or use `staticFile()` from `remotion` after putting them in `public/`.
