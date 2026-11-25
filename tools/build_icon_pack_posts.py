#!/usr/bin/env python3
"""Icon pack blog posts: generate the posts that do not exist yet, refresh the screenshots in all of them,
and rebuild the icon pack cards in blog.html, the items in feed.xml and the blog entries in sitemap.xml.

Run: python3 -I tools/build_icon_pack_posts.py

* posts-src/icon-packs/posts.json holds the hand-written text of each generated post (title, subtitle,
  description, intro, two sections, colour list). The rest of the page is a template (see build_post).
  A post whose slug file already exists is rewritten from the JSON, so edit the JSON and re-run.
* The 14 older icon pack posts (hand-made HTML, not in posts.json) keep their text; only their inline
  screenshots are replaced by the new store screenshots in apps/icon-packs/<pack>/shots/ (made by
  tools/build_icon_pack_pages.py, run that first).
* Cards and feed items of all icon pack posts live between <!-- ICON-PACK-POSTS --> markers (outside the
  GAME-POSTS block that tools/build_game_posts.py rewrites).
No em dashes. Nothing is pushed.
"""
import glob
import html
import json
import os
import re
from datetime import datetime

SITE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(SITE)
D = "https://mortek.github.io"
PRICE = "1.99"
DATE = "2026-11-25"
BASE = "blog/balloon-foil-icon-pack-story.html"  # head and footer template
OLD_TITLE = "Crimped Seams and Rainbow Film: Drawing Foil Balloons for Your Phone"
OLD_DESC = "Why we made Balloon, an Android icon pack of puffy mirror foil balloon icons with ten foil shades and almost 3,000 icons."
esc = html.escape

SHOT_ALT = {
    "preview": "the icon preview in the app",
    "before-after": "a before and after of the home screen",
    "wallpapers": "the Wallpapers tab with 12 matching wallpapers",
    "drawer": "the icons in the app drawer",
}


def rd(p):
    return open(p, encoding="utf-8").read()


def wr(p, t):
    open(p, "w", encoding="utf-8").write(t)


def pack_info(pack):
    page = rd(f"{pack}-icon-pack.html")
    name = html.unescape(re.search(r"<title>(.*?) - Mortek</title>", page).group(1))
    play = re.search(r'"url": "(https://play\.google\.com/[^"]+)"', page).group(1)
    return name, play


def fig(pack, slot, name, caption):
    b = f"../apps/icon-packs/{pack}/shots/{slot}"
    alt = f"{name}, {SHOT_ALT[slot]}"
    return (f'<figure class="article-inline article-inline--portrait"><img src="{b}-540.webp" srcset="{b}-360.webp 360w, {b}-540.webp 540w" '
            f'sizes="300px" width="540" height="960" alt="{esc(alt, quote=True)}" loading="lazy" decoding="async"><figcaption>{esc(caption)}</figcaption></figure>')


def pack_slug(pack, posts):
    """file name of the story post of a pack (generated or older)"""
    if pack in posts:
        return posts[pack]["slug"] + ".html"
    for f in glob.glob("blog/*icon-pack-story.html"):
        if f'property="og:image" content="{D}/apps/icon-packs/{pack}/banner.webp"' in rd(f):
            return os.path.basename(f)
    raise KeyError(pack)


def titles():
    """slug -> h1 title for every post that has a pack story in the blog"""
    out = {}
    for f in glob.glob("blog/*icon-pack-story.html"):
        out[os.path.basename(f)] = html.unescape(re.search(r"<h1>(.*?)</h1>", rd(f)).group(1))
    return out


