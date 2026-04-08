"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { Loader2, Pencil, Check, X, ShieldCheck } from "lucide-react";

interface Props {
  currentName: string;
}

export function SuperAdminNameEditor({ currentName }: Props) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(currentName);
  const [input, setInput] = useState(currentName);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!input.trim() || input.trim() === name) { setEditing(false); return; }
    setSaving(true);
    const res = await fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: input.trim() }),
    });
    const json = await res.json();
    setSaving(false);
    if (!res.ok) {
      toast({ title: "שגיאה", description: json.error, variant: "destructive" });
      return;
    }
    setName(json.name);
    setInput(json.name);
    setEditing(false);
    toast({ title: "✅ השם עודכן בהצלחה" });
  }

  return (
    <div
      className="rounded-xl p-5 space-y-4"
      style={{ background: "rgba(13,13,24,0.8)", border: "1px solid rgba(212,160,23,0.15)" }}
    >
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-4 w-4" style={{ color: "#d4a017" }} />
        <h2 className="text-sm font-semibold" style={{ color: "#d4a017" }}>הגדרות סופר-אדמין</h2>
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-slate-400 uppercase tracking-wider">שם תצוגה</Label>

        {editing ? (
          <div className="flex gap-2 items-center">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="h-9 text-sm flex-1"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") save();
                if (e.key === "Escape") { setInput(name); setEditing(false); }
              }}
            />
            <Button
              size="sm"
              className="h-9 px-3"
              style={{ background: "#d4a017", color: "#0c0c18" }}
              onClick={save}
              disabled={saving}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-9 px-3 text-slate-400"
              onClick={() => { setInput(name); setEditing(false); }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3 rounded-lg px-3 py-2"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <span className="text-sm font-medium text-slate-100">{name}</span>
            <button
              className="text-slate-500 hover:text-amber-400 transition-colors"
              onClick={() => { setInput(name); setEditing(true); }}
              title="ערוך שם"
            >
              <Pencil className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
