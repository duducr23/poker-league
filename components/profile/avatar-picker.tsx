"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Check, Loader2 } from "lucide-react";
import Image from "next/image";

const STYLES = [
  { key: "adventurer",     label: "הרפתקנים 🧝", bg: "b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf" },
  { key: "fun-emoji",      label: "אמוג'י 😄",   bg: "ffd5dc,ffdfbf,c0aede,b6e3f4,d1d4f9" },
  { key: "lorelei",        label: "דמויות 🧑",   bg: "b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf" },
  { key: "micah",          label: "פנים 🎨",     bg: "b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf,a3e4d7" },
  { key: "bottts",         label: "רובוטים 🤖",  bg: "b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf" },
  { key: "pixel-art",      label: "פיקסל 🎮",   bg: "b6e3f4,c0aede,d1d4f9,ffd5dc,a3e4d7,ffdfbf" },
];

const SEEDS = ["Ace", "King", "Queen", "Jack", "Poker", "Chips", "Bluff", "AllIn", "Flush", "Raise", "River", "Flop"];

function avatarUrl(style: string, seed: string, bg: string) {
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${seed}&backgroundColor=${bg}&backgroundType=solid&radius=50`;
}

interface Props {
  currentImage?: string | null;
}

export function AvatarPicker({ currentImage }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<string>(currentImage || "");
  const [activeStyle, setActiveStyle] = useState(STYLES[0]);
  const [saving, setSaving] = useState(false);

  const avatars = SEEDS.map((seed) => ({
    seed,
    url: avatarUrl(activeStyle.key, seed, activeStyle.bg),
  }));

  async function save() {
    if (!selected) return;
    setSaving(true);
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: selected }),
    });
    setSaving(false);
    if (!res.ok) {
      toast({ title: "שגיאה", description: "לא ניתן לשמור", variant: "destructive" });
      return;
    }
    toast({ title: "✅ האווטאר עודכן!" });
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {/* Current avatar preview */}
      {selected && (
        <div className="flex items-center gap-4 p-4 rounded-xl" style={{ background: "rgba(212,160,23,0.06)", border: "1px solid rgba(212,160,23,0.15)" }}>
          <div className="h-16 w-16 rounded-full overflow-hidden flex-shrink-0 bg-slate-800">
            <img src={selected} alt="אווטאר נוכחי" className="h-full w-full object-cover" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-200">האווטאר שלך</p>
            <p className="text-xs text-slate-500 mt-0.5">לחץ שמור כדי לאשר</p>
          </div>
          <Button onClick={save} disabled={saving} className="mr-auto gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            שמור
          </Button>
        </div>
      )}

      {/* Style tabs */}
      <div className="flex gap-2 flex-wrap">
        {STYLES.map((s) => (
          <button
            key={s.key}
            onClick={() => setActiveStyle(s)}
            className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
            style={{
              background: activeStyle.key === s.key ? "linear-gradient(135deg, #d4a017, #f5c842)" : "rgba(212,160,23,0.06)",
              color: activeStyle.key === s.key ? "#0a0a12" : "#94a3b8",
              border: `1px solid ${activeStyle.key === s.key ? "transparent" : "rgba(212,160,23,0.15)"}`,
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Avatar grid */}
      <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
        {avatars.map(({ seed, url }) => {
          const isSelected = selected === url;
          return (
            <button
              key={seed}
              onClick={() => setSelected(url)}
              className="relative aspect-square rounded-xl overflow-hidden transition-all duration-150 group"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: `2px solid ${isSelected ? "#d4a017" : "rgba(212,160,23,0.1)"}`,
                boxShadow: isSelected ? "0 0 14px rgba(212,160,23,0.4)" : "none",
                transform: isSelected ? "scale(1.05)" : "scale(1)",
              }}
            >
              <img
                src={url}
                alt={seed}
                className="h-full w-full"
              />
              {isSelected && (
                <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(212,160,23,0.15)" }}>
                  <div className="h-5 w-5 rounded-full bg-yellow-500 flex items-center justify-center">
                    <Check className="h-3 w-3 text-black" />
                  </div>
                </div>
              )}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: "rgba(212,160,23,0.08)" }}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