def build_post(pack, p, posts, name, play):
    slug = p["slug"]
    url = f"{D}/blog/{slug}.html"
    base = rd(BASE)
    head = base[: base.index('<script type="application/ld+json">')]
    t, desc = p["title"], p["description"]
    head = head.replace(OLD_TITLE, esc(t)).replace(OLD_DESC, esc(desc, quote=True))
    head = head.replace("blog/balloon-foil-icon-pack-story.html", f"blog/{slug}.html")
    head = head.replace("apps/icon-packs/balloon/banner.webp", f"apps/icon-packs/{pack}/banner.webp")
    head = head.replace("2026-11-16", DATE)
    footer = base[base.index("<footer>"):]
    rel = [pack_slug(r, posts) for r in p["related"]]
    ttl = titles()

    def rtitle(s):
        if s in ttl:
            return ttl[s]
        for x in posts.values():
            if x["slug"] + ".html" == s:
                return x["title"]
        raise KeyError(s)

    rel_names = []
    for r in p["related"]:
        rn, _ = pack_info(r)
        rel_names.append((r, rn))
    more = " and ".join(f'<a href="../{r}-icon-pack.html">{esc(rn)}</a>' for r, rn in rel_names)
    short = name.split(":")[0]
    body = f"""<p>{esc(p["intro"])}</p>

<h2>{esc(p["style_h"])}</h2>
<p>{esc(p["style_p"])}</p>

{fig(pack, "before-after", name, f"Before and after: a home screen with {short} applied.")}

<h2>{esc(p["make_h"])}</h2>
<p>{esc(p["make_p"])}</p>

<h2>What is inside</h2>
<ul>
<li>2,900+ icons in one style, in {esc(p["colours"])}.</li>
<li>A fallback tile for apps that have no icon of their own yet, {esc(p["tile"])}, on launchers that let an icon pack supply one, so the grid has no gaps.</li>
<li>12 matching wallpapers, made to go with the icons. Set one for the home screen, the lock screen or both from the Wallpapers tab.</li>
<li>Dark and light mode, with a toggle in the app or following your phone, and search across the whole set.</li>
<li>An icon request screen. Tap Send and the list of apps you see, plus an email if you type one, goes straight to the developer. That is the only time the app goes online.</li>
<li>No ads, no analytics and no subscription. It is a one-time purchase of EUR {PRICE} on Google Play.</li>
</ul>
<p>All the symbols are generic. They are drawn by our own tools, and none of them copies a company logo, so no app is promised an exact match. Apps get a symbol that suits what they do, in a colour close to their own.</p>

{fig(pack, "preview", name, "The preview tab shows the icons before you apply them.")}

<h2>Twelve wallpapers to match</h2>
<p>An icon pack looks best on a wallpaper that belongs to it, so {esc(short)} comes with twelve. They share the colours and the mood of the icons, and you can set any of them from the app without installing anything else.</p>

{fig(pack, "wallpapers", name, f"The Wallpapers tab of {short}.")}

<h2>How to use it</h2>
<ol>
<li>Install a launcher that supports icon packs, such as Nova Launcher, Lawnchair, Niagara, Smart Launcher, Apex Launcher or ADW Launcher. Your current one may already.</li>
<li>Open {esc(short)} and go to the Apply tab. Pick your launcher for a one-tap apply, or open the launcher settings and choose {esc(short)} as the icon pack.</li>
<li>Later, after the pack has been updated, tap Refresh icons in the app to apply the new set again. If the launcher still shows old icons, restart it.</li>
</ol>
<p><strong>On a Samsung phone?</strong> Samsung's own launcher, One UI Home, does not support icon packs, so install one of the launchers above first and set it as your home app. The app has a short guide that walks you through it.</p>

<h2>Take a look</h2>
<p>You can read more on the <a href="../{pack}-icon-pack.html">{esc(name)} page</a> or go straight to <a href="{play}" target="_blank" rel="noopener">{esc(short)} on Google Play</a>. If an icon you need is missing, send us a request from the app and we will see what we can do.</p>
<p><strong>More icon packs:</strong> {more}.</p>"""
    wc = len(re.sub(r"<[^>]+>", " ", body).split())
    rt = max(3, round(wc / 220))
    ld = {
        "@context": "https://schema.org", "@type": "BlogPosting", "headline": t, "description": desc,
        "author": {"@type": "Person", "name": "Maurice Moret"},
        "publisher": {"@type": "Organization", "name": "Mortek", "logo": {"@type": "ImageObject", "url": f"{D}/icon-512.png"}},
        "datePublished": DATE, "dateModified": DATE, "url": url,
        "image": f"{D}/apps/icon-packs/{pack}/banner.webp",
        "mainEntityOfPage": {"@type": "WebPage", "@id": url}, "wordCount": wc,
        "about": {"@type": "SoftwareApplication", "name": name, "operatingSystem": "Android", "url": play},
    }
    bc = {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": 1, "name": "Home", "item": f"{D}/"},
        {"@type": "ListItem", "position": 2, "name": "Blog", "item": f"{D}/blog.html"},
        {"@type": "ListItem", "position": 3, "name": t}]}
    j = lambda o: '<script type="application/ld+json">\n' + json.dumps(o, indent=2, ensure_ascii=False) + "\n</script>\n"
    related_cards = "\n".join(
        f'      <a href="{s}" class="related-card"><span class="related-badge">Making of</span><h4>{esc(rtitle(s))}</h4></a>' for s in rel)
    page = head + j(ld) + j(bc) + f"""</head>
<body>
<a href="#main-content" class="skip-link">Skip to content</a>
<div class="scroll-progress" id="scrollProgress"></div>

""" + header_from(base) + f"""
<main id="main-content" class="blog-post">
  <div class="blog-post-header">
    <nav class="breadcrumb"><a href="/">Home</a><span>/</span><a href="../blog.html">Blog</a><span>/</span>{esc(name)}</nav>
    <h1>{esc(t)}</h1>
    <p class="post-subtitle">{esc(p["subtitle"])}</p>
    <p class="post-meta">By Maurice Moret &middot; {datetime.strptime(DATE, "%Y-%m-%d").strftime("%B %Y")} &middot; <span class="reading-time">{rt} min read</span></p>
    <div class="article-banner"><img src="../apps/icon-packs/{pack}/banner.webp" alt="{esc(name)} icon pack key art" width="1024" height="500" loading="lazy"></div>
  </div>

  <article class="blog-post-content">
{body}
  </article>

  <div class="blog-cta">
    <img src="../apps/icon-packs/{pack}/icon.webp" alt="{esc(name)} app icon" width="256" height="256" loading="lazy">
    <div class="blog-cta-text">
      <h3>{esc(name)}</h3>
      <p>2,900+ icons and 12 wallpapers. One-time purchase of EUR {PRICE}, no ads, no subscription.</p>
      <a href="{play}" target="_blank" rel="noopener" class="buy-btn">Get it on Google Play</a>
    </div>
  </div>
  <p style="text-align:center;margin-top:20px"><a href="../{pack}-icon-pack.html" style="color:var(--accent);font-size:0.9em">About {esc(name)} &rarr;</a></p>

  <div class="related-posts">
    <h3>Keep Reading</h3>
    <div class="related-grid">
{related_cards}
      </div>
  </div>
</main>

""" + footer
    wr(f"blog/{slug}.html", page)
    return wc


