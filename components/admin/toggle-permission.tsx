"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Check, X, Loader2 } from "lucide-react";

interface Props {
  userId: string;
  canCreateGroup: boolean;
}

export function TogglePermission({ userId, canCreateGroup: initial }: Props) {
  const [value, setValue] = useState(initial);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ canCreateGroup: !value }),
    });
    setLoading(false);
    if (!res.ok) {
      toast({ title: "שגיאה", description: "לא ניתן לעדכן", variant: "destructive" });
      return;
    }
    setValue(!value);
    toast({ title: value ? "הוסרה הרשאה" : "✅ הרשאה הוענקה" });
  }

  return (
    <Button
      size="sm"
      variant={value ? "default" : "outline"}
      className="gap-2 min-w-32"
      onClick={toggle}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : value ? (
        <><Check className="h-3.5 w-3.5" />מורשה</>
      ) : (
        <><X className="h-3.5 w-3.5" />לא מורשה</>
      )}
    </Button>
  );
}
