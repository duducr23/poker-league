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

  // Assign to group
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [assigning, setAssigning] = useState(false);

  // Delete
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

  if (!open) {
    return (
      <Button
        size="sm"
        variant="ghost"
        className="h-7 px-2 gap-1 text-slate-400 hover:text-slate-100"
        onClick={() => setOpen(true)}
      >
        <Pencil className="h-3 w-3" />ערוך
      </Button>
    );
  }

  return (
    <div
      className="mt-2 p-3 rounded-lg space-y-4"
      style={{ background: "rgba(212,160,23,0.05)", border: "1px solid rgba(212,160,23,0.18)" }}
    >
      {/* Edit details */}
      <div>
        <p className="text-xs font-semibold text-yellow-500 mb-2">עריכת פרטים</p>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-slate-500 mb-1 block">שם</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="h-8 text-sm" />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">אימייל</label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} className="h-8 text-sm" type="email" />
          </div>
          <div className="col-span-2">
            <label className="text-xs text-slate-500 mb-1 block">סיסמה חדשה (ריק = ללא שינוי)</label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••" className="h-8 text-sm" />
          </div>
        </div>
        <div className="flex gap-2 mt-2">
          <Button size="sm" className="h-7 gap-1" disabled={saving} onClick={save}>
            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}שמור
          </Button>
          <Button size="sm" variant="ghost" className="h-7 gap-1 text-slate-400"
            onClick={() => { setOpen(false); setName(initialName); setEmail(initialEmail); setPassword(""); setConfirmDelete(false); }}>
            <X className="h-3 w-3" />ביטול
          </Button>
        </div>
      </div>

      {/* Assign to group */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "0.75rem" }}>
        <p className="text-xs font-semibold text-blue-400 mb-2 flex items-center gap-1">
          <UserPlus className="h-3 w-3" />שייך לקבוצה
        </p>
        <div className="flex gap-2">
          <select
            value={selectedGroupId}
            onChange={(e) => setSelectedGroupId(e.target.value)}
            className="flex-1 h-8 rounded-md border text-sm px-2"
            style={{ background: "#1a1a2e", borderColor: "rgba(212,160,23,0.2)", color: "#e2e8f0" }}
          >
            <option value="">בחר קבוצה...</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
          <Button
            size="sm"
            className="h-8 gap-1 shrink-0"
            disabled={!selectedGroupId || assigning}
            onClick={assignToGroup}
            style={{ background: "rgba(96,165,250,0.15)", color: "#60a5fa", border: "1px solid rgba(96,165,250,0.3)" }}
          >
            {assigning ? <Loader2 className="h-3 w-3 animate-spin" /> : <UserPlus className="h-3 w-3" />}
            שייך
          </Button>
        </div>
      </div>

      {/* Delete user */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "0.75rem" }}>
        <p className="text-xs font-semibold text-red-400 mb-2 flex items-center gap-1">
          <Trash2 className="h-3 w-3" />מחיקת חשבון
        </p>
        {!confirmDelete ? (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 gap-1 text-xs"
            style={{ color: "#f87171", border: "1px solid rgba(248,113,113,0.2)" }}
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2 className="h-3 w-3" />מחק משתמש לצמיתות
          </Button>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-red-400">
              ⚠️ פעולה זו תמחק את החשבון לצמיתות ואינה הפיכה!
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                className="h-7 gap-1 text-xs"
                style={{ background: "rgba(239,68,68,0.15)", color: "#f87171", border: "1px solid rgba(239,68,68,0.4)" }}
                disabled={deleting}
                onClick={deleteUser}
              >
                {deleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                כן, מחק
              </Button>
              <Button size="sm" variant="ghost" className="h-7 text-slate-400 text-xs" onClick={() => setConfirmDelete(false)}>
                ביטול
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
