"use client";
import { useState } from "react";
import { Copy, Check } from "lucide-react";

export function CopyCodeButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md transition-all"
      style={{
        border: `1px solid ${copied ? "rgba(212,160,23,0.5)" : "rgba(212,160,23,0.25)"}`,
        color: copied ? "#f5d060" : "#94a3b8",
        background: copied ? "rgba(212,160,23,0.08)" : "rgba(212,160,23,0.03)",
      }}
      title="העתק קוד הזמנה"
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      <span className="font-mono font-bold tracking-widest">{code}</span>
      <span className="opacity-70">{copied ? "הועתק!" : "העתק"}</span>
    </button>
  );
}
