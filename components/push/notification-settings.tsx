"use client";
import { useState, useEffect, useCallback } from "react";
import { Bell, BellOff, BellRing, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

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

type Permission = "default" | "granted" | "denied" | "unsupported";

interface Prefs {
  notifFinancial: boolean;
  notifFoodPayments: boolean;
  notifSessionEvents: boolean;
}

export function NotificationSettings() {
  const [permission, setPermission] = useState<Permission>("default");
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [testSent, setTestSent] = useState(false);
  const [prefs, setPrefs] = useState<Prefs>({
    notifFinancial: true,
    notifFoodPayments: true,
    notifSessionEvents: true,
  });
  const [savingPrefs, setSavingPrefs] = useState(false);

  const checkStatus = useCallback(async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setPermission("unsupported");
      setLoading(false);
      return;
    }
    const perm = Notification.permission as Permission;
    setPermission(perm);

    if (perm === "granted") {
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        setSubscribed(!!sub);
      } catch {
        setSubscribed(false);
      }
    }

    // Load preferences
    const res = await fetch("/api/push/preferences").catch(() => null);
    if (res?.ok) {
      const data = await res.json();
      setPrefs(data);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  async function enableNotifications() {
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey) return;
    setSubscribing(true);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm as Permission);
      if (perm !== "granted") {
        setSubscribing(false);
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });
      const json = sub.toJSON();
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: json.endpoint,
          keys: { p256dh: json.keys?.p256dh, auth: json.keys?.auth },
        }),
      });
      setSubscribed(true);
    } catch {
      /* ignore */
    }
    setSubscribing(false);
  }

  async function disableNotifications() {
    setSubscribing(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setSubscribed(false);
    } catch {
      /* ignore */
    }
    setSubscribing(false);
  }

  async function sendTest() {
    await fetch("/api/push/test", { method: "POST" });
    setTestSent(true);
    setTimeout(() => setTestSent(false), 3000);
  }

  async function savePref(key: keyof Prefs, val: boolean) {
    const next = { ...prefs, [key]: val };
    setPrefs(next);
    setSavingPrefs(true);
    await fetch("/api/push/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [key]: val }),
    }).catch(() => {});
    setSavingPrefs(false);
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-slate-500 text-sm p-4">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>טוען הגדרות התראות...</span>
      </div>
    );
  }

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: "1px solid rgba(212,160,23,0.12)" }}
    >
      <div
        className="flex items-center gap-3 px-5 py-4"
        style={{
          background: "rgba(212,160,23,0.06)",
          borderBottom: "1px solid rgba(212,160,23,0.1)",
        }}
      >
        <Bell className="h-4 w-4 text-yellow-500" />
        <span className="text-sm font-semibold text-slate-300">התראות Push</span>
      </div>
      <div className="p-5 space-y-4" style={{ background: "#0d0d18" }}>
        {/* Status + main toggle */}
        {permission === "unsupported" && (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <BellOff className="h-4 w-4" />
            <span>הדפדפן שלך אינו תומך בהתראות Push</span>
          </div>
        )}

        {permission === "denied" && (
          <div
            className="rounded-lg p-3 text-sm"
            style={{
              background: "rgba(248,113,113,0.08)",
              border: "1px solid rgba(248,113,113,0.2)",
            }}
          >
            <p className="text-red-400 font-medium mb-1">ההתראות חסומות בדפדפן</p>
            <p className="text-slate-500 text-xs">
              כדי להפעיל התראות, עבור להגדרות הדפדפן ואפשר התראות עבור אתר זה
            </p>
          </div>
        )}

        {(permission === "default" ||
          (permission === "granted" && !subscribed)) && (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-200">הפעלת התראות</p>
              <p className="text-xs text-slate-500 mt-0.5">
                קבל התראות על בקשות, תשלומים וסגירת ערב
              </p>
            </div>
            <Button
              size="sm"
              onClick={enableNotifications}
              disabled={subscribing}
              style={{
                background: "linear-gradient(135deg, #d4a017, #f5c842)",
                color: "#0a0a12",
              }}
            >
              {subscribing ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <BellRing className="h-3 w-3" />
              )}
              <span className="mr-1">הפעל</span>
            </Button>
          </div>
        )}

        {permission === "granted" && subscribed && (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <p className="text-sm font-medium text-slate-200">ההתראות פעילות</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs text-slate-400"
                  onClick={sendTest}
                  disabled={testSent}
                >
                  {testSent ? (
                    <>
                      <Check className="h-3 w-3 ml-1" />
                      נשלח!
                    </>
                  ) : (
                    "שלח בדיקה"
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs text-red-400 hover:text-red-300"
                  onClick={disableNotifications}
                  disabled={subscribing}
                >
                  {subscribing ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <BellOff className="h-3 w-3" />
                  )}
                  <span className="mr-1">כבה</span>
                </Button>
              </div>
            </div>

            {/* Preference toggles */}
            <div
              className="space-y-2 pt-2"
              style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
            >
              <p className="text-xs text-slate-500 font-medium">סוגי התראות</p>
              {(
                [
                  {
                    key: "notifFinancial" as keyof Prefs,
                    label: "בקשות מערכת החישגוזים",
                    desc: "בקשות קנייה ואישורים",
                  },
                  {
                    key: "notifFoodPayments" as keyof Prefs,
                    label: "הוצאות ערב",
                    desc: "חיובים, הוכחות ואישורי תשלום",
                  },
                  {
                    key: "notifSessionEvents" as keyof Prefs,
                    label: "ארועי ערב",
                    desc: "סגירת ערב והזמנות חדשות",
                  },
                ] as const
              ).map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between py-1">
                  <div>
                    <p className="text-sm text-slate-300">{label}</p>
                    <p className="text-xs text-slate-600">{desc}</p>
                  </div>
                  <button
                    onClick={() => savePref(key, !prefs[key])}
                    disabled={savingPrefs}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      prefs[key] ? "bg-yellow-600" : "bg-slate-700"
                    }`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transform transition-transform ${
                        prefs[key] ? "translate-x-4" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
