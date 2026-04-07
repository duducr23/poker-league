"use client";
import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="p-8 flex flex-col items-center justify-center gap-4">
      <p className="text-red-400 font-semibold">שגיאה בטעינת הדשבורד</p>
      <pre className="text-xs text-slate-400 bg-slate-900 p-4 rounded max-w-xl overflow-auto">
        {error.message}
        {error.digest ? `\nDigest: ${error.digest}` : ""}
      </pre>
      <button
        onClick={reset}
        className="px-4 py-2 bg-primary text-primary-foreground rounded text-sm"
      >
        נסה שוב
      </button>
    </div>
  );
}
