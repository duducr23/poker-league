"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";

export function CopyInviteCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex items-center gap-3">
      <code
        className="text-2xl font-bold tracking-widest text-primary bg-primary/5 px-4 py-2 rounded-lg cursor-pointer select-all"
        onClick={handleCopy}
        title="לחץ להעתקה"
      >
        {code}
      </code>
      <Button
        size="sm"
        variant={copied ? "default" : "outline"}
        className="gap-2 min-w-24"
        onClick={handleCopy}
      >
        {copied ? <><Check className="h-4 w-4" />הועתק!</> : <><Copy className="h-4 w-4" />העתק</>}
      </Button>
    </div>
  );
}
