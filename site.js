document.addEventListener('DOMContentLoaded', () => {
  /* === Fade-in observer === */
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in-view'); obs.unobserve(e.target); }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.fade-in').forEach(el => obs.observe(el));

  /* === Service worker === */
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js');

  /* === Slider logic === */
  document.querySelectorAll('.slider').forEach(s => {
    const t = s.querySelector('.slider-track');
    const p = s.querySelector('.slider-btn--prev');
    const n = s.querySelector('.slider-btn--next');
    if (!t || !p || !n) return;
    const u = () => {
      p.classList.toggle('hidden', t.scrollLeft < 10);
      n.classList.toggle('hidden', t.scrollLeft >= t.scrollWidth - t.clientWidth - 10);
    };
    p.addEventListener('click', () => t.scrollBy({ left: -t.clientWidth * 0.7, behavior: 'smooth' }));
    n.addEventListener('click', () => t.scrollBy({ left: t.clientWidth * 0.7, behavior: 'smooth' }));
    t.addEventListener('scroll', u, { passive: true });
    window.addEventListener('load', u);
    u();
  });

  /* === Books grid slider override === */
  const bg = document.querySelector('.books-grid');
  if (bg) {
    const bs = bg.closest('.books-slider');
    const bp = bs && bs.querySelector('.slider-btn--prev');
    const bn = bs && bs.querySelector('.slider-btn--next');
    const step = () => bg.clientWidth;
    if (bp && bn) {
      bp.replaceWith(bp.cloneNode(true));
      bn.replaceWith(bn.cloneNode(true));
      const bp2 = bs.querySelector('.slider-btn--prev');
      const bn2 = bs.querySelector('.slider-btn--next');
      const ub = () => {
        bp2.classList.toggle('hidden', bg.scrollLeft < 10);
        bn2.classList.toggle('hidden', bg.scrollLeft >= bg.scrollWidth - bg.clientWidth - 10);
      };
      bp2.addEventListener('click', () => { bg.scrollBy({ left: -step(), behavior: 'smooth' }); setTimeout(ub, 350); });
      bn2.addEventListener('click', () => { bg.scrollBy({ left: step(), behavior: 'smooth' }); setTimeout(ub, 350); });
      ub();
    }
    let sx, sy, sl, dir;
    bg.addEventListener('touchstart', e => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; sl = bg.scrollLeft; dir = null; }, { passive: true });
    bg.addEventListener('touchmove', e => {
      if (dir === 'y') return;
      const dx = e.touches[0].clientX - sx, dy = e.touches[0].clientY - sy;
      if (!dir) { if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return; dir = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'; if (dir === 'y') return; }
      bg.scrollLeft = sl - dx;
    }, { passive: true });
    bg.addEventListener('touchend', () => { if (dir === 'x') { const cw = step(); bg.scrollTo({ left: Math.round(bg.scrollLeft / cw) * cw, behavior: 'smooth' }); } dir = null; }, { passive: true });
  }

  /* === FAQ accordion === */
  document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.parentElement;
      const open = item.classList.toggle('open');
      btn.setAttribute('aria-expanded', open);
    });
  });

  /* === Lightbox === */
  const lb = document.getElementById('lightbox');
  if (lb) {
    const lbImg = lb.querySelector('img');
    const lbCounter = lb.querySelector('.lightbox-counter');
    const lbPrev = lb.querySelector('.lightbox-btn--prev');
    const lbNext = lb.querySelector('.lightbox-btn--next');
    const lbClose = lb.querySelector('.lightbox-close');
    const imgs = [...document.querySelectorAll('.screenshot-slider .slider-track img')];
    let idx = 0;
    function showImg(i) { idx = i; lbImg.src = imgs[i].src; lbImg.alt = imgs[i].alt; lbCounter.textContent = (i + 1) + ' / ' + imgs.length; }
    function open(i) { showImg(i); lb.classList.add('active'); document.body.style.overflow = 'hidden'; }
    function close() { lb.classList.remove('active'); document.body.style.overflow = ''; }
    function prev() { showImg((idx - 1 + imgs.length) % imgs.length); }
    function next() { showImg((idx + 1) % imgs.length); }
    imgs.forEach((img, i) => img.addEventListener('click', () => open(i)));
    lbClose.addEventListener('click', close);
    lbPrev.addEventListener('click', prev);
    lbNext.addEventListener('click', next);
    lb.addEventListener('click', e => { if (e.target === lb) close(); });
    document.addEventListener('keydown', e => {
      if (!lb.classList.contains('active')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    });
  }

  /* === Scroll progress bar === */
  const bar = document.getElementById('scrollProgress');
  if (bar) {
    window.addEventListener('scroll', () => {
      const h = document.documentElement;
      bar.style.width = (h.scrollTop / (h.scrollHeight - h.clientHeight) * 100) + '%';
    }, { passive: true });
  }

  /* === Blog category filter === */
  const filters = document.querySelectorAll('.filter-btn');
  if (filters.length) {
    const cards = document.querySelectorAll('.article-card');
    filters.forEach(btn => {
      btn.addEventListener('click', () => {
        filters.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const cat = btn.dataset.filter;
        cards.forEach(card => {
          const badge = card.querySelector('.article-badge');
          if (cat === 'all' || (badge && badge.textContent.trim() === cat)) {
            card.classList.remove('filter-hidden');
          } else {
            card.classList.add('filter-hidden');
          }
        });
      });
    });
  }

  /* === Blog post TOC === */
  const postContent = document.querySelector('.blog-post-content');
  if (postContent) {
    const headings = postContent.querySelectorAll('h2');
    if (headings.length >= 2) {
      const toc = document.createElement('nav');
      toc.className = 'toc';
      toc.setAttribute('aria-label', 'Table of contents');
      const title = document.createElement('div');
      title.className = 'toc-title';
      title.textContent = 'Contents';
      toc.appendChild(title);
      const ol = document.createElement('ol');
      headings.forEach((h, i) => {
        const id = 'section-' + (i + 1);
        h.id = id;
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = '#' + id;
        a.textContent = h.textContent;
        li.appendChild(a);
        ol.appendChild(li);
      });
      toc.appendChild(ol);
      postContent.parentNode.insertBefore(toc, postContent);
    }
  }

  /* === Copy link button === */
  document.querySelectorAll('.share-btn[aria-label="Copy link"]').forEach(btn => {
    btn.addEventListener('click', () => {
      navigator.clipboard.writeText(window.location.href);
      btn.classList.add('copied');
      setTimeout(() => btn.classList.remove('copied'), 1500);
    });
  });

  /* === Back to top === */
  if (document.documentElement.scrollHeight > window.innerHeight * 2) {
    const btn = document.createElement('button');
    btn.className = 'back-to-top';
    btn.setAttribute('aria-label', 'Back to top');
    btn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M18 15l-6-6-6 6"/></svg>';
    document.body.appendChild(btn);
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => { btn.classList.toggle('visible', window.scrollY > 500); ticking = false; });
        ticking = true;
      }
    }, { passive: true });
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  /* === Navigation progress indicator === */
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href]');
    if (!a || a.target === '_blank' || a.getAttribute('href').startsWith('mailto:') || a.getAttribute('href').startsWith('#')) return;
    const href = a.getAttribute('href');
    if (href.startsWith('http') && !href.includes('mortek.github.io')) return;
    const p = document.createElement('div');
    p.className = 'nav-progress';
    document.body.appendChild(p);
  });
});
