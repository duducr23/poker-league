"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { Loader2, Save, Trash2, AlertCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

const resultSchema = z.object({
  buyIn: z.coerce.number().min(0),
  rebuy: z.coerce.number().min(0),
  addons: z.coerce.number().min(0),
  cashOut: z.coerce.number().min(0),
});

export default function SessionEditPage() {
  const params = useParams<{ groupId: string; sessionId: string }>();
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [editingResult, setEditingResult] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    const res = await fetch(`/api/groups/${params.groupId}/sessions/${params.sessionId}`);
    if (!res.ok) return;
    const json = await res.json();
    if (!json.isAdmin) { router.push(`/groups/${params.groupId}/sessions/${params.sessionId}`); return; }
    setSession(json);
  }

  useEffect(() => { load(); }, []);

  async function saveResult(userId: string, data: z.infer<typeof resultSchema>) {
    setSaving(true);
    const res = await fetch(`/api/groups/${params.groupId}/sessions/${params.sessionId}/results`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, userId }),
    });
    setSaving(false);
    if (!res.ok) { toast({ title: "שגיאה", variant: "destructive" }); return; }
    toast({ title: "✅ נשמר" });
    setEditingResult(null);
    load();
  }

  async function handleDelete() {
    if (!confirm("האם למחוק את הערב? פעולה זו אינה הפיכה.")) return;
    setDeleting(true);
    const res = await fetch(`/api/groups/${params.groupId}/sessions/${params.sessionId}`, { method: "DELETE" });
    setDeleting(false);
    if (!res.ok) { toast({ title: "שגיאה", variant: "destructive" }); return; }
    toast({ title: "🗑️ הערב נמחק" });
    router.push(`/groups/${params.groupId}/sessions`);
  }

  if (!session) return <div className="p-8 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const total = session.results.filter((r: any) => r.isSubmitted).reduce((s: number, r: any) => s + r.profitLoss, 0);

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">עריכת ערב — מנהל</h1>
          <p className="text-muted-foreground">ערוך תוצאות שחקנים</p>
        </div>
        <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleting} className="gap-2">
          {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          מחק ערב
        </Button>
      </div>

      {Math.abs(total) > 0.01 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 flex items-center gap-2 text-sm text-amber-800">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          הסכום לא מאוזן: {formatCurrency(total)} (חייב להיות 0 לסגירה)
        </div>
      )}

      <div className="space-y-3">
        {session.results.map((r: any) => (
          <ResultEditCard
            key={r.userId}
            result={r}
            isEditing={editingResult === r.userId}
            onEdit={() => setEditingResult(r.userId)}
            onCancel={() => setEditingResult(null)}
            onSave={(data: z.infer<typeof resultSchema>) => saveResult(r.userId, data)}
            saving={saving}
          />
        ))}
      </div>

      <Button variant="outline" className="w-full" onClick={() => router.push(`/groups/${params.groupId}/sessions/${params.sessionId}`)}>
        חזרה לסשן
      </Button>
    </div>
  );
}

function ResultEditCard({ result, isEditing, onEdit, onCancel, onSave, saving }: any) {
  const { register, handleSubmit, watch } = useForm({
    resolver: zodResolver(resultSchema),
    defaultValues: { buyIn: result.buyIn, rebuy: result.rebuy, addons: result.addons, cashOut: result.cashOut },
  });
  const w = watch();
  const inv = (Number(w.buyIn) || 0) + (Number(w.rebuy) || 0) + (Number(w.addons) || 0);
  const pl = (Number(w.cashOut) || 0) - inv;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">{result.userName}</CardTitle>
          {!isEditing && (
            <Button size="sm" variant="ghost" onClick={onEdit}>ערוך</Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!isEditing ? (
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span>קנייה: {formatCurrency(result.buyIn)}</span>
            <span>יציאה: {formatCurrency(result.cashOut)}</span>
            <span className={result.profitLoss >= 0 ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
              {result.profitLoss > 0 ? "+" : ""}{formatCurrency(result.profitLoss)}
            </span>
            {!result.isSubmitted && <span className="text-amber-500">לא הוגש</span>}
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSave)} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {["buyIn", "rebuy", "addons", "cashOut"].map((field) => (
                <div key={field} className="space-y-1">
                  <Label className="text-xs">
                    {field === "buyIn" ? "קנייה" : field === "rebuy" ? "ריבאי" : field === "addons" ? "אדאון" : "יציאה"} (₪)
                  </Label>
                  <Input type="number" min="0" step="1" {...register(field as any)} className="h-8 text-sm" />
                </div>
              ))}
            </div>
            <div className="text-xs text-muted-foreground">
              רווח/הפסד: <span className={pl >= 0 ? "text-green-600 font-bold" : "text-red-600 font-bold"}>{pl > 0 ? "+" : ""}{formatCurrency(pl)}</span>
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={saving} className="gap-1">
                {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}שמור
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={onCancel}>ביטול</Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