def header_from(base):
    a = base.index("<header>")
    b = base.index("</header>") + len("</header>\n")
    return base[a:b]


def card(slug, t, desc):
    return f'''    <a href="blog/{slug}.html" class="article-card fade-in" data-type="icon-packs">
      <span class="article-badge">Making of</span><span class="article-type article-type--pack">Icon Pack</span>
      <h3>{esc(t)}</h3>
      <p>{esc(desc)}</p>
    </a>
'''


def item(slug, t, desc):
    d = datetime.strptime(DATE, "%Y-%m-%d").strftime("%a, %d %b %Y")
    return f'''  <item>
    <title>{esc(t)}</title>
    <link>{D}/blog/{slug}.html</link>
    <guid>{D}/blog/{slug}.html</guid>
    <pubDate>{d} 00:00:00 +0000</pubDate>
    <description>{esc(desc)}</description>
  </item>

'''


def refresh_old_figures():
    """Older posts: replace the two inline screenshots (1.webp, 2.webp) by the new before/after and preview shots."""
    n = 0
    for f in glob.glob("blog/*icon-pack-story.html"):
        t = rd(f)
        m = re.search(r'\.\./apps/icon-packs/([a-z]+)/1\.webp', t)
        if not m:
            continue
        pack = m.group(1)
        name, _ = pack_info(pack)
        short = name.split(":")[0]
        pat = re.compile(r'<figure class="article-inline article-inline--portrait"><img src="\.\./apps/icon-packs/' + pack + r'/(\d)\.webp".*?</figure>', re.S)

        def sub(mm):
            if mm.group(1) == "1":
                return fig(pack, "before-after", name, f"Before and after: a home screen with {short} applied.")
            return fig(pack, "preview", name, "The preview tab shows the icons before you apply them.")
        t2 = pat.sub(sub, t)
        if t2 != t:
            wr(f, t2)
            n += 1
    return n


