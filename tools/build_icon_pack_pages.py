#!/usr/bin/env python3
"""Rebuild the icon pack landing pages from the icon pack repo (store texts and screenshots).

Run: python3 -I tools/build_icon_pack_pages.py [--force] [--no-images] [pack ...]

For every <pack>-icon-pack.html in the site root whose pack exists in the icon pack repo
(default ~/Projects/mortek-icon-packs, override with ICONPACKS_REPO):
  * images: the 8 English store screenshots (out/screenshots/<pack>/en/01..08) become WebP in
    apps/icon-packs/<pack>/shots/<slot>-360.webp and -540.webp (srcset), and the 12 wallpapers
    (out/wallpapers/<pack>/wallpaper_NN.webp) become small thumbnails in apps/icon-packs/<pack>/wp/NN.webp.
    A file is only rewritten when its source is newer (or with --force), so re-running after the
    screenshots are re-shot is cheap.
  * text: packs/<pack>/store/listing_seo/en/short.txt (meta descriptions, JSON-LD) and full.txt
    (the "About this icon pack" section) are rendered into the page.
  * the page: everything between <!-- ip:begin --> and <!-- ip:end --> is generated (gallery,
    feature cards, wallpapers, about text, launcher note). The first run inserts the markers.
The head, title, h1, trailer, blog link and hub link of each page are kept as they are.
No em dashes anywhere. Nothing is pushed by this script.
"""
import html
import json
import os
import re
import sys

from PIL import Image

SITE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REPO = os.environ.get("ICONPACKS_REPO", os.path.expanduser("~/Projects/mortek-icon-packs"))
DOMAIN = "https://mortek.github.io"
PRICE = "1.99"

# slot file prefix, shown order, alt text part
SHOTS = [
    ("02_preview", "preview", "the icon preview with every icon of the pack"),
    ("05_before_after", "before-after", "a before and after of the home screen"),
    ("04_drawer", "drawer", "the pack's icons in the app drawer"),
    ("03_folder", "folder", "the pack's icons in a launcher folder"),
    ("08_wallpapers", "wallpapers", "the Wallpapers tab with 12 matching wallpapers"),
    ("01_home", "home", "the home tab, the app dashboard"),
    ("06_apply", "apply", "the Apply tab for one-tap setup in your launcher"),
    ("07_request", "request", "the Request tab for icons that are still missing"),
]
WIDTHS = (360, 540)


def rd(path):
    with open(path, encoding="utf-8") as f:
        return f.read()


def wr(path, text):
    with open(path, "w", encoding="utf-8") as f:
        f.write(text)


def stale(src, dst, force):
    return force or not os.path.exists(dst) or os.path.getmtime(src) > os.path.getmtime(dst)


def build_images(pack, force):
    """Returns (list of shot slots present, list of wallpaper numbers present)."""
    out = os.path.join(SITE, "apps", "icon-packs", pack)
    shots, wps = [], []
    sd = os.path.join(REPO, "out", "screenshots", pack, "en")
    os.makedirs(os.path.join(out, "shots"), exist_ok=True)
    for prefix, slot, _ in SHOTS:
        src = os.path.join(sd, prefix + ".png")
        if not os.path.exists(src):
            continue
        shots.append(slot)
        for w in WIDTHS:
            dst = os.path.join(out, "shots", f"{slot}-{w}.webp")
            if stale(src, dst, force):
                im = Image.open(src).convert("RGB")
                h = round(im.height * w / im.width)
                im.resize((w, h), Image.LANCZOS).save(dst, "WEBP", quality=76, method=6)
    feat = os.path.join(REPO, "out", "feature", pack, "en.png")  # current English feature graphic
    if os.path.exists(feat):
        dst = os.path.join(out, "banner.webp")
        if stale(feat, dst, force):
            Image.open(feat).convert("RGB").resize((1024, 500), Image.LANCZOS).save(dst, "WEBP", quality=80, method=6)
    wd = os.path.join(REPO, "out", "wallpapers", pack)
    os.makedirs(os.path.join(out, "wp"), exist_ok=True)
    for n in range(1, 13):
        src = os.path.join(wd, f"wallpaper_{n:02d}.webp")
        if not os.path.exists(src):
            continue
        wps.append(n)
        dst = os.path.join(out, "wp", f"{n:02d}.webp")
        if stale(src, dst, force):
            im = Image.open(src).convert("RGB")
            im.resize((180, round(im.height * 180 / im.width)), Image.LANCZOS).save(dst, "WEBP", quality=70, method=6)
    return shots, wps


