"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { Loader2, Trash2, ChevronDown, ChevronUp, RefreshCw, X, ZoomIn } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type SplitMethod = "EQUAL" | "MANUAL";
type ExpenseChargeStatus =
  | "PENDING_PAYMENT"
  | "PROOF_UPLOADED"
  | "APPROVED"
  | "DECLINED"
  | "CANCELLED";

interface UserRef {
  id: string;
  name: string;
  image?: string | null;
}

interface ExpenseCharge {
  id: string;
  expenseId: string;
  payerUserId: string;
  receiverUserId: string;
  amount: number;
  status: ExpenseChargeStatus;
  proofImageUrl?: string | null;
  paymentMarkedAt?: string | null;
  approvedAt?: string | null;
  approvedByUserId?: string | null;
  declinedAt?: string | null;
  declinedByUserId?: string | null;
  createdAt: string;
  payer: UserRef;
  receiver: UserRef;
  approvedBy?: UserRef | null;
  declinedBy?: UserRef | null;
}

interface SessionExpense {
  id: string;
  sessionId: string;
  title: string;
  description?: string | null;
  totalAmount: number;
  paidByUserId: string;
  splitMethod: SplitMethod;
  createdByUserId: string;
  createdAt: string;
  paidBy: UserRef;
  createdBy: UserRef;
  charges: ExpenseCharge[];
}

interface Participant {
  userId: string;
  name: string;
  image?: string | null;
}

interface Props {
  sessionId: string;
  groupId: string;
  currentUserId: string;
  sessionStatus: "OPEN" | "CLOSED" | "CANCELLED";
  participants: Participant[];
  isAdmin: boolean;
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function statusBadge(status: ExpenseChargeStatus) {
  switch (status) {
    case "PENDING_PAYMENT":
      return (
        <Badge
          className="text-xs px-2 py-0.5"
          style={{
            background: "rgba(100,116,139,0.15)",
            color: "#94a3b8",
            border: "1px solid rgba(100,116,139,0.3)",
          }}
        >
          ממתין לתשלום
        </Badge>
      );
    case "PROOF_UPLOADED":
      return (
        <Badge
          className="text-xs px-2 py-0.5"
          style={{
            background: "rgba(251,191,36,0.15)",
            color: "#fbbf24",
            border: "1px solid rgba(251,191,36,0.3)",
          }}
        >
          הוכחה הועלתה
        </Badge>
      );
    case "APPROVED":
      return (
        <Badge
          className="text-xs px-2 py-0.5"
          style={{
            background: "rgba(52,211,153,0.15)",
            color: "#34d399",
            border: "1px solid rgba(52,211,153,0.3)",
          }}
        >
          אושר ✅
        </Badge>
      );
    case "DECLINED":
      return (
        <Badge
          className="text-xs px-2 py-0.5"
          style={{
            background: "rgba(239,68,68,0.12)",
            color: "#f87171",
            border: "1px solid rgba(239,68,68,0.3)",
          }}
        >
          נדחה ❌
        </Badge>
      );
    case "CANCELLED":
      return (
        <Badge
          className="text-xs px-2 py-0.5"
          style={{
            background: "rgba(100,116,139,0.15)",
            color: "#94a3b8",
            border: "1px solid rgba(100,116,139,0.3)",
          }}
        >
          בוטל
        </Badge>
      );
  }
}

function formatCurrency(amount: number) {
  return `₪${amount.toFixed(2).replace(/\.00$/, "")}`;
}

// ─── Image Lightbox ───────────────────────────────────────────────────────────

function ImageLightbox({
  src,
  onClose,
}: {
  src: string;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.85)" }}
      onClick={onClose}
    >
      <div className="relative max-w-[90vw] max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 rounded-full w-7 h-7 flex items-center justify-center text-white"
          style={{ background: "rgba(255,255,255,0.15)" }}
        >
          <X className="h-4 w-4" />
        </button>
        <img
          src={src}
          alt="הוכחת תשלום"
          className="max-w-[85vw] max-h-[85vh] rounded-lg object-contain"
        />
      </div>
    </div>
  );
}

// ─── Charge Row ───────────────────────────────────────────────────────────────

