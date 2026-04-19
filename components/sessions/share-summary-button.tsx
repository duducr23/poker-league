"use client";
import { useState } from "react";
import { Check } from "lucide-react";

interface Props {
  groupName: string;
  sessionDate: string;
  winner: string;
  winnerAmount: number;
}

export function ShareSummaryButton({ groupName, sessionDate, winner, winnerAmount }: Props) {
  const [copied, setCopied] = useState(false);

  function share() {
    const url = window.location.href;
    const text = `🃏 *סיכום ערב פוקר — ${groupName}*\n📅 ${sessionDate}\n🥇 הזוכה: ${winner} (+${winnerAmount}₪)\n\n👇 לסיכום המלא עם ניתוח כל השחקנים:\n${url}`;
    const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(waUrl, "_blank");
  }

  async function copyLink() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={share}
        className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition-all active:scale-95"
        style={{
          background: "rgba(37,211,102,0.12)",
          border: "1px solid rgba(37,211,102,0.35)",
          color: "#25d366",
        }}
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current shrink-0">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
          <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.532 5.862L.057 23.428a.75.75 0 0 0 .921.921l5.569-1.476A11.95 11.95 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.907 0-3.693-.503-5.236-1.381l-.374-.215-3.866 1.025 1.025-3.867-.215-.374A9.953 9.953 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
        </svg>
        שתף בווצאפ
      </button>

      <button
        onClick={copyLink}
        className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl text-sm font-medium transition-all active:scale-95"
        style={{
          background: copied ? "rgba(52,211,153,0.08)" : "rgba(255,255,255,0.04)",
          border: `1px solid ${copied ? "rgba(52,211,153,0.3)" : "rgba(255,255,255,0.1)"}`,
          color: copied ? "#34d399" : "#64748b",
        }}
        title="העתק קישור"
      >
        {copied ? <Check className="h-4 w-4" /> : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
        )}
        {copied ? "הועתק!" : "העתק"}
      </button>
    </div>
  );
}
