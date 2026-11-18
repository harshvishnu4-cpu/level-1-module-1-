/*
  Offline cache for the course and for CommKit pages. Register it with CommKit.offline() (or it is
  registered by the course pages). It must sit in the site's root folder so it covers every page.

  • Big files that never change (the speech model, the speech engine, recordings, images): saved copy
    first; fetched and saved the first time.
  • Everything else (pages, scripts, styles): network first, so updates arrive when online; the saved
    copy is used when offline.
  • Change VERSION to clear old copies.
*/
const VERSION = 'commkit-v4';
// small files kept from the start; the 37 MB speech model is saved the first time a page loads it
const CORE = ['kit/commkit.js', 'lib/vosk.js', 'js/scoring.js', 'js/answer-scoring.js'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE.map(p => new URL(p, self.registration.scope).href))).catch(() => {}).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('commkit-') && k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// a page can ask for files to be saved now (CommKit.offline() sends the speech model this way, so it is
// kept from the first visit; the speech engine's own download happens inside a worker this cache can't see)
self.addEventListener('message', e => {
  if (!e.data || e.data.type !== 'cache' || !Array.isArray(e.data.urls)) return;
  e.waitUntil(caches.open(VERSION).then(c => Promise.all(e.data.urls.map(u => c.match(u).then(hit => hit || c.add(u).catch(() => {}))))));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || req.headers.has('range')) return;
  // the better listener's code (transformers.js and its speech runtime) comes from a CDN at fixed versions:
  // keep it, so Whisper also works offline after its first use (the model itself is kept by transformers.js)
  if (new URL(req.url).origin === 'https://cdn.jsdelivr.net' && /\/npm\/(@huggingface\/transformers|onnxruntime-web)@\d/.test(req.url)) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => { if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); } return res; })));
    return;
  }
  if (new URL(req.url).origin !== location.origin) return;
  if (new URL(req.url).pathname.startsWith('/api/')) return; // the AI feedback is online-only
  const path = new URL(req.url).pathname;
  const big = /\.(tar\.gz|wasm|wav|mp3|ogg|m4a|png|jpe?g|webp|svg|woff2?)$/i.test(path) || path.endsWith('/lib/vosk.js');
  const save = res => { if (res.ok && res.type === 'basic') { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); } return res; };
  if (big) { e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(save))); return; }
  e.respondWith(fetch(req).then(save).catch(() => caches.match(req).then(hit => hit || caches.match(req, { ignoreSearch: true }))
    .then(hit => hit || (req.mode === 'navigate' ? caches.match(new URL('plan.html', self.registration.scope).href) : Response.error()))));
});
