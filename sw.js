// 歡樂派對 離線快取：有網路時一律抓最新版並更新快取；沒網路時用上次存的版本（給「免網路手動連線」用）
const C = 'hp-v1';
self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(C).then(c => c.add('./')).catch(() => { })); });
self.addEventListener('activate', e => { e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  if (new URL(r.url).origin !== location.origin) return;
  e.respondWith(
    fetch(r).then(res => {
      if (res && res.ok) { const cp = res.clone(); caches.open(C).then(c => c.put(r, cp)).catch(() => { }); }
      return res;
    }).catch(() => caches.match(r, { ignoreSearch: true }).then(m => m || caches.match('./', { ignoreSearch: true })))
  );
});