function ChargeRow({
  charge,
  groupId,
  sessionId,
  expenseId,
  currentUserId,
  onRefresh,
}: {
  charge: ExpenseCharge;
  groupId: string;
  sessionId: string;
  expenseId: string;
  currentUserId: string;
  onRefresh: () => void;
}) {
  const [showProofForm, setShowProofForm] = useState(false);
  const [proofFile, setProofFile] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isMyCharge = charge.payerUserId === currentUserId;
  const isMyReceiving = charge.receiverUserId === currentUserId;
  const canUploadProof =
    isMyCharge &&
    (charge.status === "PENDING_PAYMENT" || charge.status === "DECLINED");
  const canApproveOrDecline = isMyReceiving && charge.status === "PROOF_UPLOADED";

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setProofFile((ev.target?.result as string) ?? "");
    };
    reader.readAsDataURL(file);
  }

  async function handleSendProof() {
    setSubmitting(true);
    const res = await fetch(
      `/api/groups/${groupId}/sessions/${sessionId}/expenses/${expenseId}/charges/${charge.id}/proof`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proofImageUrl: proofFile || undefined }),
      }
    );
    const json = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      toast({ title: "שגיאה", description: json.error, variant: "destructive" });
      return;
    }
    toast({ title: "הוכחת תשלום נשלחה" });
    setShowProofForm(false);
    setProofFile("");
    onRefresh();
  }

  async function handleApprove() {
    setActionLoading("approve");
    const res = await fetch(
      `/api/groups/${groupId}/sessions/${sessionId}/expenses/${expenseId}/charges/${charge.id}/approve`,
      { method: "POST" }
    );
    const json = await res.json();
    setActionLoading(null);
    if (!res.ok) {
      toast({ title: "שגיאה", description: json.error, variant: "destructive" });
      return;
    }
    toast({ title: "התשלום אושר ✅" });
    onRefresh();
  }

  async function handleDecline() {
    setActionLoading("decline");
    const res = await fetch(
      `/api/groups/${groupId}/sessions/${sessionId}/expenses/${expenseId}/charges/${charge.id}/decline`,
      { method: "POST" }
    );
    const json = await res.json();
    setActionLoading(null);
    if (!res.ok) {
      toast({ title: "שגיאה", description: json.error, variant: "destructive" });
      return;
    }
    toast({ title: "התשלום נדחה" });
    onRefresh();
  }

  return (
    <div
      className="rounded-lg p-3 space-y-2"
      style={{
        background: "rgba(0,0,0,0.2)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {lightboxSrc && (
        <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
      )}

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="text-sm text-slate-300 flex items-center gap-1.5 flex-wrap">
          <span className="font-medium text-slate-100">{charge.payer.name}</span>
          <span className="text-slate-500">→</span>
          <span className="font-medium text-slate-100">{charge.receiver.name}</span>
          <span className="text-amber-300 font-semibold">{formatCurrency(charge.amount)}</span>
        </div>
        <div className="flex items-center gap-2">
          {charge.proofImageUrl && (
            <button
              onClick={() => setLightboxSrc(charge.proofImageUrl!)}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              <ZoomIn className="h-3.5 w-3.5" />
              <img
                src={charge.proofImageUrl}
                alt="proof"
                className="h-6 w-6 rounded object-cover border border-white/10"
              />
            </button>
          )}
          {statusBadge(charge.status)}
        </div>
      </div>

      {/* Payer actions */}
      {canUploadProof && !showProofForm && (
        <Button
          size="sm"
          className="h-7 px-3 text-xs"
          style={{ background: "#d4a017", color: "#0c0c18" }}
          onClick={() => setShowProofForm(true)}
        >
          סמן כשולם
        </Button>
      )}

      {canUploadProof && showProofForm && (
        <div
          className="space-y-2 p-3 rounded-lg"
          style={{
            background: "rgba(0,0,0,0.3)",
            border: "1px solid rgba(212,160,23,0.2)",
          }}
        >
          <p className="text-xs text-slate-400">העלה הוכחת תשלום (אופציונלי)</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="flex gap-2 items-center flex-wrap">
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-3 text-xs border-white/20 text-slate-300"
              onClick={() => fileInputRef.current?.click()}
            >
              בחר תמונה
            </Button>
            {proofFile && (
              <img
                src={proofFile}
                alt="preview"
                className="h-8 w-8 rounded object-cover border border-white/10"
              />
            )}
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              className="h-7 px-3 text-xs"
              style={{ background: "#d4a017", color: "#0c0c18" }}
              onClick={handleSendProof}
              disabled={submitting}
            >
              {submitting ? <Loader2 className="h-3 w-3 animate-spin" /> : "שלח הוכחה"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-3 text-xs text-slate-400"
              onClick={() => {
                setShowProofForm(false);
                setProofFile("");
              }}
            >
              ביטול
            </Button>
          </div>
        </div>
      )}

      {/* Receiver actions */}
      {canApproveOrDecline && (
        <div className="flex gap-2 flex-wrap">
          <Button
            size="sm"
            className="h-7 px-3 text-xs"
            style={{ background: "rgba(52,211,153,0.2)", color: "#34d399", border: "1px solid rgba(52,211,153,0.3)" }}
            onClick={handleApprove}
            disabled={actionLoading !== null}
          >
            {actionLoading === "approve" ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              "אשר תשלום"
            )}
          </Button>
          <Button
            size="sm"
            className="h-7 px-3 text-xs"
            style={{ background: "rgba(239,68,68,0.12)", color: "#f87171", border: "1px solid rgba(239,68,68,0.25)" }}
            onClick={handleDecline}
            disabled={actionLoading !== null}
          >
            {actionLoading === "decline" ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              "דחה"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Expense Card ─────────────────────────────────────────────────────────────

function ExpenseCard({
  expense,
  groupId,
  sessionId,
  currentUserId,
  isAdmin,
  onRefresh,
}: {
  expense: SessionExpense;
  groupId: string;
  sessionId: string;
  currentUserId: string;
  isAdmin: boolean;
  onRefresh: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const canDelete = expense.createdByUserId === currentUserId || isAdmin;

  async function handleDelete() {
    if (!confirm("למחוק את ההוצאה הזו?")) return;
    setDeleting(true);
    const res = await fetch(
      `/api/groups/${groupId}/sessions/${sessionId}/expenses/${expense.id}`,
      { method: "DELETE" }
    );
    const json = await res.json();
    setDeleting(false);
    if (!res.ok) {
      toast({ title: "שגיאה", description: json.error, variant: "destructive" });
      return;
    }
    toast({ title: "ההוצאה נמחקה" });
    onRefresh();
  }

  const allApproved =
    expense.charges.length > 0 &&
    expense.charges.every((c) => c.status === "APPROVED");
  const pendingCount = expense.charges.filter(
    (c) => c.status === "PENDING_PAYMENT" || c.status === "PROOF_UPLOADED"
  ).length;

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      {/* Card header */}
      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-semibold text-slate-100">{expense.title}</h3>
              <Badge
                className="text-xs px-2 py-0"
                style={{
                  background: "rgba(212,160,23,0.12)",
                  color: "#d4a017",
                  border: "1px solid rgba(212,160,23,0.25)",
                }}
              >
                {expense.splitMethod === "EQUAL" ? "חלוקה שווה" : "חלוקה ידנית"}
              </Badge>
              {allApproved && (
                <Badge
                  className="text-xs px-2 py-0"
                  style={{
                    background: "rgba(52,211,153,0.12)",
                    color: "#34d399",
                    border: "1px solid rgba(52,211,153,0.25)",
                  }}
                >
                  הושלם ✅
                </Badge>
              )}
              {pendingCount > 0 && (
                <Badge
                  className="text-xs px-2 py-0"
                  style={{
                    background: "rgba(251,191,36,0.12)",
                    color: "#fbbf24",
                    border: "1px solid rgba(251,191,36,0.25)",
                  }}
                >
                  {pendingCount} ממתין
                </Badge>
              )}
            </div>
            {expense.description && (
              <p className="text-xs text-slate-500 mt-0.5">{expense.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-base font-bold text-amber-300">
              {formatCurrency(expense.totalAmount)}
            </span>
            {canDelete && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="text-slate-600 hover:text-red-400 transition-colors p-1"
              >
                {deleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>
            שולם על ידי:{" "}
            <span className="text-slate-300 font-medium">{expense.paidBy.name}</span>
          </span>
          <span>
            {new Date(expense.createdAt).toLocaleTimeString("he-IL", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>

        {expense.charges.length > 0 && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition-colors mt-1"
          >
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            {expanded ? "הסתר חיובים" : `הצג ${expense.charges.length} חיובים`}
          </button>
        )}
        {expense.charges.length === 0 && (
          <p className="text-xs text-slate-600 italic">אין חיובים (המשלם הוא כל המשתתפים)</p>
        )}
      </div>

      {/* Charges */}
      {expanded && expense.charges.length > 0 && (
        <div
          className="px-4 pb-4 space-y-2 border-t"
          style={{ borderColor: "rgba(255,255,255,0.06)" }}
        >
          <p className="text-xs text-slate-600 pt-3 uppercase tracking-wider">חיובים</p>
          {expense.charges.map((charge) => (
            <ChargeRow
              key={charge.id}
              charge={charge}
              groupId={groupId}
              sessionId={sessionId}
              expenseId={expense.id}
              currentUserId={currentUserId}
              onRefresh={onRefresh}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Panel ───────────────────────────────────────────────────────────────

export function SessionExpensesPanel({
  sessionId,
  groupId,
  currentUserId,
  sessionStatus,
  participants,
  isAdmin,
}: Props) {
  const [expenses, setExpenses] = useState<SessionExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Create form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [paidByUserId, setPaidByUserId] = useState(currentUserId);
  const [splitMethod, setSplitMethod] = useState<SplitMethod>("EQUAL");
  const [selectedParticipants, setSelectedParticipants] = useState<Set<string>>(
    new Set(participants.map((p) => p.userId))
  );
  const [manualAmounts, setManualAmounts] = useState<Record<string, string>>({});

  const isOpen = sessionStatus === "OPEN";

  const fetchExpenses = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/groups/${groupId}/sessions/${sessionId}/expenses`
      );
      if (!res.ok) return;
      const data: SessionExpense[] = await res.json();
      setExpenses(data);
    } catch {
      // silently ignore polling errors
    } finally {
      setLoading(false);
    }
  }, [groupId, sessionId]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  // Poll every 8 seconds
  useEffect(() => {
    const interval = setInterval(fetchExpenses, 8000);
    return () => clearInterval(interval);
  }, [fetchExpenses]);

  function resetForm() {
    setTitle("");
    setDescription("");
    setTotalAmount("");
    setPaidByUserId(currentUserId);
    setSplitMethod("EQUAL");
    setSelectedParticipants(new Set(participants.map((p) => p.userId)));
    setManualAmounts({});
  }

  function toggleParticipant(userId: string) {
    setSelectedParticipants((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  }

  async function handleCreate() {
    if (!title.trim()) {
      toast({ title: "שגיאה", description: "כותרת נדרשת", variant: "destructive" });
      return;
    }
    const amount = parseFloat(totalAmount);
    if (!amount || amount <= 0) {
      toast({ title: "שגיאה", description: "סכום לא תקין", variant: "destructive" });
      return;
    }
    if (selectedParticipants.size === 0) {
      toast({ title: "שגיאה", description: "יש לבחור לפחות משתתף אחד", variant: "destructive" });
      return;
    }

    const participantsArray = Array.from(selectedParticipants).map((userId) => ({
      userId,
      amount:
        splitMethod === "MANUAL"
          ? parseFloat(manualAmounts[userId] ?? "0") || 0
          : undefined,
    }));

    if (splitMethod === "MANUAL") {
      const sum = participantsArray.reduce((s, p) => s + (p.amount ?? 0), 0);
      if (Math.abs(sum - amount) > 0.01) {
        toast({
          title: "שגיאה",
          description: `סכום המשתתפים (₪${sum.toFixed(2)}) אינו שווה לסכום הכולל (₪${amount.toFixed(2)})`,
          variant: "destructive",
        });
        return;
      }
    }

    setSubmitting(true);
    const res = await fetch(
      `/api/groups/${groupId}/sessions/${sessionId}/expenses`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          totalAmount: amount,
          paidByUserId,
          splitMethod,
          participants: participantsArray,
        }),
      }
    );
    const json = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      toast({ title: "שגיאה", description: json.error, variant: "destructive" });
      return;
    }
    toast({ title: "ההוצאה נוצרה" });
    resetForm();
    setShowCreateForm(false);
    fetchExpenses();
  }

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
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-base font-semibold" style={{ color: "#d4a017" }}>
            🍕 הוצאות ערב
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            ניהול הוצאות משותפות (אוכל, שתייה וכו&apos;)
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={fetchExpenses}
            className="h-7 px-2 text-xs text-slate-400 hover:text-slate-200"
          >
            <RefreshCw className="h-3.5 w-3.5 ml-1" />
            רענן
          </Button>
          {isOpen && !showCreateForm && (
            <Button
              size="sm"
              className="h-7 px-3 text-xs"
              style={{ background: "#d4a017", color: "#0c0c18" }}
              onClick={() => setShowCreateForm(true)}
            >
              + הוצאה חדשה
            </Button>
          )}
          {showCreateForm && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-3 text-xs text-slate-400"
              onClick={() => {
                setShowCreateForm(false);
                resetForm();
              }}
            >
              <X className="h-3.5 w-3.5 ml-1" />
              ביטול
            </Button>
          )}
        </div>
      </div>

      {/* Create Expense Form */}
      {showCreateForm && (
        <Card
          style={{
            borderColor: "rgba(212,160,23,0.25)",
            background: "rgba(212,160,23,0.04)",
          }}
        >
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm" style={{ color: "#d4a017" }}>
              הוצאה חדשה
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-4">
            {/* Title */}
            <div className="space-y-1">
              <Label className="text-xs text-slate-400">כותרת *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="לדוג&apos; פיצה, שתייה..."
                className="h-8 text-sm"
                autoFocus
              />
            </div>

            {/* Description */}
            <div className="space-y-1">
              <Label className="text-xs text-slate-400">תיאור (אופציונלי)</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="פרטים נוספים..."
                className="h-8 text-sm"
              />
            </div>

            {/* Total Amount */}
            <div className="space-y-1">
              <Label className="text-xs text-slate-400">סכום כולל (₪) *</Label>
              <Input
                type="number"
                min="0.01"
                step="0.01"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                placeholder="0"
                className="h-8 text-sm"
              />
            </div>

            {/* Paid By */}
            <div className="space-y-1">
              <Label className="text-xs text-slate-400">שולם על ידי *</Label>
              <select
                value={paidByUserId}
                onChange={(e) => setPaidByUserId(e.target.value)}
                className="w-full h-8 text-sm rounded-md px-2 py-0"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: "#e2e8f0",
                }}
              >
                {participants.map((p) => (
                  <option key={p.userId} value={p.userId} style={{ background: "#1a1a2e" }}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Split Method */}
            <div className="space-y-1">
              <Label className="text-xs text-slate-400">שיטת חלוקה</Label>
              <div className="flex gap-3">
                <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300">
                  <input
                    type="radio"
                    name="splitMethod"
                    value="EQUAL"
                    checked={splitMethod === "EQUAL"}
                    onChange={() => setSplitMethod("EQUAL")}
                    className="accent-amber-400"
                  />
                  חלוקה שווה
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300">
                  <input
                    type="radio"
                    name="splitMethod"
                    value="MANUAL"
                    checked={splitMethod === "MANUAL"}
                    onChange={() => setSplitMethod("MANUAL")}
                    className="accent-amber-400"
                  />
                  חלוקה ידנית
                </label>
              </div>
            </div>

            {/* Participants */}
            <div className="space-y-2">
              <Label className="text-xs text-slate-400">משתתפים</Label>
              <div className="space-y-1.5">
                {participants.map((p) => {
                  const isSelected = selectedParticipants.has(p.userId);
                  const isPayer = p.userId === paidByUserId;
                  return (
                    <div key={p.userId} className="flex items-center gap-3">
                      <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleParticipant(p.userId)}
                          className="accent-amber-400 h-3.5 w-3.5"
                        />
                        <span className="text-sm text-slate-300 truncate">
                          {p.name}
                          {isPayer && (
                            <span className="text-xs text-amber-400 ml-1">(שילם)</span>
                          )}
                        </span>
                      </label>
                      {splitMethod === "MANUAL" && isSelected && !isPayer && (
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={manualAmounts[p.userId] ?? ""}
                          onChange={(e) =>
                            setManualAmounts((prev) => ({
                              ...prev,
                              [p.userId]: e.target.value,
                            }))
                          }
                          placeholder="₪"
                          className="h-7 text-xs w-24 shrink-0"
                        />
                      )}
                      {splitMethod === "EQUAL" && isSelected && totalAmount && (
                        <span className="text-xs text-slate-500 shrink-0">
                          {formatCurrency(
                            parseFloat(totalAmount) / selectedParticipants.size || 0
                          )}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <Button
              className="w-full h-8 text-sm"
              style={{ background: "#d4a017", color: "#0c0c18" }}
              onClick={handleCreate}
              disabled={submitting}
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin ml-2" />
              ) : null}
              צור הוצאה
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Expense List */}
      {expenses.length === 0 && !showCreateForm && (
        <div
          className="text-center py-8 rounded-lg"
          style={{
            background: "rgba(255,255,255,0.01)",
            border: "1px dashed rgba(255,255,255,0.08)",
          }}
        >
          <p className="text-sm text-slate-600">אין הוצאות עדיין</p>
          {isOpen && (
            <p className="text-xs text-slate-700 mt-1">
              לחץ &quot;הוצאה חדשה&quot; כדי להוסיף הוצאה משותפת
            </p>
          )}
        </div>
      )}

      {expenses.length > 0 && (
        <div className="space-y-3">
          {expenses.map((expense) => (
            <ExpenseCard
              key={expense.id}
              expense={expense}
              groupId={groupId}
              sessionId={sessionId}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              onRefresh={fetchExpenses}
            />
          ))}
        </div>
      )}
    </div>
  );
}
