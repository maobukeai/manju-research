/* 漫剧研究学习平台 · Service Worker
   策略：全部同源 GET 网络优先（保证每周研究更新即时可见），失败时回退缓存（离线可用）。 */
const CACHE = 'manju-v3.2';
const CORE = ['index.html', 'css/style.css', 'js/data.js', 'js/research-data.js', 'js/app.js', 'icon.svg', 'manifest.webmanifest',
  'js/feat-course.js', 'js/feat-consistency.js', 'js/feat-promptgen.js', 'js/feat-workflows.js', 'js/feat-quizhub.js',
  'js/feat-mcsim.js', 'js/feat-storyboard.js', 'js/feat-studyhub.js', 'js/feat-framesim.js', 'js/feat-picker.js'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  // no-cache：每次与服务器重新验证（304/200），防止HTTP启发式缓存吃掉研究更新
  e.respondWith(
    fetch(e.request, { cache: 'no-cache' }).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(e.request, copy));
      return res;
    }).catch(() =>
      caches.match(e.request).then((hit) => hit || (url.pathname.endsWith('/index.html') || url.pathname === '/' ? caches.match('index.html') : undefined))
    )
  );
});
