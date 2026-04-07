import { type LeaderboardRow } from "@/types";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { TrendingUp, TrendingDown } from "lucide-react";

interface Props {
  top3: LeaderboardRow[];
  groupId: string;
}

// ── Roast line generator ───────────────────────────────────────────────────

function roastLines(row: LeaderboardRow, rank: number): string[] {
  const lines: string[] = [];
  const wr = row.successRate;            // win rate %
  const n = row.gamesPlayed;
  const streak = row.currentStreak;
  const roi = row.roi;
  const losing = row.losingNights;
  const winning = row.profitableNights;
  const avg = row.avgProfitPerGame;
  const pl = row.totalProfitLoss;

  // ── Rank 1 ────────────────────────────────────────────────────────────────
  if (rank === 1) {
    if (wr >= 65)
      lines.push(`מנצח ${wr.toFixed(0)}% מהזמן — לא ברור אם זה כישרון, מזל, או שהוא סתם יושב הכי קרוב לבר.`);
    else if (wr >= 50)
      lines.push(`${wr.toFixed(0)}% ניצחונות. לא גאון, לא קוסם — פשוט בן אדם שכולם מפחדים לשבת לידו.`);
    else
      lines.push(`מוביל הדירוג עם ${wr.toFixed(0)}% ניצחונות בלבד. כמה ניצחונות ענקיים ואתה מלך — הוא הוכיח את זה.`);

    if (roi > 60)
      lines.push(`תשואה של ${roi.toFixed(0)}% על ההשקעה. וורן באפט? גם הוא שמע עליו.`);
    else if (avg > 200)
      lines.push(`ממוצע רווח של ${formatCurrency(avg)} לערב. יש מקצועות שמשלמים פחות. הרבה פחות.`);
    else
      lines.push(`${n} ערבים, ${pl > 0 ? "+" : ""}${formatCurrency(pl)}. לא הגיע רק כדי לשחק — הגיע גם כדי לקחת.`);
  }

  // ── Rank 2 ────────────────────────────────────────────────────────────────
  else if (rank === 2) {
    lines.push(`מקום שני. לא ראשון. לא שלישי. מקום שני — המקום שכולם זוכרים שאתה קרוב אבל לא מספיק.`);

    if (losing > winning)
      lines.push(`${losing} הפסדים מול ${winning} ניצחונות, ועדיין מקום שני? הוא מפסיד בסגנון שאחרים לא יכולים להרשות לעצמם.`);
    else if (wr >= 55)
      lines.push(`${wr.toFixed(0)}% ניצחונות ורק מקום שני — מישהו שם מעליו מפריע לו לישון בלילה.`);
    else
      lines.push(`כמעט ראשון. כמעט. המילה הזאת חוזרת לו בחלומות.`);
  }

  // ── Rank 3 ────────────────────────────────────────────────────────────────
  else {
    if (pl > 0)
      lines.push(`מדליית ארד — ועדיין בפלוס. לא ראשון, לא שני, אבל לפחות לא מממן את כולם.`);
    else if (pl > -300)
      lines.push(`מקום שלישי עם הפסד קטן. מבחינתו זה ניצחון מוסרי. הוא כבר מספר את זה לכולם.`);
    else
      lines.push(`מקום שלישי ובהפסד של ${formatCurrency(Math.abs(pl))}. "לפחות אני בטופ 3" הוא אמר לעצמו. וזה נכון.`);

    if (n >= 10)
      lines.push(`${n} ערבים ועדיין מגיע — הנאמנות שלו לשולחן עולה על הנאמנות שלו לארנק.`);
    else
      lines.push(`עוד קצת ערבים ואולי הוא יעקוף את מקום 2. אולי. בינתיים — ארד.`);
  }

  // ── Streak overlays (universal) ────────────────────────────────────────────
  if (streak >= 4)
    lines.push(`ברצף של ${streak} ניצחונות ברצף 🔥 — שאר השחקנים כבר מחפשים תירוצים שלא לשבת ליד.`);
  else if (streak <= -4)
    lines.push(`ברצף של ${Math.abs(streak)} הפסדים ⬇️ — בשלב זה הוא מגיע לערב כמו קורבן התרמה מרצון.`);
  else if (streak === 0 && n >= 3)
    lines.push(`רצף אפס — לא ניצחון ולא הפסד ברצף. הגדרת "שמור על עצמך".`);

  return lines.slice(0, 2);
}

// ── Rank config ───────────────────────────────────────────────────────────

