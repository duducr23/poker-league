"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check, UserPlus, Link2 } from "lucide-react";

interface Group {
  id: string;
  name: string;
  inviteCode: string;
}

interface Props {
  groups: Group[];
  baseUrl: string;
}

function CopyButton({ url, label }: { url: string; label: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={copy}
      className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm transition-all text-right"
      style={{
        background: copied ? "rgba(52,211,153,0.08)" : "rgba(212,160,23,0.04)",
        border: `1px solid ${copied ? "rgba(52,211,153,0.25)" : "rgba(212,160,23,0.12)"}`,
        color: copied ? "#34d399" : "#cbd5e1",
      }}
    >
      <div className="flex-1 min-w-0 text-right">
        <p className="font-medium text-xs mb-0.5">{label}</p>
        <p className="text-xs truncate opacity-50 dir-ltr text-left">{url}</p>
      </div>
      <div className="shrink-0">
        {copied ? (
          <Check className="h-4 w-4 text-emerald-400" />
        ) : (
          <Copy className="h-4 w-4 opacity-50" />
        )}
      </div>
    </button>
  );
}

export function CopyInviteLinks({ groups, baseUrl }: Props) {
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: "1px solid rgba(212,160,23,0.12)" }}
    >
      {/* Header */}
      <div
        className="px-5 py-3 flex items-center gap-2"
        style={{
          background: "rgba(212,160,23,0.06)",
          borderBottom: "1px solid rgba(212,160,23,0.1)",
        }}
      >
        <Link2 className="h-4 w-4 text-yellow-600" />
        <span className="text-sm font-semibold text-slate-300">קישורי הרשמה</span>
      </div>

      <div className="p-4 space-y-3" style={{ background: "#0d0d18" }}>
        {/* No group link */}
        <div>
          <p className="text-xs text-slate-500 mb-2 flex items-center gap-1">
            <UserPlus className="h-3 w-3" />
            הרשמה ללא קבוצה (יצטרף אחרי עם קוד)
          </p>
          <CopyButton
            url={`${baseUrl}/register`}
            label="קישור הרשמה כללי"
          />
        </div>

        {/* Per-group links */}
        {groups.length > 0 && (
          <div>
            <p className="text-xs text-slate-500 mb-2 flex items-center gap-1 mt-4">
              <Link2 className="h-3 w-3" />
              הרשמה עם כניסה ישירה לקבוצה
            </p>
            <div className="space-y-2">
              {groups.map((g) => (
                <CopyButton
                  key={g.id}
                  url={`${baseUrl}/register?invite=${g.inviteCode}`}
                  label={`הצטרף ל${g.name}`}
                />
              ))}
            </div>
          </div>
        )}

        {groups.length === 0 && (
          <p className="text-xs text-slate-600 text-center py-2">
            אין קבוצות עדיין
          </p>
        )}
      </div>
    </div>
  );
}
