"use client";
import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { formatCurrency } from "@/lib/utils";
import { Loader2, CheckCircle2, XCircle, Clock, TrendingUp, TrendingDown, Minus, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserRef {
  id: string;
  name: string;
  image?: string | null;
}

interface FinancialRequest {
  id: string;
  sessionId: string;
  userId: string;
  type: "INITIAL_BUYIN" | "REBUY";
  amount: number;
  status: "PENDING" | "APPROVED" | "DECLINED";
  createdAt: string;
  createdByUserId: string;
  approvedAt?: string | null;
  approvedByUserId?: string | null;
  declinedAt?: string | null;
  declinedByUserId?: string | null;
  user: UserRef;
  createdBy: { id: string; name: string };
  approvedBy?: { id: string; name: string } | null;
  declinedBy?: { id: string; name: string } | null;
}

interface ParticipantSummary {
  userId: string;
  name: string;
  approvedBuyIn: number;
  approvedRebuys: number;
  totalInvested: number;
  finalCashOut: number;
  profitLoss: number;
  pendingCount: number;
}

interface Props {
  groupId: string;
  sessionId: string;
  currentUserId: string;
  isOpen: boolean;
  participants: Array<{ userId: string; name: string; image?: string | null }>;
}

function statusBadge(status: string) {
  if (status === "APPROVED") return (
    <Badge className="text-xs px-2 py-0.5" style={{ background: "rgba(52,211,153,0.15)", color: "#34d399", border: "1px solid rgba(52,211,153,0.3)" }}>
      <CheckCircle2 className="h-3 w-3 ml-1" />מאושר
    </Badge>
  );
  if (status === "DECLINED") return (
    <Badge className="text-xs px-2 py-0.5" style={{ background: "rgba(239,68,68,0.12)", color: "#f87171", border: "1px solid rgba(239,68,68,0.25)" }}>
      <XCircle className="h-3 w-3 ml-1" />נדחה
    </Badge>
  );
  return (
    <Badge className="text-xs px-2 py-0.5" style={{ background: "rgba(251,191,36,0.12)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.25)" }}>
      <Clock className="h-3 w-3 ml-1" />ממתין לאישור
    </Badge>
  );
}

function typeLabel(type: string) {
  return type === "INITIAL_BUYIN" ? "בקשת Buy-in" : "בקשת Rebuy";
}

function computeSummaries(
  participants: Array<{ userId: string; name: string; image?: string | null }>,
  requests: FinancialRequest[],
  cashOutMap: Record<string, number>
): ParticipantSummary[] {
  return participants.map((p) => {
    const userRequests = requests.filter((r) => r.userId === p.userId);
    const approvedBuyIn =
      userRequests.find((r) => r.type === "INITIAL_BUYIN" && r.status === "APPROVED")?.amount ?? 0;
    const approvedRebuys = userRequests
      .filter((r) => r.type === "REBUY" && r.status === "APPROVED")
      .reduce((s, r) => s + r.amount, 0);
    const totalInvested = approvedBuyIn + approvedRebuys;
    const finalCashOut = cashOutMap[p.userId] ?? 0;
    const profitLoss = finalCashOut - totalInvested;
    const pendingCount = userRequests.filter((r) => r.status === "PENDING").length;
    return {
      userId: p.userId,
      name: p.name,
      approvedBuyIn,
      approvedRebuys,
      totalInvested,
      finalCashOut,
      profitLoss,
      pendingCount,
    };
  });
}

export function FinancialRequestsPanel({
  groupId,
  sessionId,
  currentUserId,
  isOpen,
  participants,
}: Props) {
  const [requests, setRequests] = useState<FinancialRequest[]>([]);
  const [cashOutMap, setCashOutMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Request form state
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestType, setRequestType] = useState<"INITIAL_BUYIN" | "REBUY">("INITIAL_BUYIN");
  const [requestAmount, setRequestAmount] = useState("");
  const [submittingRequest, setSubmittingRequest] = useState(false);

  // Cash-out form state
  const [cashOutInput, setCashOutInput] = useState("");
  const [savingCashOut, setSavingCashOut] = useState(false);

  const fetchRequests = useCallback(async () => {
    try {
      const res = await fetch(`/api/groups/${groupId}/sessions/${sessionId}/financial-requests`);
      if (!res.ok) return;
      const data: FinancialRequest[] = await res.json();
      setRequests(data);
    } catch {
      // silently ignore polling errors
    } finally {
      setLoading(false);
    }
  }, [groupId, sessionId]);

  const fetchCashOuts = useCallback(async () => {
    try {
      const res = await fetch(`/api/groups/${groupId}/sessions/${sessionId}`);
      if (!res.ok) return;
      const data = await res.json();
      const map: Record<string, number> = {};
      for (const r of data.results ?? []) {
        map[r.userId] = r.finalCashOut ?? 0;
      }
      setCashOutMap(map);
      // Pre-fill cash-out input for current user
      if (map[currentUserId] !== undefined) {
        setCashOutInput(String(map[currentUserId] || ""));
      }
    } catch {
      // silently ignore
    }
  }, [groupId, sessionId, currentUserId]);

  useEffect(() => {
    fetchRequests();
    fetchCashOuts();
  }, [fetchRequests, fetchCashOuts]);

  // Poll every 5 seconds
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      fetchRequests();
      fetchCashOuts();
    }, 5000);
    return () => clearInterval(interval);
  }, [isOpen, fetchRequests, fetchCashOuts]);

  async function handleApprove(requestId: string) {
    setActionLoading(requestId + "-approve");
    const res = await fetch(
      `/api/groups/${groupId}/sessions/${sessionId}/financial-requests/${requestId}/approve`,
      { method: "POST" }
    );
    const json = await res.json();
    setActionLoading(null);
    if (!res.ok) {
      toast({ title: "שגיאה", description: json.error, variant: "destructive" });
      return;
    }
    toast({ title: "הבקשה אושרה" });
    fetchRequests();
    fetchCashOuts();
  }

  async function handleDecline(requestId: string) {
    setActionLoading(requestId + "-decline");
    const res = await fetch(
      `/api/groups/${groupId}/sessions/${sessionId}/financial-requests/${requestId}/decline`,
      { method: "POST" }
    );
    const json = await res.json();
    setActionLoading(null);
    if (!res.ok) {
      toast({ title: "שגיאה", description: json.error, variant: "destructive" });
      return;
    }
    toast({ title: "הבקשה נדחתה" });
    fetchRequests();
  }

  async function handleSubmitRequest() {
    const amount = parseFloat(requestAmount);
    if (!amount || amount <= 0) {
      toast({ title: "סכום לא תקין", variant: "destructive" });
      return;
    }
    setSubmittingRequest(true);
    const res = await fetch(
      `/api/groups/${groupId}/sessions/${sessionId}/financial-requests`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUserId, type: requestType, amount }),
      }
    );
    const json = await res.json();
    setSubmittingRequest(false);
    if (!res.ok) {
      toast({ title: "שגיאה", description: json.error, variant: "destructive" });
      return;
    }
    toast({ title: requestType === "INITIAL_BUYIN" ? "בקשת Buy-in נשלחה" : "בקשת Rebuy נשלחה" });
    setRequestAmount("");
    setShowRequestForm(false);
    fetchRequests();
  }

  async function handleSaveCashOut() {
    const amount = parseFloat(cashOutInput);
    if (isNaN(amount) || amount < 0) {
      toast({ title: "סכום לא תקין", variant: "destructive" });
      return;
    }
    setSavingCashOut(true);
    const res = await fetch(
      `/api/groups/${groupId}/sessions/${sessionId}/participants/${currentUserId}/cashout`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ finalCashOut: amount }),
      }
    );
    const json = await res.json();
    setSavingCashOut(false);
    if (!res.ok) {
      toast({ title: "שגיאה", description: json.error, variant: "destructive" });
      return;
    }
    toast({ title: "Cash-out נשמר" });
    fetchCashOuts();
  }

  const summaries = computeSummaries(participants, requests, cashOutMap);

  const pendingFromOthers = requests.filter(
    (r) => r.status === "PENDING" && r.userId !== currentUserId
  );

  const myRequests = requests.filter((r) => r.userId === currentUserId);
  const myApprovedBuyIn = myRequests.find(
    (r) => r.type === "INITIAL_BUYIN" && r.status === "APPROVED"
  );
  const myPendingBuyIn = myRequests.find(
    (r) => r.type === "INITIAL_BUYIN" && r.status === "PENDING"
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: "#d4a017" }} />
      </div>
    );
  }

  return (
    <div className="space-y-5" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold" style={{ color: "#d4a017" }}>
          מערכת Buy-in ו-Rebuy
        </h2>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => { fetchRequests(); fetchCashOuts(); }}
          className="h-7 px-2 text-xs text-slate-400 hover:text-slate-200"
        >
          <RefreshCw className="h-3.5 w-3.5 ml-1" />רענן
        </Button>
      </div>

      {/* My actions — only when session is open */}
      {isOpen && (
        <Card style={{ borderColor: "rgba(212,160,23,0.25)", background: "rgba(212,160,23,0.04)" }}>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm" style={{ color: "#d4a017" }}>הפעולות שלי</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-4">
            {/* Request buy-in / rebuy */}
            <div className="space-y-3">
              {!showRequestForm ? (
                <div className="flex gap-2 flex-wrap">
                  {!myApprovedBuyIn && !myPendingBuyIn && (
                    <Button
                      size="sm"
                      className="gap-1 text-xs"
                      style={{ background: "#d4a017", color: "#0c0c18" }}
                      onClick={() => { setRequestType("INITIAL_BUYIN"); setShowRequestForm(true); }}
                    >
                      בקש Buy-in
                    </Button>
                  )}
                  {myApprovedBuyIn && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 text-xs border-amber-500/40 text-amber-400 hover:bg-amber-500/10"
                      onClick={() => { setRequestType("REBUY"); setShowRequestForm(true); }}
                    >
                      בקש Rebuy
                    </Button>
                  )}
                  {myPendingBuyIn && (
                    <span className="text-xs text-amber-400 flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />בקשת Buy-in ממתינה לאישור
                    </span>
                  )}
                </div>
              ) : (
                <div className="space-y-2 rounded-lg p-3" style={{ background: "rgba(0,0,0,0.25)", border: "1px solid rgba(212,160,23,0.2)" }}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-slate-200">
                      {requestType === "INITIAL_BUYIN" ? "בקשת Buy-in" : "בקשת Rebuy"}
                    </span>
                    {myApprovedBuyIn && (
                      <div className="flex gap-1">
                        <button
                          className={cn("text-xs px-2 py-0.5 rounded", requestType === "INITIAL_BUYIN" ? "bg-amber-500/20 text-amber-300" : "text-slate-500")}
                          onClick={() => setRequestType("INITIAL_BUYIN")}
                          disabled={!!myApprovedBuyIn}
                        >Buy-in</button>
                        <button
                          className={cn("text-xs px-2 py-0.5 rounded", requestType === "REBUY" ? "bg-amber-500/20 text-amber-300" : "text-slate-500")}
                          onClick={() => setRequestType("REBUY")}
                        >Rebuy</button>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 items-end">
                    <div className="flex-1 space-y-1">
                      <Label className="text-xs text-slate-400">סכום (₪)</Label>
                      <Input
                        type="number"
                        min="1"
                        step="1"
                        value={requestAmount}
                        onChange={(e) => setRequestAmount(e.target.value)}
                        className="h-8 text-sm"
                        placeholder="0"
                        autoFocus
                      />
                    </div>
                    <Button
                      size="sm"
                      className="h-8"
                      style={{ background: "#d4a017", color: "#0c0c18" }}
                      onClick={handleSubmitRequest}
                      disabled={submittingRequest}
                    >
                      {submittingRequest ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "שלח"}
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 text-slate-400" onClick={() => setShowRequestForm(false)}>
                      ביטול
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Final Cash-Out */}
            <div className="space-y-2 pt-1 border-t border-white/5">
              <Label className="text-xs text-slate-400">Cash-Out סופי (₪)</Label>
              <div className="flex gap-2 items-end">
                <Input
                  type="number"
                  min="0"
                  step="1"
                  value={cashOutInput}
                  onChange={(e) => setCashOutInput(e.target.value)}
                  className="h-8 text-sm flex-1"
                  placeholder="0"
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs"
                  onClick={handleSaveCashOut}
                  disabled={savingCashOut}
                >
                  {savingCashOut ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "שמור"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending requests from others */}
      {isOpen && pendingFromOthers.length > 0 && (
        <Card style={{ borderColor: "rgba(251,191,36,0.25)", background: "rgba(251,191,36,0.04)" }}>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-400" />
              <span className="text-amber-300">בקשות ממתינות לאישורך</span>
              <Badge className="text-xs" style={{ background: "rgba(251,191,36,0.2)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.3)" }}>
                {pendingFromOthers.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-3">
            {pendingFromOthers.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between gap-3 rounded-lg p-3"
                style={{ background: "rgba(0,0,0,0.2)", border: "1px solid rgba(251,191,36,0.15)" }}
              >
                <div className="space-y-0.5 min-w-0">
                  <p className="text-sm font-medium text-slate-100 truncate">{r.user.name}</p>
                  <p className="text-xs text-slate-400">
                    {typeLabel(r.type)} — <span className="text-amber-300 font-medium">{formatCurrency(r.amount)}</span>
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    size="sm"
                    className="h-7 px-3 text-xs"
                    style={{ background: "#d4a017", color: "#0c0c18" }}
                    onClick={() => handleApprove(r.id)}
                    disabled={actionLoading === r.id + "-approve" || actionLoading === r.id + "-decline"}
                  >
                    {actionLoading === r.id + "-approve"
                      ? <Loader2 className="h-3 w-3 animate-spin" />
                      : "אשר"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 px-3 text-xs border-red-500/40 text-red-400 hover:bg-red-500/10"
                    onClick={() => handleDecline(r.id)}
                    disabled={actionLoading === r.id + "-approve" || actionLoading === r.id + "-decline"}
                  >
                    {actionLoading === r.id + "-decline"
                      ? <Loader2 className="h-3 w-3 animate-spin" />
                      : "דחה"}
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Per-participant summary cards */}
      <div className="space-y-2">
        <h3 className="text-xs uppercase tracking-wider text-slate-500 font-semibold">סיכום משתתפים</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {summaries.map((s) => {
            const isMe = s.userId === currentUserId;
            const pl = s.profitLoss;
            const plColor = pl > 0 ? "#34d399" : pl < 0 ? "#f87171" : "#64748b";
            const plIcon = pl > 0
              ? <TrendingUp className="h-4 w-4" style={{ color: plColor }} />
              : pl < 0
              ? <TrendingDown className="h-4 w-4" style={{ color: plColor }} />
              : <Minus className="h-4 w-4" style={{ color: plColor }} />;

            return (
              <div
                key={s.userId}
                className="rounded-lg p-3 space-y-2"
                style={{
                  background: isMe ? "rgba(212,160,23,0.06)" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${isMe ? "rgba(212,160,23,0.25)" : "rgba(255,255,255,0.07)"}`,
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-100">
                    {s.name}{isMe && " (אתה)"}
                  </span>
                  {s.pendingCount > 0 && (
                    <Badge className="text-xs" style={{ background: "rgba(251,191,36,0.15)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.25)" }}>
                      {s.pendingCount} ממתין
                    </Badge>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Buy-in מאושר</span>
                    <span className="text-slate-300">{formatCurrency(s.approvedBuyIn)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Rebuy מאושר</span>
                    <span className="text-slate-300">{formatCurrency(s.approvedRebuys)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Cash-Out סופי</span>
                    <span className="text-slate-300">{formatCurrency(s.finalCashOut)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">רווח/הפסד</span>
                    <span className="flex items-center gap-1 font-semibold" style={{ color: plColor }}>
                      {plIcon}
                      {pl > 0 ? "+" : ""}{formatCurrency(pl)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Request history feed */}
      {requests.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs uppercase tracking-wider text-slate-500 font-semibold">היסטוריית בקשות</h3>
          <div className="space-y-2">
            {requests.map((r) => (
              <div
                key={r.id}
                className="rounded-lg p-3 flex items-start justify-between gap-3"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <div className="space-y-0.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm text-slate-200 font-medium">{r.user.name}</span>
                    <span className="text-xs text-slate-500">{typeLabel(r.type)}</span>
                    <span className="text-xs font-semibold text-amber-300">{formatCurrency(r.amount)}</span>
                  </div>
                  <div className="text-xs text-slate-500 space-y-0.5">
                    {r.status === "APPROVED" && r.approvedBy && (
                      <p>אושר על ידי {r.approvedBy.name}</p>
                    )}
                    {r.status === "DECLINED" && r.declinedBy && (
                      <p>נדחה על ידי {r.declinedBy.name}</p>
                    )}
                    <p>{new Date(r.createdAt).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })}</p>
                  </div>
                </div>
                <div className="shrink-0">{statusBadge(r.status)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
