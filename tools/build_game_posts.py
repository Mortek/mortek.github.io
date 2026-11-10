#!/usr/bin/env python3
"""Build game blog posts from posts-src/<game>/<slug>.json + <slug>.html (body fragment).
Writes blog/<slug>.html, then rewrites the game cards between the GAME-POSTS markers in blog.html,
the feed items between the GAME-POSTS markers in feed.xml. Run: python3 -I tools/build_game_posts.py"""
import json, glob, os, re, html
from datetime import datetime
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
GAMES = {
 "void-swarm": dict(name="Void Swarm: Idle Survivor", short="Void Swarm", url="https://play.google.com/store/apps/details?id=com.mortek.voidswarm", btn="Get it on Google Play", icon="apps/void swarm/app_icon.png", page="void-swarm.html", blurb="Pilot a lone drone against endless alien swarms. Upgrade your base while idle, with 20 weapons, 8 drones and 12 languages."),
 "crypto-mining-tycoon": dict(name="Crypto Mining: Idle Clicker", short="Crypto Mining", url="https://play.google.com/store/apps/details?id=com.mortek.cryptominingtycoon", btn="Get it on Google Play", icon="apps/crypto mining tycoon/app_icon.png", page="crypto-mining-tycoon.html", blurb="Tap to mine, buy upgrades, prestige for multipliers and build the ultimate crypto empire. An idle incremental game for Android."),
 "capy-kingdom": dict(name="Capy Kingdom: Idle Shooter", short="Capy Kingdom", url="https://play.google.com/store/apps/details?id=com.mortek.capykingdom", btn="Get it on Google Play", icon="apps/capy kingdom/app_icon.png", page="capy-kingdom.html", blurb="A calm capybara hero shoots on its own. Upgrade, merge and earn even offline."),
 "tower-defense-kingdom": dict(name="Tower Defense Kingdom: Idle TD", short="Tower Defense Kingdom", url="https://play.google.com/store/apps/details?id=com.mortek.towerdefensekingdom", btn="Get it on Google Play", icon="apps/tower defense kingdom/app_icon.png", page="tower-defense-kingdom.html", blurb="Defend your kingdom across 100 maps with elemental towers, fusion and relics."),
 "shadowrealm": dict(name="Shadowrealm: Age of Darkness", short="Shadowrealm", url="https://www.playshadowrealm.com", btn="Play free at playshadowrealm.com", icon=None, page="shadowrealm.html", blurb="A dark fantasy RPG played entirely in your browser. Build your character, forge gear, battle rivals and conquer four cities."),
}
D = "https://mortek.github.io"
tpl = open("blog/whole.html", encoding="utf-8").read()
head_tpl = tpl[:tpl.index('<script type="application/ld+json">')]
footer = tpl[tpl.index("<footer>"):]
esc = html.escape

def banner_img(g, post):
    return f"../blog/img/{g}/{post.get('banner','banner')}.webp".replace("../blog/","")

posts = []
for jf in sorted(glob.glob("posts-src/*/*.json")):
    p = json.load(open(jf, encoding="utf-8")); g = jf.split("/")[1]
    p["game"] = g; p["body"] = open(jf[:-5] + ".html", encoding="utf-8").read()
    posts.append(p)
posts.sort(key=lambda p: (p["date"], p["slug"]))

def fix_body(b):
    # figures: <figure class="article-inline" ...> authored with src="img/<game>/x.webp"; make width/height real
    def img(m):
        src = m.group(1)
        path = "blog/" + src
        assert os.path.exists(path), f"missing image {path}"
        w, h = Image.open(path).size
        return f'src="{src}" width="{w}" height="{h}"'
    return re.sub(r'src="(img/[^"]+\.webp)"(?: width="\d+" height="\d+")?', img, b)
from PIL import Image

def words(b): return len(re.sub(r"<[^>]+>", " ", b).split())

