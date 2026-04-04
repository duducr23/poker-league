"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { UserPlus, Loader2, Check } from "lucide-react";

export function CreatePlayerButton({ groupId, onCreated }: { groupId: string; onCreated?: () => void }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    if (!name.trim()) return;
    setLoading(true);
    const res = await fetch(`/api/groups/${groupId}/players`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    const j = await res.json();
    setLoading(false);
    if (!res.ok) {
      toast({ title: "שגיאה", description: j.error, variant: "destructive" });
      return;
    }
    toast({ title: `✅ השחקן "${j.name}" נוצר ונוסף לקבוצה` });
    setName("");
    setOpen(false);
    router.refresh();
    onCreated?.();
  }

  if (!open) {
    return (
      <Button size="sm" variant="outline" className="gap-2" onClick={() => setOpen(true)}>
        <UserPlus className="h-4 w-4" />הוסף שחקן חדש
      </Button>
    );
  }

  return (
    <div className="flex gap-2 items-center">
      <Input
        autoFocus
        placeholder="שם השחקן..."
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleCreate()}
        className="h-9 text-sm max-w-48"
      />
      <Button size="sm" onClick={handleCreate} disabled={loading || !name.trim()}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
      </Button>
      <Button size="sm" variant="ghost" className="text-slate-400" onClick={() => { setOpen(false); setName(""); }}>
        ביטול
      </Button>
    </div>
  );
}
