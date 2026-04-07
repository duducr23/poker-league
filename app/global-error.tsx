"use client";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <html lang="he" dir="rtl">
      <body style={{ background: "#0a0a12", color: "#f1f5f9", fontFamily: "sans-serif", padding: "2rem" }}>
        <p style={{ color: "#f87171", fontWeight: "bold" }}>שגיאת מערכת</p>
        <pre style={{ fontSize: "0.75rem", color: "#94a3b8", background: "#1e1e2e", padding: "1rem", borderRadius: "0.5rem", overflow: "auto", marginTop: "0.5rem" }}>
          {error.message || "Unknown error"}
          {"\n"}
          {error.digest ? `Digest: ${error.digest}` : ""}
          {"\n\n"}
          {error.stack || ""}
        </pre>
        <button
          onClick={reset}
          style={{ marginTop: "1rem", padding: "0.5rem 1rem", background: "#d4a017", color: "#0a0a12", borderRadius: "0.375rem", border: "none", cursor: "pointer" }}
        >
          נסה שוב
        </button>
      </body>
    </html>
  );
}