def main():
    posts = json.load(open("posts-src/icon-packs/posts.json", encoding="utf-8"))
    for pack, p in posts.items():
        name, play = pack_info(pack)
        build_post(pack, p, posts, name, play)
    nold = refresh_old_figures()

    # cards, feed items, sitemap for every icon pack post
    new_slugs = {p["slug"] for p in posts.values()}
    b = rd("blog.html")
    f = rd("feed.xml")
    old_cards = re.findall(r'    <a href="blog/[^"]*icon-pack-story\.html".*?</a>\n', b, flags=re.S)
    old_cards = [c for c in old_cards if not any(f"blog/{s}.html" in c for s in new_slugs)]
    b = re.sub(r'    <a href="blog/[^"]*icon-pack-story\.html".*?</a>\n', "", b, flags=re.S)
    b = re.sub(r"    <!-- ICON-PACK-POSTS -->\n.*?    <!-- /ICON-PACK-POSTS -->\n", "", b, flags=re.S)
    new_cards = "".join(card(p["slug"], p["title"], p["description"]) for p in sorted(posts.values(), key=lambda x: x["slug"]))
    b = b.replace("    <!-- GAME-POSTS -->\n", "    <!-- ICON-PACK-POSTS -->\n" + new_cards + "".join(old_cards) + "    <!-- /ICON-PACK-POSTS -->\n    <!-- GAME-POSTS -->\n", 1)
    wr("blog.html", b)

    old_items = re.findall(r"  <item>\n(?:(?!</item>).)*?icon-pack-story\.html.*?</item>\n\n", f, flags=re.S)
    old_items = [i for i in old_items if not any(f"blog/{s}.html" in i for s in new_slugs)]
    f = re.sub(r"  <item>\n(?:(?!</item>).)*?icon-pack-story\.html.*?</item>\n\n", "", f, flags=re.S)
    f = re.sub(r"  <!-- ICON-PACK-POSTS -->\n.*?  <!-- /ICON-PACK-POSTS -->\n", "", f, flags=re.S)
    new_items = "".join(item(p["slug"], p["title"], p["description"]) for p in sorted(posts.values(), key=lambda x: x["slug"]))
    f = f.replace("  <!-- /GAME-POSTS -->\n", "  <!-- /GAME-POSTS -->\n  <!-- ICON-PACK-POSTS -->\n" + "".join(old_items) + new_items + "  <!-- /ICON-PACK-POSTS -->\n", 1)
    wr("feed.xml", f)

    s = rd("sitemap.xml")
    add = ""
    for p in posts.values():
        loc = f"{D}/blog/{p['slug']}.html"
        if loc not in s:
            add += f"  <url>\n    <loc>{loc}</loc>\n    <lastmod>{DATE}</lastmod>\n    <priority>0.6</priority>\n  </url>\n"
    s = s.replace("</urlset>", add + "</urlset>")
    wr("sitemap.xml", s)
    print(f"{len(posts)} posts generated, {nold} older posts got the new screenshots, {len(old_cards)} older cards kept")


if __name__ == "__main__":
    main()
