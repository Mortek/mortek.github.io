#!/bin/bash
# Auto-generates sitemap.xml by scanning HTML files in the project.
# Run: bash generate-sitemap.sh

DOMAIN="https://mortek.github.io"
DATE=$(date +%Y-%m-%d)
OUT="sitemap.xml"

cat > "$OUT" << 'HEADER'
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
HEADER

# Priority map
get_priority() {
  case "$1" in
    index.html)          echo "1.0" ;;
    apps.html|books.html) echo "0.8" ;;
    about.html|blog.html) echo "0.7" ;;
    music.html|music_visualizer.html) echo "0.6" ;;
    blog/*.html)         echo "0.6" ;;
    privacy_policy.html) echo "0.3" ;;
    *)                   echo "0.5" ;;
  esac
}

# Root HTML files (excluding 404)
for f in *.html; do
  [ "$f" = "404.html" ] && continue
  [ "$f" = "privacy_policy.html" ] || [ "$f" = "music_visualizer.html" ] || true

  if [ "$f" = "index.html" ]; then
    url="$DOMAIN/"
  else
    url="$DOMAIN/$f"
  fi

  priority=$(get_priority "$f")

  echo "  <url>" >> "$OUT"
  echo "    <loc>$url</loc>" >> "$OUT"
  echo "    <lastmod>$DATE</lastmod>" >> "$OUT"
  echo "    <priority>$priority</priority>" >> "$OUT"

  # Add image tags for books page
  if [ "$f" = "books.html" ]; then
    for cover in books/book_covers/*.jpg; do
      name=$(basename "$cover" .jpg | tr '_' ' ')
      echo "    <image:image>" >> "$OUT"
      echo "      <image:loc>$DOMAIN/$cover</image:loc>" >> "$OUT"
      echo "      <image:title>$name by Maurice Moret</image:title>" >> "$OUT"
      echo "    </image:image>" >> "$OUT"
    done
  fi

  # Add profile image for about page
  if [ "$f" = "about.html" ]; then
    echo "    <image:image>" >> "$OUT"
    echo "      <image:loc>$DOMAIN/books/profielfoto.jpeg</image:loc>" >> "$OUT"
    echo "      <image:title>Maurice Moret</image:title>" >> "$OUT"
    echo "    </image:image>" >> "$OUT"
  fi

  echo "  </url>" >> "$OUT"
done

# Blog posts
for f in blog/*.html; do
  url="$DOMAIN/$f"
  priority=$(get_priority "$f")
  echo "  <url>" >> "$OUT"
  echo "    <loc>$url</loc>" >> "$OUT"
  echo "    <lastmod>$DATE</lastmod>" >> "$OUT"
  echo "    <priority>$priority</priority>" >> "$OUT"
  echo "  </url>" >> "$OUT"
done

echo "</urlset>" >> "$OUT"

echo "Generated $OUT with $(grep -c '<url>' "$OUT") URLs ($(date))"
