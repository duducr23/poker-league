"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { Pencil, Check, X, Loader2, UserPlus, Eye } from "lucide-react";
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
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: "1px solid rgba(212,160,23,0.12)" }}
    >
      <div
        className="px-5 py-3 flex items-center gap-2"
        style={{ background: "rgba(212,160,23,0.06)", borderBottom: "1px solid rgba(212,160,23,0.1)" }}
      >
        <span className="text-sm font-semibold text-slate-300">
          קבוצות ({groups.length})
        </span>
      </div>
      <div className="divide-y" style={{ background: "#0d0d18", borderColor: "rgba(212,160,23,0.07)" }}>
        {groups.map((group) => (
          <div key={group.id} className="px-5 py-3">
            {editingId === group.id ? (
              <div className="flex items-center gap-2">
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="h-8 text-sm flex-1"
                  onKeyDown={(e) => e.key === "Enter" && saveGroupName(group.id)}
                  autoFocus
                />
                <Button
                  size="sm"
                  className="h-8 w-8 p-0"
                  disabled={savingId === group.id}
                  onClick={() => saveGroupName(group.id)}
                >
                  {savingId === group.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Check className="h-3 w-3" />
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-slate-400"
                  onClick={() => setEditingId(null)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <p className="text-sm font-medium text-slate-100">{group.name}</p>
                  <p className="text-xs text-slate-500">
                    {group.memberCount} חברים · קוד:{" "}
                    <code className="text-yellow-600">{group.inviteCode}</code>
                  </p>
                </div>
                <div className="flex gap-1 flex-wrap">
                  <Link href={`/groups/${group.id}`} target="_blank">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 gap-1 text-xs text-slate-400 hover:text-slate-100"
                    >
                      <Eye className="h-3 w-3" />צפה
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 gap-1 text-xs text-slate-400 hover:text-slate-100"
                    onClick={() => {
                      setEditingId(group.id);
                      setEditName(group.name);
                    }}
                  >
                    <Pencil className="h-3 w-3" />שנה שם
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 gap-1 text-xs"
                    style={{ color: "#60a5fa" }}
                    disabled={joiningId === group.id}
                    onClick={() => joinGroup(group.id)}
                  >
                    {joiningId === group.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <UserPlus className="h-3 w-3" />
                    )}
                    הצטרף כשחקן
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
        {groups.length === 0 && (
          <p className="text-center text-slate-500 py-6 text-sm">אין קבוצות עדיין</p>
        )}
      </div>
    </div>
  );
}
