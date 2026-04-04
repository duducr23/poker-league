"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { Loader2, MapPin, StickyNote, Trash2, CalendarDays, Clock, Share2, Check } from "lucide-react";

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

export function InvitationCard({ invitation, groupId, currentUserId, isAdmin, totalMembers }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [copied, setCopied] = useState(false);

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

  return (
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
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />{invitation.location}
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
        {(isAdmin || invitation.createdById === currentUserId) && (
          <button onClick={deleteInvitation} disabled={deleting} className="text-slate-600 hover:text-red-400 transition-colors shrink-0">
            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          </button>
        )}
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

      {/* Share button */}
      <div className="px-5 py-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        <button
          onClick={copyLink}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all"
          style={{
            background: copied ? "rgba(52,211,153,0.08)" : "rgba(212,160,23,0.05)",
            border: `1px solid ${copied ? "rgba(52,211,153,0.25)" : "rgba(212,160,23,0.15)"}`,
            color: copied ? "#34d399" : "#d4a017",
          }}
        >
          {copied ? (
            <><Check className="h-4 w-4" />הועתק! שלח בוואטסאפ/טלגרם</>
          ) : (
            <><Share2 className="h-4 w-4" />העתק הזמנה לשיתוף</>
          )}
        </button>
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
  );
}
