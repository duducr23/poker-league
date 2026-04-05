"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { Pencil, Check, X, Loader2 } from "lucide-react";

interface Props {
  userId: string;
  initialName: string;
  initialEmail: string;
}

export function EditUserForm({ userId, initialName, initialEmail }: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);

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
      className="mt-2 p-3 rounded-lg space-y-3"
      style={{ background: "rgba(212,160,23,0.05)", border: "1px solid rgba(212,160,23,0.18)" }}
    >
      <p className="text-xs font-semibold text-yellow-500">עריכת משתמש</p>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-slate-500 mb-1 block">שם</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-8 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-slate-500 mb-1 block">אימייל</label>
          <Input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-8 text-sm"
            type="email"
          />
        </div>
        <div className="col-span-2">
          <label className="text-xs text-slate-500 mb-1 block">סיסמה חדשה (השאר ריק אם לא משנה)</label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••"
            className="h-8 text-sm"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Button size="sm" className="h-7 gap-1" disabled={saving} onClick={save}>
          {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
          שמור
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 gap-1 text-slate-400"
          onClick={() => {
            setOpen(false);
            setName(initialName);
            setEmail(initialEmail);
            setPassword("");
          }}
        >
          <X className="h-3 w-3" />ביטול
        </Button>
      </div>
    </div>
  );
}
