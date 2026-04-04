"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { SessionResultsTable } from "@/components/sessions/session-results-table";
import { SessionSubmissionProgress } from "@/components/sessions/session-submission-progress";
import { SessionSettlements } from "@/components/sessions/session-settlements";
import { AdminSessionPanel } from "@/components/sessions/admin-session-panel";
import { toast } from "@/components/ui/use-toast";
import { formatDate, formatCurrency, getStatusLabel, getStatusColor } from "@/lib/utils";
import { Loader2, MapPin, Lock, Unlock, Trash2, Pencil, AlertCircle, CheckCircle2, Share2, Settings2 } from "lucide-react";

const schema = z.object({
  buyIn: z.coerce.number().min(0, "חייב להיות 0 או יותר"),
  rebuy: z.coerce.number().min(0),
  addons: z.coerce.number().min(0),
  cashOut: z.coerce.number().min(0),
});
type FormData = z.infer<typeof schema>;

export default function SessionDetailPage() {
  const { data: authSession } = useSession();
  const params = useParams<{ groupId: string; sessionId: string }>();
  const router = useRouter();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [closing, setClosing] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });
  const watched = watch();
  const totalInvested = (Number(watched.buyIn) || 0) + (Number(watched.rebuy) || 0) + (Number(watched.addons) || 0);
  const profitLoss = (Number(watched.cashOut) || 0) - totalInvested;

  async function load() {
    const res = await fetch(`/api/groups/${params.groupId}/sessions/${params.sessionId}`);
    if (!res.ok) return;
    const json = await res.json();
    setData(json);
    const myResult = json.results.find((r: any) => r.userId === authSession?.user?.id);
    if (myResult?.isSubmitted) {
      reset({ buyIn: myResult.buyIn, rebuy: myResult.rebuy, addons: myResult.addons, cashOut: myResult.cashOut });
    }
    setLoading(false);
  }

  useEffect(() => { if (authSession?.user?.id) load(); }, [authSession?.user?.id]);

  async function onSubmit(formData: FormData) {
    setSubmitting(true);
    const res = await fetch(`/api/groups/${params.groupId}/sessions/${params.sessionId}/results`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    const json = await res.json();
    setSubmitting(false);
    if (!res.ok) { toast({ title: "שגיאה", description: json.error, variant: "destructive" }); return; }
    toast({ title: "✅ התוצאה נשמרה!" });
    load();
  }

  async function handleClose() {
    setClosing(true);
    setValidationErrors([]);
    const res = await fetch(`/api/groups/${params.groupId}/sessions/${params.sessionId}/close`, { method: "POST" });
    const json = await res.json();
    setClosing(false);
    if (!res.ok) {
      setValidationErrors(json.validation?.errors || [json.error]);
      toast({ title: "לא ניתן לסגור", description: "יש תקלות בולידציה", variant: "destructive" });
      return;
    }
    toast({ title: "✅ הערב נסגר!" });
    load();
  }

  async function handleReopen() {
    const res = await fetch(`/api/groups/${params.groupId}/sessions/${params.sessionId}/reopen`, { method: "POST" });
    if (!res.ok) { toast({ title: "שגיאה", variant: "destructive" }); return; }
    toast({ title: "🔓 הערב נפתח מחדש" });
    load();
  }

  function handleShare() {
    const url = `${window.location.origin}/groups/${params.groupId}/sessions/${params.sessionId}/summary`;
    navigator.clipboard.writeText(url).then(() => {
      toast({ title: "🔗 הקישור הועתק ללוח!" });
    });
  }

  if (loading) return <div className="p-8 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!data) return <div className="p-8 text-center text-muted-foreground">ערב לא נמצא</div>;

  const myResult = data.results.find((r: any) => r.userId === authSession?.user?.id);
  const isParticipant = !!myResult;
  const isOpen = data.status === "OPEN";
  const isClosed = data.status === "CLOSED";
  const isAdmin = data.isAdmin;

  const progress = {
    total: data.results.length,
    submitted: data.results.filter((r: any) => r.isSubmitted).length,
    pending: data.results.filter((r: any) => !r.isSubmitted).map((r: any) => ({ userId: r.userId, name: r.userName })),
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold">{formatDate(data.date)}</h1>
            <span className={`text-sm px-3 py-1 rounded-full border font-medium ${getStatusColor(data.status)}`}>
              {getStatusLabel(data.status)}
            </span>
          </div>
          {data.location && (
            <p className="text-muted-foreground flex items-center gap-1 mt-1"><MapPin className="h-4 w-4" />{data.location}</p>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          {isClosed && (
            <Button onClick={handleShare} variant="outline" size="sm" className="gap-2">
              <Share2 className="h-4 w-4" />שתף תקציר
            </Button>
          )}
          {isAdmin && (
            <>
              {isOpen && (
                <Button onClick={handleClose} disabled={closing} variant="outline" className="gap-2">
                  {closing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                  סגור ערב
                </Button>
              )}
              {isClosed && (
                <Button onClick={handleReopen} variant="outline" className="gap-2">
                  <Unlock className="h-4 w-4" />פתח מחדש
                </Button>
              )}
              <Button
                variant={showAdminPanel ? "default" : "outline"}
                size="sm"
                className="gap-2"
                onClick={() => setShowAdminPanel((v) => !v)}
              >
                <Settings2 className="h-4 w-4" />
                מצב מנהל
              </Button>
              <Link href={`/groups/${params.groupId}/sessions/${params.sessionId}/edit`}>
                <Button variant="ghost" size="icon"><Pencil className="h-4 w-4" /></Button>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Validation errors */}
      {validationErrors.length > 0 && (
        <div className="rounded-lg p-4 space-y-1" style={{background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.25)"}}>
          <p className="font-semibold text-red-400 flex items-center gap-2"><AlertCircle className="h-4 w-4" />לא ניתן לסגור את הערב:</p>
          {validationErrors.map((e, i) => <p key={i} className="text-sm text-red-400">• {e}</p>)}
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* Submit own result */}
          {isParticipant && isOpen && (
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-base">
                  {myResult.isSubmitted ? "✅ עדכן את התוצאה שלך" : "⏳ הגש את התוצאה שלך"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>קנייה (₪)</Label>
                      <Input type="number" min="0" step="10" {...register("buyIn")} />
                      {errors.buyIn && <p className="text-xs text-destructive">{errors.buyIn.message}</p>}
                    </div>
                    <div className="space-y-1">
                      <Label>ריבאי (₪)</Label>
                      <Input type="number" min="0" step="10" {...register("rebuy")} />
                    </div>
                    <div className="space-y-1">
                      <Label>אדאון (₪)</Label>
                      <Input type="number" min="0" step="10" {...register("addons")} />
                    </div>
                    <div className="space-y-1">
                      <Label>יציאה (₪)</Label>
                      <Input type="number" min="0" step="10" {...register("cashOut")} />
                      {errors.cashOut && <p className="text-xs text-destructive">{errors.cashOut.message}</p>}
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-background border">
                    <div className="text-sm">
                      <span className="text-muted-foreground">סה"כ השקעה: </span>
                      <span className="font-medium">{formatCurrency(totalInvested)}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">רווח/הפסד: </span>
                      <span className={`font-bold ${profitLoss > 0 ? "text-emerald-400" : profitLoss < 0 ? "text-red-400" : "text-muted-foreground"}`}>
                        {profitLoss > 0 ? "+" : ""}{formatCurrency(profitLoss)}
                      </span>
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={submitting}>
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <CheckCircle2 className="h-4 w-4 ml-2" />}
                    {myResult.isSubmitted ? "עדכן תוצאה" : "הגש תוצאה"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {isParticipant && isClosed && myResult?.isSubmitted && (
            <Card style={{borderColor:"rgba(52,211,153,0.25)",background:"rgba(16,185,129,0.06)"}}>
              <CardContent className="p-4">
                <p className="text-sm font-medium text-emerald-400">הערב סגור — התוצאה שלך</p>
                <div className="flex gap-4 mt-2 text-sm">
                  <span>קנייה: {formatCurrency(myResult.buyIn)}</span>
                  <span>יציאה: {formatCurrency(myResult.cashOut)}</span>
                  <span className={`font-bold ${myResult.profitLoss > 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {myResult.profitLoss > 0 ? "+" : ""}{formatCurrency(myResult.profitLoss)}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Results table */}
          <Card>
            <CardHeader><CardTitle className="text-base">תוצאות משתתפים</CardTitle></CardHeader>
            <CardContent>
              <SessionResultsTable results={data.results.map((r: any) => ({
                userId: r.userId, name: r.userName, buyIn: r.buyIn, rebuy: r.rebuy,
                addons: r.addons, cashOut: r.cashOut, totalInvested: r.totalInvested,
                profitLoss: r.profitLoss, isSubmitted: r.isSubmitted,
              }))} />
            </CardContent>
          </Card>

          {/* Admin panel */}
          {isAdmin && showAdminPanel && (
            <AdminSessionPanel
              groupId={params.groupId}
              sessionId={params.sessionId}
              results={data.results}
              isOpen={isOpen}
              onRefresh={load}
            />
          )}

          {/* Settlements */}
          {isClosed && (
            <SessionSettlements
              groupId={params.groupId}
              sessionId={params.sessionId}
              currentUserId={authSession?.user?.id || ""}
            />
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">התקדמות הגשה</CardTitle></CardHeader>
            <CardContent><SessionSubmissionProgress progress={progress} /></CardContent>
          </Card>
          {isClosed && (
            <Card>
              <CardContent className="p-4">
                <Link href={`/groups/${params.groupId}/sessions/${params.sessionId}/summary`}>
                  <Button variant="outline" className="w-full gap-2" size="sm">
                    <Share2 className="h-4 w-4" />צפה בתקציר הניתן לשיתוף
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
          {data.notes && (
            <Card>
              <CardHeader><CardTitle className="text-sm">הערות</CardTitle></CardHeader>
              <CardContent><p className="text-sm text-muted-foreground">{data.notes}</p></CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