def read_listing(pack):
    d = os.path.join(REPO, "packs", pack, "store", "listing_seo", "en")
    return rd(os.path.join(d, "short.txt")).strip(), rd(os.path.join(d, "full.txt")).strip()


HEAD_RE = re.compile(r"^[A-Z][A-Z0-9 ,'&/-]{2,}$")


def render_full(full):
    """Store full description to HTML: intro paragraph, headings, lists, paragraphs."""
    blocks = re.split(r"\n\s*\n", full)
    out, first = [], True
    lines = []
    for b in blocks:
        lines.extend(b.split("\n"))
        lines.append("")
    i, listtype, buf = 0, None, []

    def flush():
        nonlocal listtype, buf
        if buf:
            out.append(f"<{listtype}>\n" + "\n".join(f"<li>{x}</li>" for x in buf) + f"\n</{listtype}>")
        listtype, buf = None, []

    def nxt(j):
        while j < len(lines) and not lines[j].strip():
            j += 1
        return lines[j].strip() if j < len(lines) else ""

    for idx, raw in enumerate(lines):
        line = raw.strip()
        if not line:
            flush()
            continue
        esc = html.escape(line, quote=True)
        m = re.match(r"^(\d+)\.\s+(.*)$", line)
        b = re.match(r"^[-*•]\s+(.*)$", line)
        if m:
            if listtype not in (None, "ol"):
                flush()
            listtype = "ol"
            buf.append(html.escape(m.group(2), quote=True))
            continue
        if b:
            if listtype not in (None, "ul"):
                flush()
            listtype = "ul"
            buf.append(html.escape(b.group(1), quote=True))
            continue
        flush()
        prev_blank = idx == 0 or not lines[idx - 1].strip()
        following = nxt(idx + 1)
        short_title = bool(
            len(line) < 42 and prev_blank and out and following and not re.search(r"[.!?:]$", line)
        ) or bool(HEAD_RE.match(line) and out)
        if short_title:
            out.append(f"<h3>{html.escape(line[0] + line[1:].lower(), quote=True)}</h3>")
        elif first:
            out.append(f'<p class="ip-lead">{esc}</p>')
            first = False
        else:
            out.append(f"<p>{esc}</p>")
    flush()
    return "\n".join(out)


def split_title(page):
    m = re.search(r"<title>(.*?) - Mortek</title>", page)
    return html.unescape(m.group(1))


def img_tag(pack, slot, alt, lazy=True, sizes="(min-width:760px) 22vw, 62vw"):
    base = f"apps/icon-packs/{pack}/shots/{slot}"
    w1, w2 = WIDTHS
    attrs = 'loading="lazy" decoding="async"' if lazy else 'fetchpriority="high"'
    return (f'<img src="{base}-{w2}.webp" srcset="{base}-{w1}.webp {w1}w, {base}-{w2}.webp {w2}w" sizes="{sizes}" '
            f'alt="{html.escape(alt, quote=True)}" width="{w2}" height="960" {attrs}>')


def block(pack, title, shots, wps, full, short):
    alts = {slot: alt for _, slot, alt in SHOTS}
    gal = "\n".join(
        "      " + img_tag(pack, s, f"{title}, {alts[s]}", lazy=(i > 1))
        for i, s in enumerate(shots)
    )
    wall = "\n".join(
        f'      <img src="apps/icon-packs/{pack}/wp/{n:02d}.webp" alt="{html.escape(title, quote=True)} wallpaper {n} of 12" width="180" height="400" loading="lazy" decoding="async">'
        for n in wps
    )
    wall_sec = f"""
  <section class="ip-wallpapers fade-in">
    <h2>12 matching wallpapers</h2>
    <p>Every wallpaper is made to go with the icons. Set one for the home screen, the lock screen or both, straight from the app.</p>
    <div class="ip-wall-strip">
{wall}
    </div>
  </section>
""" if wps else ""
    feats = [
        ("&#127912;", "2,900+ icons", "Every icon in one hand-made style, with a matching tile for apps that have no icon yet"),
        ("&#127748;", "12 matching wallpapers", "Set a wallpaper for the home screen, the lock screen or both from inside the app"),
        ("&#127763;", "Dark and light", "Switch between light and dark with the toggle in the app, or let it follow your phone"),
        ("&#128241;", "Works with your launcher", "Nova, Lawnchair, Niagara, Smart, Apex and ADW launchers all take icon packs: open the app and press Apply"),
        ("&#128179;", f"One-time EUR {PRICE}", "Pay once on Google Play, no subscription and no in-app purchases to unlock icons"),
        ("&#128683;", "No ads, no analytics", "The app only goes online when you tap Send on an icon request"),
    ]
    fhtml = "\n".join(
        f'''    <div class="feature fade-in">
      <div class="emoji" aria-hidden="true">{e}</div>
      <strong>{t}</strong>
      <p>{d}</p>
    </div>''' for e, t, d in feats)
    return f"""<!-- ip:begin -->
  <section class="ip-gallery-wrap fade-in" aria-label="App screenshots">
    <h2>Screenshots</h2>
    <div class="ip-gallery">
{gal}
    </div>
  </section>

  <div class="features ip-features">
{fhtml}
  </div>
{wall_sec}
  <section class="fade-in ip-about">
    <h2>About this icon pack</h2>
{render_full(full)}
  </section>

  <section class="fade-in ip-note">
    <h2>Which launcher do I need?</h2>
    <p>Icon packs work through a launcher that supports them, such as Nova Launcher, Lawnchair, Niagara, Smart Launcher, Apex Launcher or ADW Launcher. Install one, set it as your home app, open {html.escape(title.split(":")[0])} and press Apply for your launcher.</p>
    <p><strong>Samsung phone?</strong> Samsung's own launcher (One UI Home) does not support icon packs, so Samsung owners first install one of the launchers above. The app includes a short step by step guide for it.</p>
  </section>
  <!-- ip:end -->"""


