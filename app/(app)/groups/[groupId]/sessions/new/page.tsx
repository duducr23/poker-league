"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { Loader2, CalendarDays, MapPin, Users, Check, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { Season } from "@/types";

const schema = z.object({
  date: z.string().min(1, "נא לבחור תאריך"),
  location: z.string().optional(),
  notes: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

interface Member { id: string; name: string; role: string }

export default function NewSessionPage() {
  const router = useRouter();
  const params = useParams<{ groupId: string }>();
  const [members, setMembers] = useState<Member[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<string>("");
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { date: new Date().toISOString().slice(0, 10) },
  });

  useEffect(() => {
    fetch(`/api/groups/${params.groupId}/members`)
      .then((r) => r.json())
      .then(setMembers);
    fetch(`/api/groups/${params.groupId}/seasons`)
      .then((r) => r.json())
      .then((data: Season[]) => {
        setSeasons(data);
        const active = data.find((s) => s.isActive);
        if (active) setSelectedSeason(active.id);
      });
  }, [params.groupId]);

  function toggleMember(id: string) {
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  function selectAll() { setSelected(members.map((m) => m.id)); }

  async function onSubmit(data: FormData) {
    if (selected.length < 2) {
      toast({ title: "שגיאה", description: "יש לבחור לפחות 2 משתתפים", variant: "destructive" });
      return;
    }
    setLoading(true);
    const res = await fetch(`/api/groups/${params.groupId}/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, participantIds: selected, ...(selectedSeason ? { seasonId: selectedSeason } : {}) }),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) { toast({ title: "שגיאה", description: json.error, variant: "destructive" }); return; }
    toast({ title: "✅ הערב נוצר!" });
    router.push(`/groups/${params.groupId}/sessions/${json.id}`);
  }

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">ערב משחק חדש</h1>
        <p className="text-muted-foreground">הגדר את פרטי הערב ובחר משתתפים</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><CalendarDays className="h-4 w-4" />פרטי הערב</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>תאריך *</Label>
              <Input type="date" {...register("date")} />
              {errors.date && <p className="text-xs text-destructive">{errors.date.message}</p>}
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />מיקום</Label>
              <Input placeholder='למשל: "בית ישראל"' {...register("location")} />
            </div>
            <div className="space-y-2">
              <Label>הערות</Label>
              <Textarea placeholder="הערות נוספות..." rows={2} {...register("notes")} />
            </div>
            {seasons.length > 0 && (
              <div className="space-y-2">
                <Label className="flex items-center gap-1"><Trophy className="h-3.5 w-3.5" />עונה</Label>
                <select
                  value={selectedSeason}
                  onChange={(e) => setSelectedSeason(e.target.value)}
                  className="w-full rounded-lg px-3 py-2 text-sm text-slate-100"
                  style={{background:"#0c0c18", border:"1px solid rgba(212,160,23,0.18)"}}
                >
                  <option value="">ללא עונה</option>
                  {seasons.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}{s.isActive ? " (פעילה)" : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4" />משתתפים ({selected.length})</CardTitle>
              <Button type="button" variant="ghost" size="sm" onClick={selectAll}>בחר הכל</Button>
            </div>
          </CardHeader>
          <CardContent>
            {members.length === 0 ? (
              <p className="text-sm text-muted-foreground">טוען חברים...</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {members.map((m) => {
                  const isSelected = selected.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => toggleMember(m.id)}
                      className={cn(
                        "flex items-center gap-2 p-3 rounded-lg border text-sm text-right transition-all",
                        isSelected ? "border-primary bg-primary/5 font-medium" : "border-border hover:bg-muted/50"
                      )}
                    >
                      <div className={cn("h-5 w-5 rounded border flex items-center justify-center flex-shrink-0",
                        isSelected ? "bg-primary border-primary" : "border-muted-foreground"
                      )}>
                        {isSelected && <Check className="h-3 w-3 text-white" />}
                      </div>
                      <span className="truncate">{m.name}</span>
                      {m.role === "ADMIN" && <span className="text-xs text-muted-foreground mr-auto">(מנהל)</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? <><Loader2 className="h-4 w-4 animate-spin ml-2" />יוצר ערב...</> : "צור ערב משחק"}
        </Button>
      </form>
    </div>
  );
}
