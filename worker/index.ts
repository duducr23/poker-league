/// <reference lib="webworker" />
declare const self: ServiceWorkerGlobalScope;

self.addEventListener("push", (event) => {
  if (!event.data) return;
  const data = event.data.json() as {
    title?: string;
    body?: string;
    url?: string;
    icon?: string;
    badge?: string;
    tag?: string;
  };

  event.waitUntil(
    self.registration.showNotification(data.title ?? "Poker League 🃏", {
      body: data.body ?? "",
      icon: data.icon ?? "/icons/icon-192x192.png",
      badge: data.badge ?? "/icons/icon-96x96.png",
      data: { url: data.url ?? "/dashboard" },
      tag: data.tag,
      vibrate: [200, 100, 200],
    } as NotificationOptions)
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url: string = (event.notification.data as { url: string })?.url ?? "/dashboard";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        const existing = clients.find(
          (c) => c.url.includes(url) && "focus" in c
        );
        if (existing) return (existing as WindowClient).focus();
        return self.clients.openWindow(url);
      })
  );
});
