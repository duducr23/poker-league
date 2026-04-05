"use client";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { formatDate } from "@/lib/utils";
import { Snowflake, Flame, Loader2, Trash2, X } from "lucide-react";

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
    <div className="divide-y divide-white/5">
      {members.map((m) => (
        <div key={m.id} className="py-3 space-y-2">
          <div
            className="flex items-center justify-between gap-2 flex-wrap"
            style={m.isFrozen ? { opacity: 0.65 } : undefined}
          >
            <div>
              <p className="font-medium text-slate-100 flex items-center gap-2">
                {m.name}
                {m.isFrozen && (
                  <span className="text-xs text-blue-400 flex items-center gap-0.5">
                    <Snowflake className="h-3 w-3" />מוקפא
                  </span>
                )}
              </p>
              <p className="text-sm text-slate-500">{m.email}</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-500">{formatDate(m.joinedAt)}</span>
              <Badge variant={m.role === "ADMIN" ? "default" : "secondary"}>
                {m.role === "ADMIN" ? "מנהל" : "חבר"}
              </Badge>
              {m.userId === currentUserId && (
                <Badge variant="outline" className="text-xs">אתה</Badge>
              )}
              {isAdmin && m.role !== "ADMIN" && m.userId !== currentUserId && (
                <>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs gap-1"
                    style={{ color: m.isFrozen ? "#60a5fa" : "#94a3b8" }}
                    disabled={freezingId === m.userId}
                    onClick={() => toggleFreeze(m.userId)}
                    title={m.isFrozen ? "בטל הקפאה" : "הקפא שחקן (לא יופיע בטבלה)"}
                  >
                    {freezingId === m.userId
                      ? <Loader2 className="h-3 w-3 animate-spin" />
                      : m.isFrozen
                      ? <><Flame className="h-3 w-3" />הפשר</>
                      : <><Snowflake className="h-3 w-3" />הקפא</>
                    }
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs gap-1"
                    style={{ color: "#f87171" }}
                    onClick={() => setConfirmRemoveId(confirmRemoveId === m.userId ? null : m.userId)}
                    title="הסר שחקן מהקבוצה"
                  >
                    {confirmRemoveId === m.userId
                      ? <><X className="h-3 w-3" />ביטול</>
                      : <><Trash2 className="h-3 w-3" />הסר</>
                    }
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Confirmation panel for removal */}
          {confirmRemoveId === m.userId && (
            <div
              className="rounded-lg p-3 space-y-2"
              style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)" }}
            >
              <p className="text-xs text-red-400 font-medium">
                האם להסיר את <span className="font-bold">{m.name}</span> מהקבוצה?
              </p>
              <div className="flex gap-2 flex-wrap">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs h-7 gap-1"
                  style={{ borderColor: "rgba(239,68,68,0.3)", color: "#fca5a5" }}
                  disabled={removing}
                  onClick={() => handleRemove(m.userId, true)}
                >
                  {removing ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                  הסר ושמור נתונים
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs h-7 gap-1"
                  style={{ borderColor: "rgba(239,68,68,0.5)", color: "#f87171", background: "rgba(239,68,68,0.08)" }}
                  disabled={removing}
                  onClick={() => handleRemove(m.userId, false)}
                >
                  {removing ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                  הסר ומחק את כל הנתונים
                </Button>
              </div>
              <p className="text-xs text-slate-600">
                שמור נתונים = השחקן יוסר אך ההיסטוריה שלו תישאר · מחק = ימחקו כל תוצאותיו בקבוצה
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
