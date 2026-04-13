# Blog Article Images & Button Styling Design
**Date:** 2026-04-13  
**Project:** Mortek Books & Blog  
**Scope:** Add banner and square images to 7 blog articles; darken "Read Article" buttons on books page

---

## Overview

This design adds visual richness to blog articles by incorporating banner images at article tops and square images within article content. Additionally, "Read Article" buttons on the books page will be styled with filled backgrounds for better visibility and prominence.

**What's being built:**
1. Darker, filled-style "Read Article" buttons on books.html
2. Full-width banner images below article meta info in 7 blog articles
3. Responsive square images with text wrapping at natural content breaks in blog articles
4. CSS classes supporting responsive behavior across mobile and desktop

---

## Architecture

### File Structure
```
books.html (modified)
└── Button styling only

blog/
├── stop-overthinking.html (modified)
├── the-stoic-mind.html (modified)
├── dopamine-detox.html (modified)
├── the-discipline-blueprint.html (modified)
├── wealth-without-permission.html (modified)
├── read-people-like-a-book.html (modified)
└── whole.html (modified)

books/book_banners_and_square_images/ (source images)
├── Stop Overthinking banner.png
├── Stop Overthinking 1000x1000.png
├── [... 6 more book pairs ...]
└── Whole 1000x1000.png

style.min.css (modified)
└── New CSS classes for images
```

### Button Styling Changes

**Target:** `.buy-btn--outline` class on books.html  
**Current:** Light outline style  
**New style:**
- Solid background color (darker shade of accent color or muted background)
- Improved contrast for visibility
- Maintained hover states
- Same padding and typography

**Implementation:** Modify existing `.buy-btn--outline` CSS rule

---

## Image Integration Strategy

### Banner Images (Article Top)

**Placement:** Below `.post-meta` section, before article content  
**HTML structure:**
```html
<div class="article-banner">
  <picture>
    <source srcset="path/to/banner.png" type="image/png">
    <img src="path/to/banner.png" alt="Book banner" width="1200" height="400" loading="lazy">
  </picture>
</div>
```

**CSS class `.article-banner`:**
- Full width on mobile
- Max-width constraint on desktop (match article max-width)
- Auto horizontal margins for centering
- Border-radius for subtle styling
- Margin spacing above/below
- Responsive sizing

### Square Images (Content Integration)

**Placement:** At natural content breaks (typically 1-2 per article)  
**HTML structure:**
```html
<figure class="article-image-float">
  <picture>
    <source srcset="path/to/1000x1000.png" type="image/png">
    <img src="path/to/1000x1000.png" alt="Book cover" width="350" height="350" loading="lazy">
  </picture>
</figure>
```

**CSS class `.article-image-float`:**
- **Mobile:** 100% width, no float, block display, full-width stacking
- **Desktop (768px+):** 
  - Width: 350-400px
  - Float: right
  - Margin: left spacing for text separation
  - Text flows and wraps around image on left side

---

## Data & Mappings

**Book-to-image mapping:**

| Book Title | Blog File | Banner Image | Square Image |
|---|---|---|---|
| Stop Overthinking | stop-overthinking.html | Stop Overthinking banner.png | Stop Overthinking 1000x1000.png |
| The Stoic Mind | the-stoic-mind.html | The Stoic Mind banner.png | The Stoic Mind 1000x1000.png |
| Dopamine Detox | dopamine-detox.html | Dopamine Detox banner.png | Dopamine Detox 1000x1000.png |
| The Discipline Blueprint | the-discipline-blueprint.html | The Discipline Blueprint banner.png | The Discipline Blueprint 1000x1000.png |
| Wealth Without Permission | wealth-without-permission.html | Wealth Without Permission banner.png | Wealth Without Permissions 1000x1000.png |
| Read People Like a Book | read-people-like-a-book.html | Read People Like a Book banner.png | Read People Like a Book 1000x1000.png |
| Whole | whole.html | Whole banner.png | Whole 1000x1000.png |

**Image paths:** `../books/book_banners_and_square_images/[filename]` (from blog/ directory)

---

## Responsive Behavior

### Mobile (< 768px)
- Banner image: 100% width, constrained by viewport
- Square images: 100% width, stack vertically in content flow
- No text wrapping around square images

### Desktop (≥ 768px)
- Banner image: constrained max-width, centered
- Square images: 350-400px, floated right, text wraps on left

### CSS Media Queries
- One breakpoint at 768px
- `.article-image-float` float property conditional on media query

---

## CSS Implementation Details

**New classes to add to style.min.css:**

```css
.article-banner {
  width: 100%;
  margin: 24px 0;
  border-radius: 8px;
  overflow: hidden;
}

.article-banner img {
  display: block;
  width: 100%;
  height: auto;
}

.article-image-float {
  margin: 0;
  width: 100%;
  margin-bottom: 16px;
}

.article-image-float img {
  width: 100%;
  height: auto;
  display: block;
}

@media (min-width: 768px) {
  .article-image-float {
    width: 350px;
    float: right;
    margin-left: 24px;
    margin-bottom: 16px;
  }
}
```

**Button styling change:**

Modify `.buy-btn--outline` to use filled background instead of outline:
- Background: `var(--surface)` or `rgba(224, 224, 224, 0.1)` (subtle surface color)
- Border: `1px solid var(--accent)` (accent color border)
- Or alternative: Background `var(--accent)` with darker text
- Maintains hover state enhancement
- Increases visual prominence compared to current outline style

---

## Testing Checklist

- [ ] Banner images display full-width and centered on mobile
- [ ] Banner images constrained on desktop with proper spacing
- [ ] Square images float right on desktop with text wrapping
- [ ] Square images stack full-width on mobile
- [ ] Image alt text is descriptive
- [ ] `loading="lazy"` works for performance
- [ ] No layout shift when images load
- [ ] Buttons have sufficient contrast in filled style
- [ ] Hover states still work on buttons
- [ ] All 7 articles have correct image paths

---

## Performance Considerations

- Use `loading="lazy"` on all images
- Images already exist as PNG files (no conversion needed)
- Consider future webp conversion if available
- Banner images should be optimized for web (check file sizes)

---

## Accessibility

- All images have descriptive `alt` attributes
- Proper `width` and `height` attributes to prevent layout shift
- `<picture>` elements for semantic image structure
- Sufficient color contrast on button changes
- Text wrapping doesn't create readability issues (standard CSS float)

---

## Success Criteria

✓ "Read Article" buttons are visually darker and more prominent  
✓ Banner images appear at top of all 7 blog articles  
✓ Square images appear at natural content breaks with text wrapping on desktop  
✓ All images are responsive and properly sized  
✓ Mobile layout stacks images vertically without wrapping  
✓ All image paths are correct and images load  
✓ No broken alt text or missing image attributes  
