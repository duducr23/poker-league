"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { formatCurrency } from "@/lib/utils";
import { Loader2, Save, UserPlus, Snowflake, Flame, X, CheckCircle2, Clock, AlertCircle, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface Member { id: string; name: string; role: string; isFrozen: boolean }
interface ResultRow {
  userId: string;
  userName: string;
  buyIn: number;
  rebuy: number;
  cashOut: number;
  totalInvested: number;
  profitLoss: number;
  isSubmitted: boolean;
}

interface Props {
  groupId: string;
  sessionId: string;
  results: ResultRow[];
  isOpen: boolean;
  onRefresh: () => void;
}

export function AdminSessionPanel({ groupId, sessionId, results, isOpen, onRefresh }: Props) {
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [addingUser, setAddingUser] = useState("");
  const [saving, setSaving] = useState(false);
  const [addingLoading, setAddingLoading] = useState(false);
  const [freezingUser, setFreezingUser] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Record<string, { buyIn: number; rebuy: number; cashOut: number }>>({});
  const [forceClosing, setForceClosing] = useState(false);

  useEffect(() => {
    fetch(`/api/groups/${groupId}/members`)
      .then((r) => r.json())
      .then(setAllMembers);
  }, [groupId]);

  // Members not yet in this session
  const sessionUserIds = new Set(results.map((r) => r.userId));
  const availableToAdd = allMembers.filter((m) => !sessionUserIds.has(m.id));

  function startEdit(r: ResultRow) {
    setFormValues((prev) => ({
      ...prev,
      [r.userId]: { buyIn: r.buyIn, rebuy: r.rebuy, cashOut: r.cashOut },
    }));
    setEditingUser(r.userId);
  }

  function getForm(userId: string) {
    return formValues[userId] || { buyIn: 0, rebuy: 0, cashOut: 0 };
  }

  function updateForm(userId: string, field: string, value: number) {
    setFormValues((prev) => ({
      ...prev,
      [userId]: { ...getForm(userId), [field]: value },
    }));
  }

  async function saveResult(userId: string) {
    const f = getForm(userId);
    setSaving(true);
    const res = await fetch(`/api/groups/${groupId}/sessions/${sessionId}/results`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, ...f }),
    });
    setSaving(false);
    if (!res.ok) { toast({ title: "שגיאה", variant: "destructive" }); return; }
    toast({ title: "✅ נשמר" });
    setEditingUser(null);
    onRefresh();
  }

  async function removeParticipant(userId: string, isSubmitted: boolean) {
    const name = results.find((r) => r.userId === userId)?.userName ?? "השחקן";
    const msg = isSubmitted
      ? `${name} כבר הגיש תוצאות — להסיר אותו בכל זאת? הנתונים שלו יימחקו.`
      : `להסיר את ${name} מהסשן?`;
    if (!confirm(msg)) return;
    const res = await fetch(`/api/groups/${groupId}/sessions/${sessionId}/participants`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    if (!res.ok) {
      const j = await res.json();
      toast({ title: "שגיאה", description: j.error, variant: "destructive" });
      return;
    }
    toast({ title: "✅ שחקן הוסר" });
    onRefresh();
  }

  async function addParticipant() {
    if (!addingUser) return;
    setAddingLoading(true);
    const res = await fetch(`/api/groups/${groupId}/sessions/${sessionId}/participants`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: addingUser }),
    });
    const json = await res.json();
    setAddingLoading(false);
    if (!res.ok) { toast({ title: "שגיאה", description: json.error, variant: "destructive" }); return; }
    toast({ title: "✅ שחקן נוסף!" });
    setAddingUser("");
    onRefresh();
  }

  async function toggleFreeze(userId: string) {
    setFreezingUser(userId);
    const res = await fetch(`/api/groups/${groupId}/members/${userId}`, { method: "PATCH" });
    setFreezingUser(null);
    if (!res.ok) {
      const j = await res.json();
      toast({ title: "שגיאה", description: j.error, variant: "destructive" });
      return;
    }
    const { isFrozen } = await res.json();
    toast({ title: isFrozen ? "❄️ שחקן הוקפא — לא יופיע בטבלה" : "🔥 הקפאה בוטלה" });
    // refresh member list
    fetch(`/api/groups/${groupId}/members`).then((r) => r.json()).then(setAllMembers);
  }

  const memberMap = Object.fromEntries(allMembers.map((m) => [m.id, m]));

  const unsubmittedCount = results.filter((r) => !r.isSubmitted).length;

  async function forceClose() {
    if (
      !confirm(
        `יש ${unsubmittedCount} שחקנים שלא הגישו תוצאות. האם לגשת אותם עם ערכיהם הנוכחיים ולסגור את הערב?`
      )
    )
      return;
    setForceClosing(true);
    try {
      const res = await fetch(
        `/api/groups/${groupId}/sessions/${sessionId}/force-close`,
        { method: "POST" }
      );
      const json = await res.json();
      if (!res.ok) {
        toast({ title: "שגיאה", description: json.error, variant: "destructive" });
        return;
      }
      toast({ title: "✅ הסשן נסגר" });
      onRefresh();
      window.location.href = `/groups/${groupId}/sessions/${sessionId}/summary`;
    } finally {
      setForceClosing(false);
    }
  }

  return (
    <Card style={{ borderColor: "rgba(212,160,23,0.35)", background: "rgba(212,160,23,0.04)" }}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2" style={{ color: "#d4a017" }}>
          🔧 מצב מנהל
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* Add player */}
        {isOpen && availableToAdd.length > 0 && (
          <div className="space-y-2">
            <Label className="text-xs text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <UserPlus className="h-3.5 w-3.5" style={{ color: "#d4a017" }} />
              הוסף שחקן לערב
            </Label>
            <div className="flex gap-2">
              <select
                value={addingUser}
                onChange={(e) => setAddingUser(e.target.value)}
                className="flex-1 rounded-lg px-3 py-2 text-sm text-slate-100"
                style={{ background: "#0c0c18", border: "1px solid rgba(212,160,23,0.18)" }}
              >
                <option value="">בחר שחקן...</option>
                {availableToAdd.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}{m.isFrozen ? " ❄️" : ""}</option>
                ))}
              </select>
              <Button size="sm" onClick={addParticipant} disabled={!addingUser || addingLoading}>
                {addingLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />}
              </Button>
            </div>
          </div>
        )}

        {/* Results inline edit */}
        <div className="space-y-2">
          <Label className="text-xs text-slate-400 uppercase tracking-wider">עדכון תוצאות</Label>
          <div className="space-y-2">
            {results.map((r) => {
              const isEditing = editingUser === r.userId;
              const f = getForm(r.userId);
              const totalInv = (f.buyIn || 0) + (f.rebuy || 0);
              const pl = (f.cashOut || 0) - totalInv;
              const member = memberMap[r.userId];
              const isFrozen = member?.isFrozen ?? false;

              return (
                <div
                  key={r.userId}
                  className="rounded-lg border p-3 space-y-2"
                  style={{
                    borderColor: isFrozen ? "rgba(96,165,250,0.2)" : "rgba(255,255,255,0.07)",
                    background: isFrozen ? "rgba(59,130,246,0.04)" : "rgba(255,255,255,0.02)",
                  }}
                >
                  {/* Row header */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-slate-100">{r.userName}</span>
                      {isFrozen && (
                        <span className="text-xs text-blue-400 flex items-center gap-0.5">
                          <Snowflake className="h-3 w-3" />מוקפא
                        </span>
                      )}
                      {r.isSubmitted ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <Clock className="h-3.5 w-3.5 text-amber-400" />
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {/* Freeze toggle */}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs gap-1"
                        style={{ color: isFrozen ? "#60a5fa" : "#94a3b8" }}
                        onClick={() => toggleFreeze(r.userId)}
                        disabled={freezingUser === r.userId || member?.role === "ADMIN"}
                        title={isFrozen ? "בטל הקפאה" : "הקפא שחקן (לא יופיע בטבלה)"}
                      >
                        {freezingUser === r.userId
                          ? <Loader2 className="h-3 w-3 animate-spin" />
                          : isFrozen
                          ? <><Flame className="h-3 w-3" />הפשר</>
                          : <><Snowflake className="h-3 w-3" />הקפא</>
                        }
                      </Button>
                      {/* Remove participant */}
                      {isOpen && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-red-400 hover:text-red-300"
                          onClick={() => removeParticipant(r.userId, r.isSubmitted)}
                          title={r.isSubmitted ? "הסר שחקן (הגיש תוצאות)" : "הסר מהסשן"}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {/* Edit toggle */}
                      {!isEditing ? (
                        <Button size="sm" variant="outline" className="h-7 px-3 text-xs" onClick={() => startEdit(r)}>
                          ערוך
                        </Button>
                      ) : (
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-slate-400" onClick={() => setEditingUser(null)}>
                          ביטול
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Inline edit form */}
                  {isEditing ? (
                    <div className="space-y-3 pt-1">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {[
                          { key: "buyIn", label: "קנייה ₪" },
                          { key: "rebuy", label: "ריבאי ₪" },
                          { key: "cashOut", label: "יציאה ₪" },
                        ].map(({ key, label }) => (
                          <div key={key} className="space-y-1">
                            <Label className="text-xs text-slate-500">{label}</Label>
                            <Input
                              type="number"
                              min="0"
                              step="1"
                              value={(f as any)[key] || 0}
                              onChange={(e) => updateForm(r.userId, key, Number(e.target.value))}
                              className="h-8 text-sm"
                            />
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">
                          השקעה: <span className="text-slate-300">{formatCurrency(totalInv)}</span>
                          {" · "}
                          רווח/הפסד:{" "}
                          <span className={cn("font-bold", pl > 0 ? "text-emerald-400" : pl < 0 ? "text-red-400" : "text-slate-400")}>
                            {pl > 0 ? "+" : ""}{formatCurrency(pl)}
                          </span>
                        </span>
                        <Button size="sm" className="h-7 gap-1 text-xs" onClick={() => saveResult(r.userId)} disabled={saving}>
                          {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                          שמור
                        </Button>
                      </div>
                    </div>
                  ) : (
                    /* Compact summary */
                    r.isSubmitted && (
                      <div className="flex gap-3 text-xs text-slate-500">
                        <span>קנייה: <span className="text-slate-300">{formatCurrency(r.buyIn)}</span></span>
                        {r.rebuy > 0 && <span>ריבאי: <span className="text-slate-300">{formatCurrency(r.rebuy)}</span></span>}
                        <span>יציאה: <span className="text-slate-300">{formatCurrency(r.cashOut)}</span></span>
                        <span className={cn("font-semibold", r.profitLoss > 0 ? "text-emerald-400" : r.profitLoss < 0 ? "text-red-400" : "text-slate-400")}>
                          {r.profitLoss > 0 ? "+" : ""}{formatCurrency(r.profitLoss)}
                        </span>
                      </div>
                    )
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-500 pt-1">
          <AlertCircle className="h-3.5 w-3.5" />
          שחקן מוקפא לא יופיע בטבלת הדירוג, אך תוצאותיו נשמרות
        </div>

        {/* Force Close section */}
        {isOpen && unsubmittedCount > 0 && (
          <div className="space-y-3 pt-2 border-t border-amber-500/20">
            <Label className="text-xs text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5" />
              כפה סגירה
            </Label>
            <div
              className="rounded-lg p-3 text-sm"
              style={{
                background: "rgba(245,158,11,0.08)",
                border: "1px solid rgba(245,158,11,0.3)",
                color: "#fcd34d",
              }}
            >
              יש {unsubmittedCount} שחקנים שלא הגישו תוצאות. לחיצה על הכפתור תגיש אותם עם ערכיהם הנוכחיים ותסגור את הערב.
            </div>
            <Button
              size="sm"
              className="w-full gap-2 text-sm font-semibold"
              style={{
                background: "rgba(245,158,11,0.15)",
                border: "1px solid rgba(245,158,11,0.5)",
                color: "#fbbf24",
              }}
              onClick={forceClose}
              disabled={forceClosing}
            >
              {forceClosing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Zap className="h-4 w-4" />
              )}
              הגש הכל וסגור ערב
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
