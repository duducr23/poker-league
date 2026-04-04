"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Trash2, Loader2 } from "lucide-react";

export function DeleteGroupButton({ groupId, groupName }: { groupId: string; groupName: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState(false);

  async function handleDelete() {
    if (!confirm) { setConfirm(true); return; }
    setLoading(true);
    const res = await fetch(`/api/groups/${groupId}`, { method: "DELETE" });
    setLoading(false);
    if (!res.ok) {
      const j = await res.json();
      toast({ title: "שגיאה", description: j.error, variant: "destructive" });
      return;
    }
    toast({ title: "✅ הקבוצה נמחקה" });
    router.push("/dashboard");
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="gap-2 text-red-400 hover:text-red-300 hover:bg-red-950/40"
      onClick={handleDelete}
      disabled={loading}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
      {confirm ? "⚠️ לחץ שוב לאישור מחיקה סופי" : `מחק קבוצה`}
    </Button>
  );
}