for p in posts:
    g = GAMES[p["game"]]; slug = p["slug"]; url = f"{D}/blog/{slug}.html"
    body = fix_body(p["body"]); wc = words(body); rt = max(3, round(wc / 220))
    dt = datetime.strptime(p["date"], "%Y-%m-%d"); human = dt.strftime("%B %Y")
    title, desc = p["title"], p["description"]
    og = f"{D}/blog/img/{p['game']}/banner.webp"
    banner = f"img/{p['game']}/banner.webp"; bw, bh = Image.open("blog/" + banner).size
    related = [q for q in posts if q["slug"] != slug and q["game"] == p["game"]][:2]
    other = [q for q in posts if q["game"] != p["game"]]
    related.append(other[(hash(slug) % len(other))] if False else other[sum(map(ord, slug)) % len(other)])
    faq = p.get("faq", [])
    head = head_tpl
    head = re.sub(r'<meta name="description" content="[^"]*">', f'<meta name="description" content="{esc(desc)}">', head)
    head = head.replace("Why True Health Is More Than Physical Fitness, Mortek Blog", esc(title) + " | Mortek Blog")
    head = re.sub(r'(<meta (?:property="og:description"|name="twitter:description") content=")[^"]*"', lambda m: m.group(1) + esc(desc) + '"', head)
    head = head.replace("https://mortek.github.io/blog/whole.html", url).replace("https://mortek.github.io/og-books.png", og)
    head = head.replace('content="2026-04-09"', f'content="{p["date"]}"')
    head = head.replace("style.min.css?v=72", "style.min.css?v=81")
    ld = {"@context": "https://schema.org", "@type": "Article", "headline": title, "description": desc,
          "author": {"@type": "Person", "name": "Maurice Moret"},
          "publisher": {"@type": "Organization", "name": "Mortek", "logo": {"@type": "ImageObject", "url": f"{D}/icon-512.png"}},
          "datePublished": p["date"], "dateModified": p["date"], "url": url, "image": og,
          "mainEntityOfPage": {"@type": "WebPage", "@id": url}, "wordCount": wc, "about": {"@type": "VideoGame" if p["game"] != "shadowrealm" else "VideoGame", "name": g["name"], "url": g["url"]}}
    bc = {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": 1, "name": "Home", "item": D + "/"},
        {"@type": "ListItem", "position": 2, "name": "Blog", "item": D + "/blog.html"},
        {"@type": "ListItem", "position": 3, "name": p.get("crumb", title)}]}
    ldj = "".join(f'<script type="application/ld+json">\n{json.dumps(x, indent=2, ensure_ascii=False)}\n</script>\n' for x in [ld, bc] + (
        [{"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [{"@type": "Question", "name": q["q"], "acceptedAnswer": {"@type": "Answer", "text": q["a"]}} for q in faq]}] if faq else []))
    shell = tpl[tpl.index("</head>"):tpl.index('<main id="main-content"')]
    cta_icon = f'<img src="../{g["icon"]}" alt="{esc(g["name"])} app icon" width="256" height="256" loading="lazy">' if g["icon"] else f'<img src="img/shadowrealm/banner.webp" alt="Shadowrealm: Age of Darkness" width="960" height="608" loading="lazy">'
    rel = "".join(f'<a href="{q["slug"]}.html" class="related-card"><span class="related-badge">{esc(q["badge"])}</span><h4>{esc(q["title"])}</h4></a>\n      ' for q in related)
    faqhtml = ""
    if faq:
        faqhtml = "<h2>Frequently Asked Questions</h2>\n" + "".join(f"<h3>{esc(q['q'])}</h3>\n<p>{esc(q['a'])}</p>\n" for q in faq)
    more = f'<p style="text-align:center;margin-top:20px"><a href="../{g["page"]}" style="color:var(--accent);font-size:0.9em">About {esc(g["name"])} &rarr;</a></p>' if g["page"] else ""
    page = head + ldj + shell + f'''<main id="main-content" class="blog-post">
  <div class="blog-post-header">
    <nav class="breadcrumb"><a href="/">Home</a><span>/</span><a href="../blog.html">Blog</a><span>/</span>{esc(p.get("crumb", title))}</nav>
    <h1>{esc(title)}</h1>
    <p class="post-subtitle">{esc(p["subtitle"])}</p>
    <p class="post-meta">By Maurice Moret &middot; {human} &middot; <span class="reading-time">{rt} min read</span></p>
    <div class="article-banner"><img src="{banner}" alt="{esc(g["name"])} key art" width="{bw}" height="{bh}" loading="lazy"></div>
  </div>

  <article class="blog-post-content">
{body}
{faqhtml}  </article>

  <div class="blog-cta">
    {cta_icon}
    <div class="blog-cta-text">
      <h3>{esc(g["name"])}</h3>
      <p>{esc(g["blurb"])}</p>
      <a href="{g["url"]}" target="_blank" rel="noopener" class="buy-btn">{esc(g["btn"])}</a>
    </div>
  </div>
  {more}

  <div class="related-posts">
    <h3>Keep Reading</h3>
    <div class="related-grid">
      {rel}</div>
  </div>
</main>

''' + footer
    open(f"blog/{slug}.html", "w", encoding="utf-8").write(page)

# blog.html cards (newest first) between markers
cards = "".join(f'''    <a href="blog/{p["slug"]}.html" class="article-card fade-in" data-type="games" data-game="{p["game"]}">
      <span class="article-badge">{esc(p["badge"])}</span><span class="article-type article-type--game">Game</span>
      <h3>{esc(p["title"])}</h3>
      <p>{esc(p["card"])}</p>
    </a>
''' for p in reversed(posts))
b = open("blog.html", encoding="utf-8").read()
b = re.sub(r"(<!-- GAME-POSTS -->\n).*?(    <!-- /GAME-POSTS -->)", lambda m: m.group(1) + cards + m.group(2), b, flags=re.S)
open("blog.html", "w", encoding="utf-8").write(b)

items = "".join(f'''  <item>
    <title>{esc(p["title"])}</title>
    <link>{D}/blog/{p["slug"]}.html</link>
    <guid>{D}/blog/{p["slug"]}.html</guid>
    <pubDate>{datetime.strptime(p["date"], "%Y-%m-%d").strftime("%a, %d %b %Y")} 00:00:00 +0000</pubDate>
    <description>{esc(p["description"])}</description>
  </item>

''' for p in posts)
f = open("feed.xml", encoding="utf-8").read()
f = re.sub(r"(  <!-- GAME-POSTS -->\n).*?(  <!-- /GAME-POSTS -->)", lambda m: m.group(1) + items + m.group(2), f, flags=re.S)
open("feed.xml", "w", encoding="utf-8").write(f)
print(len(posts), "posts built")
