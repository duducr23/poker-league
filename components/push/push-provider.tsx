"use client";
import { useEffect } from "react";

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    output[i] = rawData.charCodeAt(i);
  }
  return output;
}

async function sendSubscriptionToServer(sub: PushSubscription) {
  const json = sub.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return;
  await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      endpoint: json.endpoint,
      keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
    }),
  }).catch(() => {});
}

export function PushProvider() {
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      !("PushManager" in window)
    )
      return;

    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey) return;

    async function initPush() {
      try {
        // Wait for next-pwa's service worker to be ready
        const reg = await navigator.serviceWorker.ready;

        // Don't ask again if already denied
        if (Notification.permission === "denied") return;

        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          // Re-register existing subscription to keep server in sync
          await sendSubscriptionToServer(sub);
          return;
        }

        // Only auto-subscribe if permission is already granted
        // If "default", let NotificationSettings UI handle the prompt
        if (Notification.permission === "granted") {
          const newSub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidKey!),
          });
          await sendSubscriptionToServer(newSub);
        }
      } catch {
        // Silently fail — push is optional
      }
    }

    initPush();
  }, []);

  return null;
}
