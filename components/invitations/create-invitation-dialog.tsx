"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { Loader2, Plus, X, CalendarPlus } from "lucide-react";

interface Props {
  groupId: string;
}

export function CreateInvitationDialog({ groupId }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ title: "", date: "", location: "", notes: "" });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.date) return;
    setLoading(true);
    const res = await fetch(`/api/groups/${groupId}/invitations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        date: new Date(form.date).toISOString(),
      }),
    });
    setLoading(false);
    if (!res.ok) {
      toast({ title: "שגיאה", description: "לא ניתן ליצור הזמנה", variant: "destructive" });
      return;
    }
    toast({ title: "✅ ההזמנה נשלחה לכל חברי הקבוצה!" });
    setOpen(false);
    setForm({ title: "", date: "", location: "", notes: "" });
    router.refresh();
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} className="gap-2">
        <CalendarPlus className="h-4 w-4" />
        הזמנה לערב
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }}>
      <div
        className="w-full max-w-md rounded-2xl p-6 space-y-5"
        style={{
          background: "linear-gradient(145deg, #13131f, #0f0f1a)",
          border: "1px solid rgba(212,160,23,0.2)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.8)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🃏</span>
            <h2 className="text-lg font-bold text-slate-100">הזמנה לערב פוקר</h2>
          </div>
          <button onClick={() => setOpen(false)} className="text-slate-500 hover:text-slate-300">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-400 uppercase tracking-wider">כותרת *</Label>
            <Input
              placeholder="למשל: ערב פוקר שישי"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-400 uppercase tracking-wider">תאריך ושעה *</Label>
            <Input
              type="datetime-local"
              value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-400 uppercase tracking-wider">מיקום</Label>
            <Input
              placeholder="למשל: בית של דני"
              value={form.location}
              onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-400 uppercase tracking-wider">הערות</Label>
            <Input
              placeholder="למשל: מינימום buy-in 50₪"
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" className="flex-1 gap-2" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              שלח הזמנה
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              ביטול
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
