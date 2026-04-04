"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { formatCurrency } from "@/lib/utils";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";

interface Settlement {
  id: string;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  amount: number;
  isPaid: boolean;
}

interface Props {
  groupId: string;
  sessionId: string;
  currentUserId: string;
}

export function SessionSettlements({ groupId, sessionId, currentUserId }: Props) {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  async function load() {
    const res = await fetch(`/api/groups/${groupId}/settlements`);
    if (!res.ok) { setLoading(false); return; }
    const all: any[] = await res.json();
    setSettlements(all.filter((s) => s.sessionId === sessionId));
    setLoading(false);
  }

  useEffect(() => { load(); }, [sessionId]);

  async function togglePaid(id: string) {
    setToggling(id);
    const res = await fetch(`/api/groups/${groupId}/settlements/${id}`, { method: "PATCH" });
    setToggling(null);
    if (!res.ok) { toast({ title: "שגיאה", variant: "destructive" }); return; }
    load();
  }

  if (loading) return null;
  if (settlements.length === 0) return null;

  const pending = settlements.filter((s) => !s.isPaid);
  const paid = settlements.filter((s) => s.isPaid);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          💸 חישגוזים
          {pending.length > 0 && (
            <Badge variant="destructive" className="text-xs">{pending.length} ממתינות</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {settlements.map((s) => {
          const isInvolved = s.fromUserId === currentUserId || s.toUserId === currentUserId;
          return (
            <div
              key={s.id}
              className="flex items-center justify-between p-3 rounded-lg border text-sm transition-colors"
              style={{
                borderColor: s.isPaid ? "rgba(52,211,153,0.2)" : isInvolved ? "rgba(212,160,23,0.3)" : "rgba(255,255,255,0.07)",
                background: s.isPaid ? "rgba(16,185,129,0.06)" : isInvolved ? "rgba(212,160,23,0.05)" : "rgba(255,255,255,0.02)",
              }}
            >
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`font-medium ${s.fromUserId === currentUserId ? "text-red-400" : ""}`}>
                  {s.fromUserName}
                </span>
                <ArrowLeft className="h-3.5 w-3.5 text-muted-foreground" />
                <span className={`font-medium ${s.toUserId === currentUserId ? "text-emerald-400" : ""}`}>
                  {s.toUserName}
                </span>
                <span className="font-bold text-primary">{formatCurrency(s.amount)}</span>
              </div>
              <div className="flex items-center gap-2">
                {s.isPaid ? (
                  <Badge variant="outline" className="text-emerald-400 border-green-300 text-xs">שולם ✓</Badge>
                ) : (
                  isInvolved && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs gap-1"
                      onClick={() => togglePaid(s.id)}
                      disabled={toggling === s.id}
                    >
                      {toggling === s.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                      סמן כשולם
                    </Button>
                  )
                )}
              </div>
            </div>
          );
        })}
        {paid.length > 0 && pending.length > 0 && (
          <p className="text-xs text-muted-foreground pt-1">{paid.length} מתוך {settlements.length} חישגוזים שולמו</p>
        )}
        {pending.length === 0 && (
          <p className="text-xs text-emerald-400 font-medium">✅ כל החישגוזים שולמו!</p>
        )}
      </CardContent>
    </Card>
  );
}
