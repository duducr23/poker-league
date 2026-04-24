"use client";
import { type RoastResult } from "@/lib/compute-roast";
import { formatCurrency } from "@/lib/utils";

interface Props {
  roast: RoastResult;
}

export function SessionRoast({ roast }: Props) {
  if (roast.awards.length === 0 && roast.playerCards.length === 0) return null;

  return (
    <div className="mt-6 space-y-5">
      {/* Awards */}
      {roast.awards.length > 0 && (
        <div>
          <p
            className="text-xs font-bold uppercase tracking-widest mb-3 text-center"
            style={{ color: "rgba(212,160,23,0.6)" }}
          >
            🏅 פרסי הערב
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {roast.awards.map((award) => (
              <div
                key={award.title}
                className="rounded-xl px-4 py-3 flex items-start gap-3"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: `1px solid ${award.color}33`,
                }}
              >
                <span className="text-2xl shrink-0">{award.emoji}</span>
                <div className="min-w-0">
                  <p className="text-xs font-bold" style={{ color: award.color }}>
                    {award.title}
                  </p>
                  <p className="text-sm font-semibold text-slate-100 mt-0.5">
                    {award.recipientName}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    {award.subtitle}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Per-player roast cards */}
      {roast.playerCards.length > 0 && (
        <div>
          <p
            className="text-xs font-bold uppercase tracking-widest mb-3 text-center"
            style={{ color: "rgba(212,160,23,0.6)" }}
          >
            🎤 ניתוח אישי
          </p>
          <div className="space-y-3">
            {roast.playerCards.map((card) => (
              <div
                key={card.userId}
                className="rounded-xl px-4 py-4"
                style={{
                  background: "rgba(255,255,255,0.025)",
                  border: `1px solid ${
                    card.profitLoss > 0
                      ? "rgba(16,185,129,0.2)"
                      : card.profitLoss < 0
                      ? "rgba(248,113,113,0.2)"
                      : "rgba(255,255,255,0.06)"
                  }`,
                }}
              >
                {/* Player header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-100 text-sm">{card.name}</span>
                    {card.badge && (
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          background: "rgba(212,160,23,0.12)",
                          color: "#f5c842",
                          border: "1px solid rgba(212,160,23,0.2)",
                        }}
                      >
                        {card.badge}
                      </span>
                    )}
                  </div>
                  <span
                    className="text-sm font-bold"
                    style={{
                      color:
                        card.profitLoss > 0
                          ? "#10b981"
                          : card.profitLoss < 0
                          ? "#f87171"
                          : "#64748b",
                    }}
                  >
                    {card.profitLoss > 0 ? "+" : ""}
                    {formatCurrency(card.profitLoss)}
                  </span>
                </div>

                {/* Trash talk — sharp one-liner */}
                {card.trashTalk && (
                  <div
                    className="rounded-lg px-3 py-2 mb-2 text-xs leading-relaxed font-medium"
                    style={{
                      background: card.profitLoss > 0
                        ? "rgba(16,185,129,0.08)"
                        : card.profitLoss < 0
                        ? "rgba(248,113,113,0.08)"
                        : "rgba(255,255,255,0.04)",
                      borderRight: `3px solid ${card.profitLoss > 0 ? "#10b981" : card.profitLoss < 0 ? "#f87171" : "#475569"}`,
                      color: card.profitLoss > 0 ? "#6ee7b7" : card.profitLoss < 0 ? "#fca5a5" : "#94a3b8",
                    }}
                  >
                    💬 {card.trashTalk}
                  </div>
                )}

                {/* Roast lines */}
                {card.lines.length > 0 && (
                  <ul className="space-y-1.5">
                    {card.lines.map((line, i) => (
                      <li
                        key={i}
                        className="text-xs leading-relaxed text-slate-400 flex gap-2"
                      >
                        <span className="text-slate-600 shrink-0">—</span>
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-center text-xs text-slate-700 pb-2">
        * הניתוח נוצר אוטומטית על בסיס נתוני הערב. כל דמיון לאנשים אמיתיים הוא מכוון לחלוטין.
      </p>
    </div>
  );
}
