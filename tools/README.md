# Site tools

- `build_icon_pack_pages.py`: rebuilds the 27 `<pack>-icon-pack.html` pages from the icon pack repo (store texts in `packs/<p>/store/listing_seo/en`, English screenshots `out/screenshots/<p>/en`, wallpapers `out/wallpapers/<p>`, feature graphics `out/feature/<p>/en.png`), writes WebP to `apps/icon-packs/<p>/`. Re-run after screenshots or texts change: `python3 -I tools/build_icon_pack_pages.py [--force] [pack ...]`.
- `build_icon_pack_posts.py`: generates the icon pack blog posts from `posts-src/icon-packs/posts.json`, refreshes the screenshots in the older posts, rebuilds the cards (blog.html), feed items and sitemap entries. Run the pages script first.
- `build_game_posts.py`: game blog posts (separate marker block in blog.html and feed.xml).
- `check_site.py`: offline link, sitemap, redirect and price check, prints `SITE OK`.

After any run: bump `CACHE` in `sw.js` and the `?v=` of `style.min.css`.
