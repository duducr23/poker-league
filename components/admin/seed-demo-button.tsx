"use client";
import { useState } from "react";
import { Sparkles } from "lucide-react";

export function SeedDemoButton() {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "exists" | "error">("idle");
  const [groupId, setGroupId] = useState<string | null>(null);

  async function handleSeed() {
    if (!confirm("ליצור קבוצת דמו 'פוקר חברים' עם 6 שחקנים ו-15 ערבים?")) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/admin/seed-demo", { method: "POST" });
      const data = await res.json();
      if (res.status === 409) { setStatus("exists"); setGroupId(data.groupId); return; }
      if (!res.ok) { setStatus("error"); return; }
      setStatus("done");
      setGroupId(data.groupId);
    } catch { setStatus("error"); }
  }

  return (
    <div
      className="rounded-xl p-4 flex items-center justify-between gap-4"
      style={{ background: "rgba(167,139,250,0.06)", border: "1px solid rgba(167,139,250,0.15)" }}
    >
      <div>
        <p className="text-sm font-semibold text-slate-200">🃏 קבוצת דמו</p>
        <p className="text-xs text-slate-500 mt-0.5">צור קבוצת "פוקר חברים" עם 6 שחקנים ו-15 ערבים מלאים לצורך הדגמה</p>
        {status === "done"  && <p className="text-xs text-emerald-400 mt-1">✅ נוצרה בהצלחה! <a href={`/groups/${groupId}`} className="underline">כנס לקבוצה</a></p>}
        {status === "exists"&& <p className="text-xs text-yellow-400 mt-1">⚠️ כבר קיימת. <a href={`/groups/${groupId}`} className="underline">כנס לקבוצה</a></p>}
        {status === "error" && <p className="text-xs text-red-400 mt-1">❌ שגיאה — נסה שוב</p>}
      </div>
      <button
        onClick={handleSeed}
        disabled={status === "loading" || status === "done"}
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold shrink-0 disabled:opacity-50"
        style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)", color: "#fff" }}
      >
        <Sparkles className="h-4 w-4" />
        {status === "loading" ? "יוצר..." : status === "done" ? "נוצרה ✓" : "צור דמו"}
      </button>
    </div>
  );
}
