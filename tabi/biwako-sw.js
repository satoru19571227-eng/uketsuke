// 旅のガイド: ページと音声をスマホに保存して、電波がなくても使えるようにする
const CACHE = "tabi-biwako-v6";
const PAGE = ["biwako.html", "biwako-data.js", "biwako-manifest.json", "../robohon-icon-192.png", "../robohon-icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PAGE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith("tabi-biwako-") && k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});
// ページから音声の一覧が届いたら、まだ保存していないものを保存する
self.addEventListener("message", (e) => {
  const port = e.ports[0];
  e.waitUntil(caches.open(CACHE).then(async (c) => {
    for (const f of e.data.files) { if (!(await c.match(f))) await c.add(f); }
    port.postMessage({ ok: true, n: e.data.files.length });
  }).catch(() => port.postMessage({ ok: false })));
});
// 台本と画面は電波があれば新しいものを、なければ保存したものを使う。音声は保存したものを先に使う
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET" || new URL(e.request.url).origin !== self.location.origin) return;
  const isAudio = e.request.url.endsWith(".wav");
  e.respondWith(isAudio
    ? caches.match(e.request, { ignoreSearch: true }).then((r) => r || fetch(e.request).then((n) => {
        if (n.ok) { const copy = n.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); }
        return n;
      }))
    : fetch(e.request).then((r) => { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); return r; })
        .catch(() => caches.match(e.request, { ignoreSearch: true })));
});