def jsonld(pack, title, short, shots, page):
    m = re.search(r'"url": "(https://play\.google\.com/[^"]+)"', page)
    data = {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": title,
        "operatingSystem": "Android",
        "applicationCategory": "DesignApplication",
        "description": short,
        "image": f"{DOMAIN}/apps/icon-packs/{pack}/icon.webp",
        "screenshot": [f"{DOMAIN}/apps/icon-packs/{pack}/shots/{s}-540.webp" for s in shots],
        "offers": {"@type": "Offer", "price": PRICE, "priceCurrency": "EUR"},
        "author": {"@type": "Organization", "name": "Mortek"},
        "url": m.group(1),
    }
    return '<script type="application/ld+json">\n' + json.dumps(data, indent=2, ensure_ascii=False) + "\n</script>"


def patch(pack, force, images):
    path = os.path.join(SITE, f"{pack}-icon-pack.html")
    page = rd(path)
    title = split_title(page)
    if images:
        shots, wps = build_images(pack, force)
    else:
        shots = [s for _, s, _ in SHOTS if os.path.exists(os.path.join(SITE, "apps/icon-packs", pack, "shots", f"{s}-540.webp"))]
        wps = [n for n in range(1, 13) if os.path.exists(os.path.join(SITE, "apps/icon-packs", pack, "wp", f"{n:02d}.webp"))]
    short, full = read_listing(pack)
    assert "—" not in short + full, f"{pack}: em dash in the store text"
    esc = html.escape(short, quote=True)
    page = re.sub(r'(<meta name="description" content=")[^"]*"', lambda m: m.group(1) + esc + '"', page, count=1)
    page = re.sub(r'(<meta property="og:description" content=")[^"]*"', lambda m: m.group(1) + esc + '"', page, count=1)
    page = re.sub(r'(<meta name="twitter:description" content=")[^"]*"', lambda m: m.group(1) + esc + '"', page, count=1)
    page = re.sub(r'<script type="application/ld\+json">.*?</script>', lambda m: jsonld(pack, title, short, shots, page), page, count=1, flags=re.S)
    new = block(pack, title, shots, wps, full, short)
    if "<!-- ip:begin -->" in page:
        a = page.index("<!-- ip:begin -->")
        b = page.index("<!-- ip:end -->") + len("<!-- ip:end -->")
    else:
        a = page.index('<div class="screenshot-slider')
        a = page.rindex("\n", 0, a) + 1 + 2  # keep the two-space indent
        mark = page.index("<h2>About this icon pack</h2>")
        b = page.index("</section>", mark) + len("</section>")
    page = page[:a] + new + page[b:]
    wr(path, page)
    return len(shots), len(wps)


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    force, images = "--force" in sys.argv, "--no-images" not in sys.argv
    packs = args or sorted(
        f[: -len("-icon-pack.html")] for f in os.listdir(SITE)
        if f.endswith("-icon-pack.html") and os.path.isdir(os.path.join(REPO, "packs", f[: -len("-icon-pack.html")]))
    )
    for p in packs:
        s, w = patch(p, force, images)
        print(f"{p}: {s} screenshots, {w} wallpapers")
    print(f"{len(packs)} pack pages rebuilt")


if __name__ == "__main__":
    main()
