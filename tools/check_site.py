#!/usr/bin/env python3
"""Offline checks for the static site: internal links and images, sitemap, redirects, price text, tag balance.

Run: python3 -I tools/check_site.py   (exit code 1 when something is wrong)
"""
import glob
import os
import re
import sys
from html.parser import HTMLParser
from urllib.parse import unquote, urlparse

SITE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(SITE)
DOMAIN = "https://mortek.github.io"
VOID = {"meta", "link", "img", "br", "hr", "input", "source", "area", "base", "col", "embed", "wbr", "path", "circle", "rect", "stop", "line", "polyline"}
errors = []


class P(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.refs, self.stack, self.ids = [], [], set()

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if "id" in a:
            self.ids.add(a["id"])
        for k in ("href", "src", "poster"):
            if a.get(k):
                self.refs.append(a[k])
        if a.get("srcset"):
            self.refs += [re.sub(r"\s+\d+[wx]$", "", c.strip()) for c in a["srcset"].split(", ")]
        if tag not in VOID:
            self.stack.append(tag)

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag not in VOID and self.stack:
            self.stack.pop()

    def handle_endtag(self, tag):
        if tag in VOID:
            return
        if tag in self.stack:
            while self.stack and self.stack[-1] != tag:
                self.stack.pop()  # tolerated: optional end tags
            self.stack.pop()
        else:
            self.bad = getattr(self, "bad", []) + [tag]


def target(page, ref):
    ref = ref.strip()
    if not ref or ref.startswith(("#", "mailto:", "tel:", "data:", "javascript:")):
        return None
    if ref.startswith(("http://", "https://")):
        if not ref.startswith(DOMAIN):
            return None
        path = urlparse(ref).path
        if path.startswith("/privacy/"):
            return None  # separate repo (Mortek/privacy)
    else:
        path = urlparse(ref).path
        if not path:
            return None
        if not path.startswith("/"):
            path = "/" + os.path.normpath(os.path.join(os.path.dirname(page), path)).replace(os.sep, "/")
    path = unquote(path).lstrip("/")
    if path == "" or path.endswith("/"):
        path += "index.html"
    return path


pages = [f for f in glob.glob("**/*.html", recursive=True) if not f.startswith(("node_modules/", "tools/", "marketing-video/", "posts-src/", "docs/", "shadowrealm-shots/"))]
nref = 0
for f in sorted(pages):
    p = P()
    txt = open(f, encoding="utf-8").read()
    p.feed(txt)
    if getattr(p, "bad", None):
        errors.append(f"{f}: unmatched end tags {sorted(set(p.bad))[:5]}")
    for r in p.refs:
        t = target(f, r)
        if t is None:
            continue
        nref += 1
        if not os.path.exists(t):
            errors.append(f"{f}: broken link {r}")
    if "—" in txt and not f.startswith(("books", "blog/")) and f.endswith("-icon-pack.html"):
        errors.append(f"{f}: em dash")
    if re.search(r"(EUR|&euro;|€)\s?1[.,](49|79)", txt):
        errors.append(f"{f}: old price")
    if "<title" not in txt and "refresh" not in txt and not f.startswith("google"):
        errors.append(f"{f}: no title")

# sitemap
sm = open("sitemap.xml", encoding="utf-8").read()
locs = re.findall(r"<loc>([^<]+)</loc>", sm)
for u in locs:
    if u.startswith(DOMAIN):
        t = target("index.html", u)
        if not os.path.exists(t):
            errors.append(f"sitemap: missing {u}")
if len(locs) != len(set(locs)):
    errors.append("sitemap: duplicate urls")
for f in pages:
    if f.startswith(("terms/", "blog/")) or "/" in f:
        continue
    t = open(f, encoding="utf-8").read()
    if 'content="noindex' in t or 'http-equiv="refresh"' in t or f in ("404.html",) or f.startswith("google"):
        if f"{DOMAIN}/{f}" in locs:
            errors.append(f"sitemap lists a redirect/noindex page: {f}")

# redirects
for old in ("games.html", "apps.html"):
    t = open(old, encoding="utf-8").read()
    ok = ('http-equiv="refresh" content="0; url=games-and-apps.html"' in t and "location.replace('games-and-apps.html'" in t
          and f'rel="canonical" href="{DOMAIN}/games-and-apps.html"' in t and '<a href="games-and-apps.html"' in t)
    if not ok:
        errors.append(f"{old}: redirect page incomplete")

# feed and blog index
feed = open("feed.xml", encoding="utf-8").read()
for slug in re.findall(r"<link>https://mortek\.github\.io/(blog/[^<]+)</link>", feed):
    if not os.path.exists(slug):
        errors.append(f"feed: missing {slug}")
blog = open("blog.html", encoding="utf-8").read()
for post in glob.glob("blog/*icon-pack-story.html"):
    if post not in blog:
        errors.append(f"blog.html lacks a card for {post}")
    if f"{DOMAIN}/{post}" not in feed:
        errors.append(f"feed lacks {post}")
    if f"{DOMAIN}/{post}" not in sm:
        errors.append(f"sitemap lacks {post}")

print(f"{len(pages)} pages, {nref} internal references, {len(locs)} sitemap urls checked")
if errors:
    print("\n".join(errors[:60]))
    print(f"{len(errors)} problems")
    sys.exit(1)
print("SITE OK")
