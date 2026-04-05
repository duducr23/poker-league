"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { Loader2, MapPin, StickyNote, Trash2, CalendarDays, Clock, Share2, Check, ExternalLink, Pencil, X, Save, Navigation } from "lucide-react";

interface Response {
  id: string;
  userId: string;
  status: "COMING" | "NOT_COMING" | "MAYBE";
  user: { id: string; name: string; image?: string | null };
}

interface Invitation {
  id: string;
  title: string;
  date: string;
  location?: string | null;
  notes?: string | null;
  createdById: string;
  sessionId?: string | null;
  createdBy: { id: string; name: string };
  responses: Response[];
}

interface Props {
  invitation: Invitation;
  groupId: string;
  currentUserId: string;
  isAdmin: boolean;
  totalMembers: number;
}

const STATUS_CONFIG = {
  COMING:     { label: "מגיע ✅", color: "#10b981", bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.3)" },
  NOT_COMING: { label: "לא מגיע ❌", color: "#f87171", bg: "rgba(248,113,113,0.1)", border: "rgba(248,113,113,0.3)" },
  MAYBE:      { label: "אולי 🤔", color: "#fbbf24", bg: "rgba(251,191,36,0.1)", border: "rgba(251,191,36,0.3)" },
};

function toDatetimeLocal(dateStr: string) {
  const d = new Date(dateStr);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function InvitationCard({ invitation, groupId, currentUserId, isAdmin, totalMembers }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [copied, setCopied] = useState(false);

  // Edit state
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    title: invitation.title,
    date: toDatetimeLocal(invitation.date),
    location: invitation.location ?? "",
    notes: invitation.notes ?? "",
  });

  async function copyLink() {
    const url = `${window.location.origin}/groups/${groupId}/invitations`;
    const text = `📅 ${invitation.title}\n🕐 ${new Date(invitation.date).toLocaleDateString("he-IL", { weekday: "long", day: "numeric", month: "long" })} בשעה ${new Date(invitation.date).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })}${invitation.location ? `\n📍 ${invitation.location}` : ""}${invitation.notes ? `\n📝 ${invitation.notes}` : ""}\n\nלאישור הגעה: ${url}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  const myResponse = invitation.responses.find(r => r.userId === currentUserId);
  const coming = invitation.responses.filter(r => r.status === "COMING");
  const notComing = invitation.responses.filter(r => r.status === "NOT_COMING");
  const maybe = invitation.responses.filter(r => r.status === "MAYBE");
  const notAnswered = totalMembers - invitation.responses.length;

  const date = new Date(invitation.date);
  const isPast = date < new Date();

  const canEdit = isAdmin || invitation.createdById === currentUserId;

  async function rsvp(status: "COMING" | "NOT_COMING" | "MAYBE") {
    if (myResponse?.status === status) return;
    setLoading(status);
    const res = await fetch(`/api/groups/${groupId}/invitations/${invitation.id}/rsvp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setLoading(null);
    if (!res.ok) { toast({ title: "שגיאה", variant: "destructive" }); return; }
    router.refresh();
  }

  async function deleteInvitation() {
    if (!confirm("למחוק את ההזמנה?")) return;
    setDeleting(true);
    await fetch(`/api/groups/${groupId}/invitations/${invitation.id}`, { method: "DELETE" });
    setDeleting(false);
    router.refresh();
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editForm.title || !editForm.date) return;
    setSaving(true);
    const res = await fetch(`/api/groups/${groupId}/invitations/${invitation.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: editForm.title,
        date: editForm.date,
        location: editForm.location || null,
        notes: editForm.notes || null,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      toast({ title: "שגיאה", description: "לא ניתן לשמור", variant: "destructive" });
      return;
    }
    toast({ title: "✅ ההזמנה עודכנה" });
    setEditing(false);
    router.refresh();
  }

  return (
    <>
      <div
        className="rounded-xl overflow-hidden"
        style={{
          border: `1px solid ${isPast ? "rgba(255,255,255,0.06)" : "rgba(212,160,23,0.2)"}`,
          background: isPast ? "rgba(255,255,255,0.02)" : "rgba(13,13,24,0.9)",
          opacity: isPast ? 0.7 : 1,
        }}
      >
        {/* Header */}
        <div
          className="px-5 py-4 flex items-start justify-between gap-3"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-lg font-bold text-slate-100">{invitation.title}</span>
              {isPast && <Badge variant="secondary" className="text-xs">עבר</Badge>}
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-slate-500 mt-1">
              <span className="flex items-center gap-1">
                <CalendarDays className="h-3 w-3" />
                {date.toLocaleDateString("he-IL", { weekday: "long", day: "numeric", month: "long" })}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {date.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })}
              </span>
              {invitation.location && (
                <span className="flex items-center gap-1.5 flex-wrap">
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span>{invitation.location}</span>
                  <a
                    href={`https://waze.com/ul?q=${encodeURIComponent(invitation.location)}&navigate=yes`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-medium transition-opacity hover:opacity-80"
                    style={{ background: "rgba(0,210,100,0.12)", color: "#00d264", border: "1px solid rgba(0,210,100,0.25)" }}
                    title="פתח ב-Waze"
                    onClick={e => e.stopPropagation()}
                  >
                    🚗 Waze
                  </a>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(invitation.location)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-medium transition-opacity hover:opacity-80"
                    style={{ background: "rgba(66,133,244,0.12)", color: "#4285f4", border: "1px solid rgba(66,133,244,0.25)" }}
                    title="פתח ב-Google Maps"
                    onClick={e => e.stopPropagation()}
                  >
                    🗺️ Maps
                  </a>
                </span>
              )}
            </div>
            {invitation.notes && (
              <p className="mt-1 text-xs text-slate-500 flex items-center gap-1">
                <StickyNote className="h-3 w-3" />{invitation.notes}
              </p>
            )}
            <p className="mt-1 text-xs" style={{ color: "rgba(212,160,23,0.4)" }}>
              נשלח על ידי {invitation.createdBy.name}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {canEdit && (
              <button
                onClick={() => {
                  setEditForm({
                    title: invitation.title,
                    date: toDatetimeLocal(invitation.date),
                    location: invitation.location ?? "",
                    notes: invitation.notes ?? "",
                  });
                  setEditing(true);
                }}
                className="text-slate-600 hover:text-yellow-400 transition-colors"
                title="ערוך הזמנה"
              >
                <Pencil className="h-4 w-4" />
              </button>
            )}
            {canEdit && (
              <button onClick={deleteInvitation} disabled={deleting} className="text-slate-600 hover:text-red-400 transition-colors">
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              </button>
            )}
          </div>
        </div>

        {/* RSVP Buttons */}
        {!isPast && (
          <div className="px-5 py-3 flex gap-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
            {(["COMING", "MAYBE", "NOT_COMING"] as const).map(status => {
              const cfg = STATUS_CONFIG[status];
              const isSelected = myResponse?.status === status;
              return (
                <button
                  key={status}
                  onClick={() => rsvp(status)}
                  disabled={loading !== null}
                  className="flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all"
                  style={{
                    background: isSelected ? cfg.bg : "rgba(255,255,255,0.03)",
                    border: `1px solid ${isSelected ? cfg.border : "rgba(255,255,255,0.07)"}`,
                    color: isSelected ? cfg.color : "#64748b",
                    transform: isSelected ? "scale(1.02)" : "scale(1)",
                  }}
                >
                  {loading === status ? <Loader2 className="h-3.5 w-3.5 animate-spin mx-auto" /> : cfg.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Share button + session link */}
        <div className="px-5 py-2 flex gap-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
          <button
            onClick={copyLink}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background: copied ? "rgba(52,211,153,0.08)" : "rgba(212,160,23,0.05)",
              border: `1px solid ${copied ? "rgba(52,211,153,0.25)" : "rgba(212,160,23,0.15)"}`,
              color: copied ? "#34d399" : "#d4a017",
            }}
          >
            {copied ? (
              <><Check className="h-4 w-4" />הועתק!</>
            ) : (
              <><Share2 className="h-4 w-4" />שיתוף</>
            )}
          </button>
          {invitation.sessionId && (
            <Link
              href={`/groups/${groupId}/sessions/${invitation.sessionId}`}
              className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all shrink-0"
              style={{
                background: "rgba(99,102,241,0.08)",
                border: "1px solid rgba(99,102,241,0.25)",
                color: "#818cf8",
              }}
            >
              <ExternalLink className="h-3.5 w-3.5" />
              כנס לערב
            </Link>
          )}
        </div>

        {/* Forecast */}
        <div className="px-5 py-3">
          <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">צפי השתתפות</p>

          {/* Progress bar */}
          <div className="flex h-2 rounded-full overflow-hidden gap-0.5 mb-3">
            {coming.length > 0 && (
              <div className="h-full rounded-full" style={{ width: `${(coming.length / totalMembers) * 100}%`, background: "#10b981" }} />
            )}
            {maybe.length > 0 && (
              <div className="h-full rounded-full" style={{ width: `${(maybe.length / totalMembers) * 100}%`, background: "#fbbf24" }} />
            )}
            {notComing.length > 0 && (
              <div className="h-full rounded-full" style={{ width: `${(notComing.length / totalMembers) * 100}%`, background: "#f87171" }} />
            )}
            {notAnswered > 0 && (
              <div className="h-full rounded-full flex-1" style={{ background: "rgba(255,255,255,0.07)" }} />
            )}
          </div>

          <div className="grid grid-cols-4 gap-2 text-center">
            <div>
              <p className="text-lg font-bold text-emerald-400">{coming.length}</p>
              <p className="text-xs text-slate-600">מגיעים</p>
              {coming.length > 0 && <p className="text-xs text-slate-700 truncate">{coming.map(r => r.user.name.split(" ")[0]).join(", ")}</p>}
            </div>
            <div>
              <p className="text-lg font-bold text-yellow-400">{maybe.length}</p>
              <p className="text-xs text-slate-600">אולי</p>
              {maybe.length > 0 && <p className="text-xs text-slate-700 truncate">{maybe.map(r => r.user.name.split(" ")[0]).join(", ")}</p>}
            </div>
            <div>
              <p className="text-lg font-bold text-red-400">{notComing.length}</p>
              <p className="text-xs text-slate-600">לא מגיעים</p>
            </div>
            <div>
              <p className="text-lg font-bold text-slate-600">{notAnswered}</p>
              <p className="text-xs text-slate-600">לא ענו</p>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.75)" }}>
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
                <span className="text-xl">✏️</span>
                <h2 className="text-lg font-bold text-slate-100">עריכת הזמנה</h2>
              </div>
              <button onClick={() => setEditing(false)} className="text-slate-500 hover:text-slate-300">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={saveEdit} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-400 uppercase tracking-wider">כותרת *</Label>
                <Input
                  placeholder="למשל: ערב פוקר שישי"
                  value={editForm.title}
                  onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-400 uppercase tracking-wider">תאריך ושעה *</Label>
                <Input
                  type="datetime-local"
                  value={editForm.date}
                  onChange={e => setEditForm(f => ({ ...f, date: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-400 uppercase tracking-wider">מיקום</Label>
                <Input
                  placeholder="למשל: בית של דני"
                  value={editForm.location}
                  onChange={e => setEditForm(f => ({ ...f, location: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-400 uppercase tracking-wider">הערות</Label>
                <Input
                  placeholder="למשל: מינימום buy-in 50₪"
                  value={editForm.notes}
                  onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="submit" className="flex-1 gap-2" disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  שמור שינויים
                </Button>
                <Button type="button" variant="outline" onClick={() => setEditing(false)}>
                  ביטול
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
