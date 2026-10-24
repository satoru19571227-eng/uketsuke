// アプリとしてインストールできるようにするための最小限の仕組み（何も保存せず、そのまま通信する）
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", (e) => {
  // ロボホンへの命令（よそのサーバーへの通信）には手を出さない
  if (e.request.method !== "GET" || new URL(e.request.url).origin !== self.location.origin) return;
  e.respondWith(fetch(e.request));
});
