"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { Pencil, Check, X, Loader2, UserPlus, Eye, Users, Hash } from "lucide-react";
import Link from "next/link";

interface Group {
  id: string;
  name: string;
  inviteCode: string;
  memberCount: number;
}

export function AdminGroupsPanel({ groups: initialGroups }: { groups: Group[] }) {
  const [groups, setGroups] = useState(initialGroups);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [joiningId, setJoiningId] = useState<string | null>(null);

  async function saveGroupName(groupId: string) {
    if (!editName.trim()) return;
    setSavingId(groupId);
    const res = await fetch(`/api/admin/groups/${groupId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName.trim() }),
    });
    setSavingId(null);
    if (!res.ok) {
      const j = await res.json();
      toast({ title: "שגיאה", description: j.error, variant: "destructive" });
      return;
    }
    setGroups((prev) => prev.map((g) => g.id === groupId ? { ...g, name: editName.trim() } : g));
    setEditingId(null);
    toast({ title: "✅ שם הקבוצה עודכן" });
  }

  async function joinGroup(groupId: string) {
    setJoiningId(groupId);
    const res = await fetch(`/api/admin/groups/${groupId}`, { method: "POST" });
    setJoiningId(null);
    if (!res.ok) {
      const j = await res.json();
      toast({ title: "שגיאה", description: j.error, variant: "destructive" });
      return;
    }
    toast({ title: "✅ הצטרפת לקבוצה כשחקן — רענן את הדף" });
  }

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(212,160,23,0.12)" }}>
      {/* Header */}
      <div
        className="px-4 py-3 flex items-center gap-2"
        style={{ background: "rgba(212,160,23,0.06)", borderBottom: "1px solid rgba(212,160,23,0.1)" }}
      >
        <span className="text-sm font-semibold text-slate-300">
          קבוצות ({groups.length})
        </span>
      </div>

      {/* List */}
      <div style={{ background: "#0d0d18" }}>
        {groups.map((group, idx) => (
          <div
            key={group.id}
            className="px-4 py-4"
            style={{ borderTop: idx > 0 ? "1px solid rgba(255,255,255,0.05)" : undefined }}
          >
            {editingId === group.id ? (
              /* Inline edit mode */
              <div className="space-y-2">
                <p className="text-xs text-slate-500">שינוי שם הקבוצה</p>
                <div className="flex items-center gap-2">
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="h-9 text-sm flex-1"
                    onKeyDown={(e) => e.key === "Enter" && saveGroupName(group.id)}
                    autoFocus
                  />
                  <Button
                    size="sm"
                    className="h-9 w-9 p-0 shrink-0"
                    disabled={savingId === group.id}
                    onClick={() => saveGroupName(group.id)}
                    style={{ background: "linear-gradient(135deg, #d4a017, #f5c842)", color: "#0a0a12" }}
                  >
                    {savingId === group.id
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <Check className="h-3.5 w-3.5" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-9 w-9 p-0 shrink-0 text-slate-400"
                    onClick={() => setEditingId(null)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ) : (
              /* Normal view */
              <div className="space-y-3">
                {/* Group info */}
                <div>
                  <p className="text-sm font-semibold text-slate-100">{group.name}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Users className="h-3 w-3" />{group.memberCount} חברים
                    </span>
                    <span className="text-xs text-slate-600 flex items-center gap-1">
                      <Hash className="h-3 w-3" />
                      <code className="text-yellow-700 text-xs">{group.inviteCode}</code>
                    </span>
                  </div>
                </div>

                {/* Action buttons — horizontal scroll on very small screens */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Link href={`/groups/${group.id}`} target="_blank">
                    <button
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                      style={{ background: "rgba(255,255,255,0.05)", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.08)" }}
                    >
                      <Eye className="h-3.5 w-3.5" />צפה
                    </button>
                  </Link>
                  <button
                    onClick={() => { setEditingId(group.id); setEditName(group.name); }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                    style={{ background: "rgba(212,160,23,0.08)", color: "#d4a017", border: "1px solid rgba(212,160,23,0.2)" }}
                  >
                    <Pencil className="h-3.5 w-3.5" />שנה שם
                  </button>
                  <button
                    disabled={joiningId === group.id}
                    onClick={() => joinGroup(group.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                    style={{ background: "rgba(96,165,250,0.08)", color: "#60a5fa", border: "1px solid rgba(96,165,250,0.2)" }}
                  >
                    {joiningId === group.id
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <UserPlus className="h-3.5 w-3.5" />}
                    הצטרף כשחקן
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {groups.length === 0 && (
          <p className="text-center text-slate-500 py-8 text-sm">אין קבוצות עדיין</p>
        )}
      </div>
    </div>
  );
}
