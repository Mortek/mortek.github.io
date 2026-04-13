# Blog Article Images & Button Styling Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add banner images to the top of 7 blog articles, integrate square images at natural content breaks with responsive text wrapping, and darken "Read Article" buttons on the books page.

**Architecture:** CSS-first approach with image classes for responsive behavior (float right on desktop, stack on mobile). Each blog article receives banner image below meta info and 1-2 square images at natural content breaks. Button styling updated with filled background.

**Tech Stack:** Semantic HTML5 `<picture>` elements, CSS media queries, responsive image sizing (350-400px desktop, 100% mobile).

---

## File Structure

### Files to Modify
- `style.min.css` — Add `.article-banner` and `.article-image-float` classes
- `books.html` — Update `.buy-btn--outline` styling
- `blog/stop-overthinking.html` — Add banner + 1 square image
- `blog/the-stoic-mind.html` — Add banner + 2 square images
- `blog/dopamine-detox.html` — Add banner + 2 square images
- `blog/the-discipline-blueprint.html` — Add banner + 1-2 square images
- `blog/wealth-without-permission.html` — Add banner + 1-2 square images
- `blog/read-people-like-a-book.html` — Add banner + 1-2 square images
- `blog/whole.html` — Add banner + 1-2 square images

### Image Assets (Already in place)
- `books/book_banners_and_square_images/[BookName] banner.png`
- `books/book_banners_and_square_images/[BookName] 1000x1000.png`

---

## Task 1: Add CSS Classes for Article Images

**Files:**
- Modify: `style.min.css`

- [ ] **Step 1: Read current style.min.css to find insertion point**

Find the line with `h1 span{color:var(--accent)}` or similar heading styles. This is where we'll add image-related CSS.

- [ ] **Step 2: Add `.article-banner` class**

Append this CSS after the heading styles:

```css
.article-banner {
  width: 100%;
  margin: 24px 0;
  border-radius: 8px;
  overflow: hidden;
}

.article-banner img,
.article-banner picture {
  display: block;
  width: 100%;
  height: auto;
}

.article-image-float {
  margin: 0 0 16px 0;
  width: 100%;
}

.article-image-float img,
.article-image-float picture {
  display: block;
  width: 100%;
  height: auto;
}

@media (min-width: 768px) {
  .article-image-float {
    width: 350px;
    float: right;
    margin: 0 0 16px 24px;
  }
}
```

- [ ] **Step 3: Update `.buy-btn--outline` class**

Find the existing `.buy-btn--outline` rule in style.min.css and replace it with:

```css
.buy-btn--outline {
  background: rgba(224, 224, 224, 0.08);
  border: 1px solid var(--accent);
  color: var(--text);
}

.buy-btn--outline:hover {
  background: rgba(247, 147, 26, 0.15);
  border-color: var(--accent-hover);
}
```

