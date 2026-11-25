#!/usr/bin/env python3
"""Flip Crystal Garden from 'Coming soon' to live on Google Play. Run: python3 -I tools/crystal_garden_live.py
Edits crystal-garden.html (store badge + JSON-LD url), games-and-apps.html (drops the Coming Soon badge)
and tools/build_game_posts.py (CG_LIVE = True), then rebuilds the posts. Afterwards bump CACHE in sw.js and the ?v= of style.min.css."""
import os, re, subprocess
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
PLAY = "https://play.google.com/store/apps/details?id=com.mortek.crystalgarden"
N = "Crystal Garden: Idle Merge"
badge = (f'<a class="store-badge" href="{PLAY}" target="_blank" rel="noopener" aria-label="Get {N} on Google Play">\n'
         '    <img src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png" alt="Get it on Google Play" width="646" height="250" loading="lazy">\n  </a>')
def edit(path, fn):
    s = open(path, encoding="utf-8").read(); s = fn(s); open(path, "w", encoding="utf-8").write(s)
def page(s):
    s = re.sub(r"<!--LIVE:store-->.*?<!--/LIVE:store-->", lambda m: "<!--LIVE:store-->" + badge + "<!--/LIVE:store-->", s, flags=re.S)
    if f'"url": "{PLAY}"' not in s:
        s = s.replace('  "author": { "@type": "Organization", "name": "Mortek" },', f'  "author": {{ "@type": "Organization", "name": "Mortek" }},\n  "url": "{PLAY}",', 1)
    return s
edit("crystal-garden.html", page)
edit("games-and-apps.html", lambda s: re.sub(r"\s*<!--CG-SOON-->.*?<!--/CG-SOON-->", "", s, flags=re.S))
edit("tools/build_game_posts.py", lambda s: s.replace("CG_LIVE = False", "CG_LIVE = True"))
subprocess.run(["python3", "-I", "tools/build_game_posts.py"], check=True)
print("Crystal Garden is now live in the site files. Also reword 'coming soon' sentences in posts-src/crystal-garden by hand, then bump sw.js CACHE and css ?v=.")
