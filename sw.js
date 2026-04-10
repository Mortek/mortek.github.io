const CACHE = 'mortek-v15';
const PRECACHE = [
  '/',
  '/index.html',
  '/apps.html',
  '/books.html',
  '/music.html',
  '/about.html',
  '/blog.html',
  '/404.html',
  '/style.min.css?v=35',
  '/favicon.svg',
  '/manifest.json',
  '/apple-touch-icon.png',
  '/icon-192.png',
  '/icon-512.png',
  '/books/profielfoto.webp',
  '/books/profielfoto.jpeg',
  '/books/book_covers/Stop_Overthinking.webp',
  '/books/book_covers/The_Stoic_Mind.webp',
  '/books/book_covers/Dopamine_Detox.webp',
  '/books/book_covers/The_Discipline_Blueprint.webp',
  '/books/book_covers/Wealth_Without_Permission.webp',
  '/books/book_covers/Read_People_Like_a_Book.webp',
  '/books/book_covers/Whole.webp'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(cached => {
      const fetched = fetch(e.request).then(response => {
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return response;
      }).catch(() => cached);
      return cached || fetched;
    })
  );
});
