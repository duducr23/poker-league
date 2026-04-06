"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { formatDate } from "@/lib/utils";
import { Snowflake, Flame, Loader2, Trash2, X, ShieldCheck, User } from "lucide-react";

interface Member {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: string;
  isFrozen: boolean;
  joinedAt: string;
}

interface Props {
  groupId: string;
  members: Member[];
  currentUserId: string;
  isAdmin: boolean;
}

export function MembersManager({ groupId, members: initialMembers, currentUserId, isAdmin }: Props) {
  const [members, setMembers] = useState(initialMembers);
  const [freezingId, setFreezingId] = useState<string | null>(null);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);

  async function toggleFreeze(userId: string) {
    setFreezingId(userId);
    const res = await fetch(`/api/groups/${groupId}/members/${userId}`, { method: "PATCH" });
    setFreezingId(null);
    if (!res.ok) {
      const j = await res.json();
      toast({ title: "שגיאה", description: j.error, variant: "destructive" });
      return;
    }
    const { isFrozen } = await res.json();
    setMembers((prev) => prev.map((m) => m.userId === userId ? { ...m, isFrozen } : m));
    toast({ title: isFrozen ? "❄️ שחקן הוקפא — לא יופיע בטבלת הדירוג" : "🔥 הקפאה בוטלה" });
  }

  async function handleRemove(userId: string, keepData: boolean) {
    setRemoving(true);
    const res = await fetch(`/api/groups/${groupId}/members/${userId}?keepData=${keepData}`, {
      method: "DELETE",
    });
    setRemoving(false);
    if (!res.ok) {
      const j = await res.json();
      toast({ title: "שגיאה", description: j.error, variant: "destructive" });
      setConfirmRemoveId(null);
      return;
    }
    setMembers((prev) => prev.filter((m) => m.userId !== userId));
    setConfirmRemoveId(null);
    toast({
      title: keepData ? "✅ השחקן הוסר מהקבוצה (הנתונים נשמרו)" : "🗑️ השחקן הוסר ונתוניו נמחקו",
    });
  }

  return (
    <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
      {members.map((m) => (
        <div key={m.id} className="py-4 space-y-3" style={{ opacity: m.isFrozen ? 0.7 : 1 }}>

          {/* Member info row */}
          <div className="flex items-start gap-3">
            {/* Avatar */}
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold"
              style={{
                background: m.role === "ADMIN"
                  ? "linear-gradient(135deg, #d4a017, #f5c842)"
                  : "rgba(255,255,255,0.08)",
                color: m.role === "ADMIN" ? "#0a0a12" : "#94a3b8",
              }}
            >
              {m.name.slice(0, 2)}
            </div>

            <div className="flex-1 min-w-0">
              {/* Name + badges */}
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-medium text-slate-100">{m.name}</p>

                {m.role === "ADMIN" && (
                  <span
                    className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-medium"
                    style={{ background: "rgba(212,160,23,0.12)", color: "#d4a017", border: "1px solid rgba(212,160,23,0.2)" }}
                  >
                    <ShieldCheck className="h-3 w-3" />מנהל
                  </span>
                )}
                {m.userId === currentUserId && (
                  <span
                    className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs"
                    style={{ background: "rgba(255,255,255,0.06)", color: "#64748b", border: "1px solid rgba(255,255,255,0.1)" }}
                  >
                    <User className="h-3 w-3" />אתה
                  </span>
                )}
                {m.isFrozen && (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs" style={{ color: "#60a5fa", background: "rgba(96,165,250,0.08)", border: "1px solid rgba(96,165,250,0.2)" }}>
                    <Snowflake className="h-3 w-3" />מוקפא
                  </span>
                )}
              </div>

              {/* Email + join date */}
              <p className="text-xs text-slate-500 mt-0.5 truncate">{m.email}</p>
              <p className="text-xs text-slate-600 mt-0.5">הצטרף {formatDate(m.joinedAt)}</p>
            </div>
          </div>

          {/* Admin action buttons */}
          {isAdmin && m.role !== "ADMIN" && m.userId !== currentUserId && (
            <div className="flex items-center gap-2 flex-wrap">
              {/* Freeze/Unfreeze */}
              <button
                disabled={freezingId === m.userId}
                onClick={() => toggleFreeze(m.userId)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                style={
                  m.isFrozen
                    ? { background: "rgba(96,165,250,0.08)", color: "#60a5fa", border: "1px solid rgba(96,165,250,0.2)" }
                    : { background: "rgba(255,255,255,0.05)", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.08)" }
                }
              >
                {freezingId === m.userId
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  : m.isFrozen
                  ? <><Flame className="h-3.5 w-3.5" />הפשר</>
                  : <><Snowflake className="h-3.5 w-3.5" />הקפא</>
                }
              </button>

              {/* Remove */}
              <button
                onClick={() => setConfirmRemoveId(confirmRemoveId === m.userId ? null : m.userId)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                style={
                  confirmRemoveId === m.userId
                    ? { background: "rgba(239,68,68,0.08)", color: "#f87171", border: "1px solid rgba(239,68,68,0.25)" }
                    : { background: "rgba(255,255,255,0.04)", color: "#f87171", border: "1px solid rgba(248,113,113,0.15)" }
                }
              >
                {confirmRemoveId === m.userId
                  ? <><X className="h-3.5 w-3.5" />ביטול</>
                  : <><Trash2 className="h-3.5 w-3.5" />הסר</>
                }
              </button>
            </div>
          )}

          {/* Removal confirmation panel */}
          {confirmRemoveId === m.userId && (
            <div
              className="rounded-xl p-4 space-y-3"
              style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.18)" }}
            >
              <p className="text-xs text-red-400 font-medium">
                האם להסיר את <span className="font-bold">{m.name}</span> מהקבוצה?
              </p>

              <div className="space-y-2">
                <button
                  disabled={removing}
                  onClick={() => handleRemove(m.userId, true)}
                  className="w-full flex items-center justify-center gap-2 h-9 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                  style={{ background: "rgba(239,68,68,0.06)", color: "#fca5a5", border: "1px solid rgba(239,68,68,0.2)" }}
                >
                  {removing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                  הסר ושמור נתונים
                </button>
                <button
                  disabled={removing}
                  onClick={() => handleRemove(m.userId, false)}
                  className="w-full flex items-center justify-center gap-2 h-9 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                  style={{ background: "rgba(239,68,68,0.12)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)" }}
                >
                  {removing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                  הסר ומחק את כל הנתונים
                </button>
              </div>

              <p className="text-xs text-slate-600">
                שמור נתונים = השחקן יוסר אך ההיסטוריה תישאר · מחק = כל תוצאותיו יימחקו
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
