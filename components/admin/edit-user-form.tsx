"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { Pencil, Check, X, Loader2, Trash2, UserPlus } from "lucide-react";

interface Group {
  id: string;
  name: string;
}

interface Props {
  userId: string;
  initialName: string;
  initialEmail: string;
  groups: Group[];
  onDeleted: () => void;
}

export function EditUserForm({ userId, initialName, initialEmail, groups, onDeleted }: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [assigning, setAssigning] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function save() {
    setSaving(true);
    const body: Record<string, string> = {};
    if (name !== initialName) body.name = name;
    if (email !== initialEmail) body.email = email;
    if (password) body.password = password;

    if (Object.keys(body).length === 0) {
      setOpen(false);
      setSaving(false);
      return;
    }

    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (!res.ok) {
      const j = await res.json();
      toast({ title: "שגיאה", description: j.error, variant: "destructive" });
      return;
    }
    toast({ title: "✅ המשתמש עודכן בהצלחה" });
    setOpen(false);
    setPassword("");
  }

  async function assignToGroup() {
    if (!selectedGroupId) return;
    setAssigning(true);
    const res = await fetch(`/api/admin/users/${userId}/groups`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groupId: selectedGroupId }),
    });
    setAssigning(false);
    if (!res.ok) {
      const j = await res.json();
      toast({ title: "שגיאה", description: j.error, variant: "destructive" });
      return;
    }
    toast({ title: "✅ המשתמש שויך לקבוצה בהצלחה" });
    setSelectedGroupId("");
  }

  async function deleteUser() {
    setDeleting(true);
    const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
    setDeleting(false);
    if (!res.ok) {
      const j = await res.json();
      toast({ title: "שגיאה", description: j.error, variant: "destructive" });
      setConfirmDelete(false);
      return;
    }
    toast({ title: "🗑️ המשתמש נמחק" });
    onDeleted();
  }

  function close() {
    setOpen(false);
    setName(initialName);
    setEmail(initialEmail);
    setPassword("");
    setConfirmDelete(false);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
        style={{
          background: "rgba(212,160,23,0.08)",
          color: "#d4a017",
          border: "1px solid rgba(212,160,23,0.2)",
        }}
      >
        <Pencil className="h-3 w-3" />ערוך פרטים
      </button>
    );
  }

  return (
    <div
      className="w-full mt-1 rounded-xl space-y-4 p-4"
      style={{ background: "rgba(212,160,23,0.04)", border: "1px solid rgba(212,160,23,0.15)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-yellow-500 flex items-center gap-1">
          <Pencil className="h-3 w-3" />עריכת פרטי משתמש
        </p>
        <button onClick={close} className="text-slate-500 hover:text-slate-300 transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Edit fields — full width on mobile */}
      <div className="space-y-2">
        <div>
          <label className="text-xs text-slate-500 mb-1 block">שם</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-9 text-sm w-full"
            placeholder="שם מלא"
          />
        </div>
        <div>
          <label className="text-xs text-slate-500 mb-1 block">אימייל</label>
          <Input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-9 text-sm w-full"
            type="email"
            placeholder="example@gmail.com"
          />
        </div>
        <div>
          <label className="text-xs text-slate-500 mb-1 block">סיסמה חדשה (ריק = ללא שינוי)</label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="לפחות 6 תווים"
            className="h-9 text-sm w-full"
          />
        </div>
      </div>

      {/* Save / Cancel */}
      <div className="flex gap-2">
        <Button
          size="sm"
          className="flex-1 h-9 gap-1.5"
          disabled={saving}
          onClick={save}
          style={{ background: "linear-gradient(135deg, #d4a017, #f5c842)", color: "#0a0a12" }}
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
          שמור שינויים
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-9 px-3 text-slate-400"
          onClick={close}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Divider */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }} />

      {/* Assign to group */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-blue-400 flex items-center gap-1">
          <UserPlus className="h-3 w-3" />שייך לקבוצה
        </p>
        <div className="flex gap-2">
          <select
            value={selectedGroupId}
            onChange={(e) => setSelectedGroupId(e.target.value)}
            className="flex-1 h-9 rounded-lg border text-sm px-2"
            style={{ background: "#1a1a2e", borderColor: "rgba(96,165,250,0.2)", color: "#e2e8f0" }}
          >
            <option value="">בחר קבוצה...</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
          <Button
            size="sm"
            className="h-9 px-3 gap-1 shrink-0"
            disabled={!selectedGroupId || assigning}
            onClick={assignToGroup}
            style={{ background: "rgba(96,165,250,0.12)", color: "#60a5fa", border: "1px solid rgba(96,165,250,0.25)" }}
          >
            {assigning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />}
            שייך
          </Button>
        </div>
      </div>

      {/* Divider */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }} />

      {/* Delete */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-red-400 flex items-center gap-1">
          <Trash2 className="h-3 w-3" />מחיקת חשבון
        </p>
        {!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            className="w-full h-9 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
            style={{ background: "rgba(239,68,68,0.06)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)" }}
          >
            <Trash2 className="h-3.5 w-3.5" />מחק משתמש לצמיתות
          </button>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-red-400 font-medium">
              ⚠️ פעולה זו תמחק את החשבון לצמיתות ואינה הפיכה!
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                className="flex-1 h-9 gap-1.5"
                style={{ background: "rgba(239,68,68,0.15)", color: "#f87171", border: "1px solid rgba(239,68,68,0.35)" }}
                disabled={deleting}
                onClick={deleteUser}
              >
                {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                כן, מחק לצמיתות
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-9 px-3 text-slate-400"
                onClick={() => setConfirmDelete(false)}
              >
                ביטול
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
