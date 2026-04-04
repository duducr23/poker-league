"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { formatDate } from "@/lib/utils";
import { Trophy, Plus, StopCircle, Trash2, Loader2 } from "lucide-react";
import { Season } from "@/types";

interface Props {
  groupId: string;
  isAdmin: boolean;
}

export function SeasonManager({ groupId, isAdmin }: Props) {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));

  async function load() {
    const res = await fetch(`/api/groups/${groupId}/seasons`);
    if (res.ok) setSeasons(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, [groupId]);

  async function handleCreate() {
    if (!name.trim()) { toast({ title: "שם העונה חסר", variant: "destructive" }); return; }
    setCreating(true);
    const res = await fetch(`/api/groups/${groupId}/seasons`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, startDate }),
    });
    setCreating(false);
    if (!res.ok) { toast({ title: "שגיאה", variant: "destructive" }); return; }
    toast({ title: "✅ עונה חדשה נוצרה!" });
    setName("");
    setShowForm(false);
    load();
  }

  async function handleEnd(seasonId: string) {
    const res = await fetch(`/api/groups/${groupId}/seasons/${seasonId}`, { method: "PATCH" });
    if (!res.ok) { toast({ title: "שגיאה", variant: "destructive" }); return; }
    toast({ title: "✅ העונה הסתיימה" });
    load();
  }

  async function handleDelete(seasonId: string) {
    if (!confirm("למחוק את העונה? הסשנים יישארו אך לא יהיו משויכים לעונה.")) return;
    const res = await fetch(`/api/groups/${groupId}/seasons/${seasonId}`, { method: "DELETE" });
    if (!res.ok) { toast({ title: "שגיאה", variant: "destructive" }); return; }
    toast({ title: "עונה נמחקה" });
    load();
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Trophy className="h-4 w-4" />עונות ({seasons.length})
          </CardTitle>
          {isAdmin && !showForm && (
            <Button size="sm" variant="outline" className="gap-1" onClick={() => setShowForm(true)}>
              <Plus className="h-3.5 w-3.5" />עונה חדשה
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isAdmin && showForm && (
          <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
            <div className="space-y-1">
              <Label>שם העונה</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder='למשל: "עונה 1 - 2025"' />
            </div>
            <div className="space-y-1">
              <Label>תאריך התחלה</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleCreate} disabled={creating}>
                {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin ml-1" /> : null}
                צור עונה
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>ביטול</Button>
            </div>
          </div>
        )}

        {loading ? (
          <p className="text-sm text-muted-foreground">טוען...</p>
        ) : seasons.length === 0 ? (
          <p className="text-sm text-muted-foreground">אין עונות עדיין</p>
        ) : (
          <div className="divide-y">
            {seasons.map((s) => (
              <div key={s.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{s.name}</span>
                    {s.isActive && <Badge className="text-xs">פעילה</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDate(s.startDate)}
                    {s.endDate ? ` — ${formatDate(s.endDate)}` : " — עד היום"}
                  </p>
                </div>
                {isAdmin && (
                  <div className="flex gap-1">
                    {s.isActive && (
                      <Button size="sm" variant="outline" className="gap-1 h-7 text-xs" onClick={() => handleEnd(s.id)}>
                        <StopCircle className="h-3 w-3" />סיים
                      </Button>
                    )}
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDelete(s.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