const RANK_CFG = [
  {
    medal: "🥇",
    label: "מוביל הקבוצה",
    gradient: "linear-gradient(135deg, rgba(212,160,23,0.15), rgba(245,200,66,0.06))",
    border: "rgba(212,160,23,0.4)",
    accent: "#f5c842",
    glow: "0 0 30px rgba(212,160,23,0.12)",
  },
  {
    medal: "🥈",
    label: "סגן האלוף",
    gradient: "linear-gradient(135deg, rgba(148,163,184,0.12), rgba(100,116,139,0.05))",
    border: "rgba(148,163,184,0.3)",
    accent: "#94a3b8",
    glow: "0 0 20px rgba(148,163,184,0.08)",
  },
  {
    medal: "🥉",
    label: "מדליית הארד",
    gradient: "linear-gradient(135deg, rgba(180,120,60,0.12), rgba(140,90,40,0.05))",
    border: "rgba(180,120,60,0.3)",
    accent: "#cd7f32",
    glow: "0 0 20px rgba(180,120,60,0.08)",
  },
] as const;

// ── Component ─────────────────────────────────────────────────────────────

export function TopPlayersRoast({ top3, groupId }: Props) {
  if (top3.length === 0) return null;

  return (
    <div>
      {/* Section header */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-xl">🎙️</span>
        <div>
          <h2 className="text-base font-bold text-slate-100">ניתוח שחקנים — ללא צנזורה</h2>
          <p className="text-xs text-slate-600">נתונים אמיתיים. פרשנות מפוקפקת.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {top3.map((row, i) => {
          const cfg = RANK_CFG[i];
          const lines = roastLines(row, i + 1);

          return (
            <Link
              key={row.userId}
              href={`/groups/${groupId}/players/${row.userId}`}
              className="rounded-2xl p-5 space-y-4 block transition-transform hover:scale-[1.01]"
              style={{
                background: cfg.gradient,
                border: `1px solid ${cfg.border}`,
                boxShadow: cfg.glow,
              }}
            >
              {/* Header row */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{cfg.medal}</span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: cfg.accent }}>
                      {cfg.label}
                    </p>
                    <p className="text-base font-bold text-slate-100 leading-tight mt-0.5">{row.name}</p>
                  </div>
                </div>

                {/* P/L */}
                <div className="text-right shrink-0">
                  <p
                    className="text-lg font-black"
                    style={{ color: row.totalProfitLoss >= 0 ? "#10b981" : "#f87171" }}
                  >
                    {row.totalProfitLoss > 0 ? "+" : ""}{formatCurrency(row.totalProfitLoss)}
                  </p>
                  <p className="text-xs text-slate-600">{row.gamesPlayed} ערבים</p>
                </div>
              </div>

              {/* Mini stats */}
              <div className="flex gap-3 text-xs">
                <span
                  className="px-2 py-1 rounded-lg font-semibold"
                  style={{ background: "rgba(16,185,129,0.1)", color: "#10b981" }}
                >
                  ✅ {row.profitableNights}
                </span>
                <span
                  className="px-2 py-1 rounded-lg font-semibold"
                  style={{ background: "rgba(248,113,113,0.1)", color: "#f87171" }}
                >
                  ❌ {row.losingNights}
                </span>
                <span
                  className="px-2 py-1 rounded-lg font-semibold"
                  style={{ background: "rgba(255,255,255,0.05)", color: "#94a3b8" }}
                >
                  🎯 {row.successRate.toFixed(0)}%
                </span>
                {row.currentStreak !== 0 && (
                  <span
                    className="px-2 py-1 rounded-lg font-semibold flex items-center gap-1"
                    style={{
                      background: row.currentStreak > 0 ? "rgba(16,185,129,0.1)" : "rgba(248,113,113,0.1)",
                      color: row.currentStreak > 0 ? "#10b981" : "#f87171",
                    }}
                  >
                    {row.currentStreak > 0
                      ? <TrendingUp className="h-3 w-3" />
                      : <TrendingDown className="h-3 w-3" />}
                    {Math.abs(row.currentStreak)}
                  </span>
                )}
              </div>

              {/* Roast lines */}
              <div
                className="rounded-xl px-3 py-3 space-y-2"
                style={{ background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.05)" }}
              >
                {lines.map((line, j) => (
                  <p key={j} className="text-xs text-slate-400 leading-relaxed">
                    <span className="text-slate-600 mr-1">{j === 0 ? "💬" : "💭"}</span>
                    {line}
                  </p>
                ))}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