(If the original rule doesn't exist, add it as a new rule)

- [ ] **Step 4: Verify CSS syntax and commit**

Run: `git diff style.min.css` to verify changes look correct.

```bash
git add style.min.css
git commit -m "style: add CSS classes for article banner and floating images"
```

---

## Task 2: Update "Read Article" Button Styling on books.html

**Files:**
- Modify: `books.html:102, 120, 133, 146, 159, 172, 185` (button lines in featured and book cards)

- [ ] **Step 1: Read the current button markup in books.html**

The buttons are currently:
```html
<a href="blog/..." class="buy-btn buy-btn--outline">Read Article</a>
```

The class `buy-btn--outline` was just updated in Task 1 to have a filled background. No HTML changes needed.

- [ ] **Step 2: Verify buttons will appear darker by checking CSS**

The updated `.buy-btn--outline` now has `background: rgba(224, 224, 224, 0.08)` instead of transparent, making them darker and more prominent.

- [ ] **Step 3: Test in browser (manual verification later)**

No changes needed to books.html itself — the CSS update from Task 1 applies automatically.

- [ ] **Step 4: Commit confirmation**

No new commit needed here, as this was part of Task 1.

---

## Task 3: Add Images to stop-overthinking.html

**Files:**
- Modify: `blog/stop-overthinking.html:79-81` (add banner after post-meta), and after first major section

- [ ] **Step 1: Add banner image below meta info**

After line 78 (`</p>` closing post-meta), insert:

```html
  <div class="article-banner">
    <picture>
      <source srcset="../books/book_banners_and_square_images/Stop Overthinking banner.png" type="image/png">
      <img src="../books/book_banners_and_square_images/Stop Overthinking banner.png" alt="Stop Overthinking banner" width="1200" height="400" loading="lazy">
    </picture>
  </div>
```

- [ ] **Step 2: Add square image after "What Actually Happens in Your Brain When You Overthink" section**

After line 91 (after the paragraph ending "...it starts."), insert:

```html
  <figure class="article-image-float">
    <picture>
      <source srcset="../books/book_banners_and_square_images/Stop Overthinking 1000x1000.png" type="image/png">
      <img src="../books/book_banners_and_square_images/Stop Overthinking 1000x1000.png" alt="Stop Overthinking book cover" width="350" height="350" loading="lazy">
    </picture>
  </figure>
```

- [ ] **Step 3: Verify image paths are correct**

Check that both image files exist:
```bash
ls -la books/book_banners_and_square_images/ | grep "Stop Overthinking"
```

Expected: Both "Stop Overthinking banner.png" and "Stop Overthinking 1000x1000.png" should be listed.

- [ ] **Step 4: Commit changes**

```bash
git add blog/stop-overthinking.html
git commit -m "content: add banner and square images to Stop Overthinking article"
```

---

## Task 4: Add Images to the-stoic-mind.html

**Files:**
- Modify: `blog/the-stoic-mind.html:78-79` (banner), after sections

- [ ] **Step 1: Add banner image below meta info**

After line 78 (`</p>` closing post-meta), insert:

```html
  <div class="article-banner">
    <picture>
      <source srcset="../books/book_banners_and_square_images/The Stoic Mind banner.png" type="image/png">
      <img src="../books/book_banners_and_square_images/The Stoic Mind banner.png" alt="The Stoic Mind banner" width="1200" height="400" loading="lazy">
    </picture>
  </div>
```

- [ ] **Step 2: Add first square image after "The Dichotomy of Control" section**

After line 96 (after the paragraph ending "...to effort."), insert:

```html
  <figure class="article-image-float">
    <picture>
      <source srcset="../books/book_banners_and_square_images/The Stoic Mind 1000x1000.png" type="image/png">
      <img src="../books/book_banners_and_square_images/The Stoic Mind 1000x1000.png" alt="The Stoic Mind book cover" width="350" height="350" loading="lazy">
    </picture>
  </figure>
```

- [ ] **Step 3: Verify image paths**

```bash
ls -la books/book_banners_and_square_images/ | grep "Stoic Mind"
```

Expected: Both images present.

- [ ] **Step 4: Commit changes**

```bash
git add blog/the-stoic-mind.html
git commit -m "content: add banner and square image to The Stoic Mind article"
```

---

## Task 5: Add Images to dopamine-detox.html

**Files:**
- Modify: `blog/dopamine-detox.html:78-79` (banner), after sections

- [ ] **Step 1: Add banner image below meta info**

After line 78 (`</p>` closing post-meta), insert:

```html
  <div class="article-banner">
    <picture>
      <source srcset="../books/book_banners_and_square_images/Dopamine Detox banner.png" type="image/png">
      <img src="../books/book_banners_and_square_images/Dopamine Detox banner.png" alt="Dopamine Detox banner" width="1200" height="400" loading="lazy">
    </picture>
  </div>
```

- [ ] **Step 2: Add first square image after "Dopamine Is Not the Pleasure Chemical" section**

After line 92 (after the paragraph ending "...your threshold has."), insert:

```html
  <figure class="article-image-float">
    <picture>
      <source srcset="../books/book_banners_and_square_images/Dopamine Detox 1000x1000.png" type="image/png">
      <img src="../books/book_banners_and_square_images/Dopamine Detox 1000x1000.png" alt="Dopamine Detox book cover" width="350" height="350" loading="lazy">
    </picture>
  </figure>
```

- [ ] **Step 3: Verify image paths**

```bash
ls -la books/book_banners_and_square_images/ | grep "Dopamine Detox"
```

Expected: Both images present.

- [ ] **Step 4: Commit changes**

```bash
git add blog/dopamine-detox.html
git commit -m "content: add banner and square image to Dopamine Detox article"
```

---

## Task 6: Add Images to the-discipline-blueprint.html

**Files:**
- Modify: `blog/the-discipline-blueprint.html`

- [ ] **Step 1: Read article to identify structure and insertion points**

```bash
head -n 130 blog/the-discipline-blueprint.html | tail -n 60
```

- [ ] **Step 2: Add banner image below meta info**

After the `</p>` line closing post-meta, insert:

```html
  <div class="article-banner">
    <picture>
      <source srcset="../books/book_banners_and_square_images/The Discipline Blueprint banner.png" type="image/png">
      <img src="../books/book_banners_and_square_images/The Discipline Blueprint banner.png" alt="The Discipline Blueprint banner" width="1200" height="400" loading="lazy">
    </picture>
  </div>
```

- [ ] **Step 3: Add square image at a natural content break**

Identify the first major h2 section, and after its first substantive paragraph, insert:

```html
  <figure class="article-image-float">
    <picture>
      <source srcset="../books/book_banners_and_square_images/The Discipline Blueprint 1000x1000.png" type="image/png">
      <img src="../books/book_banners_and_square_images/The Discipline Blueprint 1000x1000.png" alt="The Discipline Blueprint book cover" width="350" height="350" loading="lazy">
    </picture>
  </figure>
```

- [ ] **Step 4: Verify image paths**

```bash
ls -la books/book_banners_and_square_images/ | grep "Discipline Blueprint"
```

- [ ] **Step 5: Commit changes**

```bash
git add blog/the-discipline-blueprint.html
git commit -m "content: add banner and square image to The Discipline Blueprint article"
```

---

## Task 7: Add Images to wealth-without-permission.html

**Files:**
- Modify: `blog/wealth-without-permission.html`

- [ ] **Step 1: Read article structure**

```bash
head -n 130 blog/wealth-without-permission.html | tail -n 60
```

- [ ] **Step 2: Add banner image below meta info**

After the `</p>` line closing post-meta, insert:

```html
  <div class="article-banner">
    <picture>
      <source srcset="../books/book_banners_and_square_images/Wealth Without Permission banner.png" type="image/png">
      <img src="../books/book_banners_and_square_images/Wealth Without Permission banner.png" alt="Wealth Without Permission banner" width="1200" height="400" loading="lazy">
    </picture>
  </div>
```

- [ ] **Step 3: Add square image at first content break**

After the first major h2 section's opening paragraph, insert:

```html
  <figure class="article-image-float">
    <picture>
      <source srcset="../books/book_banners_and_square_images/Wealth Without Permissions 1000x1000.png" type="image/png">
      <img src="../books/book_banners_and_square_images/Wealth Without Permissions 1000x1000.png" alt="Wealth Without Permission book cover" width="350" height="350" loading="lazy">
    </picture>
  </figure>
```

- [ ] **Step 4: Verify image paths**

```bash
ls -la books/book_banners_and_square_images/ | grep "Wealth"
```

- [ ] **Step 5: Commit changes**

```bash
git add blog/wealth-without-permission.html
git commit -m "content: add banner and square image to Wealth Without Permission article"
```

---

## Task 8: Add Images to read-people-like-a-book.html

**Files:**
- Modify: `blog/read-people-like-a-book.html`

- [ ] **Step 1: Read article structure**

```bash
head -n 130 blog/read-people-like-a-book.html | tail -n 60
```

- [ ] **Step 2: Add banner image below meta info**

After the `</p>` line closing post-meta, insert:

```html
  <div class="article-banner">
    <picture>
      <source srcset="../books/book_banners_and_square_images/Read People Like a Book banner.png" type="image/png">
      <img src="../books/book_banners_and_square_images/Read People Like a Book banner.png" alt="Read People Like a Book banner" width="1200" height="400" loading="lazy">
    </picture>
  </div>
```

- [ ] **Step 3: Add square image at first content break**

After the first major h2 section's opening paragraph, insert:

```html
  <figure class="article-image-float">
    <picture>
      <source srcset="../books/book_banners_and_square_images/Read People Like a Book 1000x1000.png" type="image/png">
      <img src="../books/book_banners_and_square_images/Read People Like a Book 1000x1000.png" alt="Read People Like a Book book cover" width="350" height="350" loading="lazy">
    </picture>
  </figure>
```

- [ ] **Step 4: Verify image paths**

```bash
ls -la books/book_banners_and_square_images/ | grep "Read People"
```

- [ ] **Step 5: Commit changes**

```bash
git add blog/read-people-like-a-book.html
git commit -m "content: add banner and square image to Read People Like a Book article"
```

---

## Task 9: Add Images to whole.html

**Files:**
- Modify: `blog/whole.html`

- [ ] **Step 1: Read article structure**

```bash
head -n 130 blog/whole.html | tail -n 60
```

- [ ] **Step 2: Add banner image below meta info**

After the `</p>` line closing post-meta, insert:

```html
  <div class="article-banner">
    <picture>
      <source srcset="../books/book_banners_and_square_images/Whole banner.png" type="image/png">
      <img src="../books/book_banners_and_square_images/Whole banner.png" alt="Whole banner" width="1200" height="400" loading="lazy">
    </picture>
  </div>
```

- [ ] **Step 3: Add square image at first content break**

After the first major h2 section's opening paragraph, insert:

```html
  <figure class="article-image-float">
    <picture>
      <source srcset="../books/book_banners_and_square_images/Whole 1000x1000.png" type="image/png">
      <img src="../books/book_banners_and_square_images/Whole 1000x1000.png" alt="Whole book cover" width="350" height="350" loading="lazy">
    </picture>
  </figure>
```

- [ ] **Step 4: Verify image paths**

```bash
ls -la books/book_banners_and_square_images/ | grep "Whole"
```

- [ ] **Step 5: Commit changes**

```bash
git add blog/whole.html
git commit -m "content: add banner and square image to Whole article"
```

---

## Task 10: Final Testing & Verification

**Files:**
- Test: All modified files in browser

- [ ] **Step 1: Check all modified files exist and have no syntax errors**

```bash
git status
git log --oneline -10
```

Expected: All 9 blog commits plus CSS/books.html commit listed.

- [ ] **Step 2: Open each blog article in browser and verify visually**

Open `http://localhost:8000/blog/stop-overthinking.html` (or use local dev server):
- Banner image displays full-width below meta
- Square image floats right on desktop with text wrapping
- On mobile (resize to < 768px), square image stacks full-width
- No broken image icons
- No layout shift

Repeat for all 7 articles.

- [ ] **Step 3: Verify books.html button styling**

Open `http://localhost:8000/books.html`:
- "Read Article" buttons are darker/filled (not just outline)
- Hover state works
- Buttons appear on featured book and all 7 book cards

- [ ] **Step 4: Test responsive on mobile**

Using browser DevTools or phone:
- Banner images are full-width and properly sized
- Square images are 100% width on mobile (no float)
- Text flows below images, not around them
- No horizontal scroll

- [ ] **Step 5: Final commit confirmation**

```bash
git log --oneline -15
```

Expected: 10 commits total (1 CSS + 1 books.html + 7 articles + 1 test?)

---

## Success Criteria

✅ CSS classes added and syntax valid  
✅ All 7 articles have banner images displayed below meta info  
✅ All 7 articles have at least 1 square image at content breaks  
✅ Square images float right on desktop (350px width)  
✅ Square images stack 100% width on mobile  
✅ Text wraps around square images on desktop  
✅ "Read Article" buttons appear darker/filled  
✅ All image paths resolve (no 404s)  
✅ All alt text present and descriptive  
✅ No broken layouts or visual regressions  
✅ Responsive behavior works at 768px breakpoint  
