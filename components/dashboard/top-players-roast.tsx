"use client";
import { type LeaderboardRow } from "@/types";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { TrendingUp, TrendingDown } from "lucide-react";

interface Props {
  top2: LeaderboardRow[];
  bottom2: LeaderboardRow[];
  groupId: string;
}

// ── Winner roast lines (מקום 1-2) ────────────────────────────────────────────

function winnerLines(row: LeaderboardRow, rank: number): string[] {
  const lines: string[] = [];
  const wr = row.successRate;
  const n = row.gamesPlayed;
  const streak = row.currentStreak;
  const roi = row.roi;
  const avg = row.avgProfitPerGame;
  const pl = row.totalProfitLoss;
  const losing = row.losingNights;
  const winning = row.profitableNights;

  if (rank === 1) {
    if (wr >= 70)
      lines.push(`מנצח ${wr.toFixed(0)}% מהזמן. לא מזל. לא מקרה. פשוט כולם שם שרצים בשבילו ולא יודעים.`);
    else if (wr >= 55)
      lines.push(`${wr.toFixed(0)}% ניצחונות ומוביל הדירוג — השאר עוד מחפשים מה הם עושים לא בסדר.`);
    else
      lines.push(`מוביל עם ${wr.toFixed(0)}% ניצחונות בלבד. לא צריך לנצח הרבה — רק לנצח כשזה נחשב.`);

    if (roi > 80)
      lines.push(`ROI של ${roi.toFixed(0)}%. הוא לא שחקן פוקר. הוא מנהל קרן גידור שמתחפש לאחד מכם.`);
    else if (avg > 250)
      lines.push(`ממוצע ${formatCurrency(avg)} לערב. רואה חשבון שלו ממש לא שואל שאלות.`);
    else if (streak >= 3)
      lines.push(`${streak} ניצחונות ברצף. שאר הקבוצה כבר שוקלת לשנות יום בשבוע.`);
    else
      lines.push(`${formatCurrency(pl)} בכיס. לא ברור אם הוא בא לשחק פוקר או לגבות שכר דירה.`);
  } else {
    // rank 2
    lines.push(`מקום שני. מספיק טוב להתפאר. לא מספיק טוב לשתוק על זה בוואטסאפ.`);

    if (pl > 0 && losing > winning * 0.6)
      lines.push(`מפסיד יותר ערבים ממה שמנצח — ובכל זאת בפלוס. פוקר מוזר. הוא מוזר יותר.`);
    else if (wr >= 60)
      lines.push(`${wr.toFixed(0)}% ניצחונות ורק שני? אחד מהם ממש לא ישן טוב בלילה.`);
    else if (streak >= 3)
      lines.push(`${streak} ניצחונות ברצף — בא לקפוץ למקום הראשון. המוביל עוד לא ממש שם לב.`);
    else
      lines.push(`כמעט ראשון. כמעט. המילה הזאת חוזרת אליו כמו חרטה למחרת בבוקר.`);
  }

  return lines.slice(0, 2);
}

// ── Loser roast lines (מקום אחרון-לפני אחרון) ────────────────────────────────

function loserLines(row: LeaderboardRow, reverseRank: number): string[] {
  const lines: string[] = [];
  const wr = row.successRate;
  const n = row.gamesPlayed;
  const streak = row.currentStreak;
  const pl = row.totalProfitLoss;
  const avg = row.avgProfitPerGame;
  const losing = row.losingNights;

  if (reverseRank === 1) {
    // Dead last — most savage
    if (wr <= 20)
      lines.push(`${wr.toFixed(0)}% ניצחונות. זה לא גרוע — זה מדהים. לרדת כל כך נמוך צריך כישרון מיוחד.`);
    else if (wr <= 35)
      lines.push(`מנצח רק ${wr.toFixed(0)}% מהזמן. הכסא שלו ליד השולחן כבר מכיל את הכיתוב "תרומות בברכה".`);
    else
      lines.push(`${losing} הפסדים. הוא לא בא לשחק פוקר — הוא בא לממן את השאר. ואת זה הוא עושה מצוין.`);

    if (pl < -1000)
      lines.push(`${formatCurrency(Math.abs(pl))} בהפסד. יש מסעדות שהיית יכול לפתוח בכסף הזה. לא כאן — אבל איפשהו.`);
    else if (pl < -500)
      lines.push(`${formatCurrency(Math.abs(pl))} ירדו. המשפחה שלו חושבת שהוא "עושה נטוורקינג" בערבים.`);
    else if (streak <= -3)
      lines.push(`${Math.abs(streak)} הפסדים ברצף. בשלב הזה הוא כבר מגיע לפוקר כמו שהולכים לרופא שיניים — מוכן לכאב.`);
    else
      lines.push(`ממוצע ${formatCurrency(Math.abs(avg))} הפסד לערב. יש מנויי ספורט שעולים פחות ומביאים יותר שמחה.`);
  } else {
    // Second to last
    if (wr <= 30)
      lines.push(`${wr.toFixed(0)}% ניצחונות. לא הכי גרוע בקבוצה — אבל המרחק קטן בצורה מביכה.`);
    else
      lines.push(`לפני האחרון. מבחינתו זה הישג. הוא כבר שיתף את זה בסטטוס.`);

    if (pl < -300)
      lines.push(`${formatCurrency(Math.abs(pl))} הפסד. "אני לומד את המשחק" הוא אמר. ${n} ערבים אחרי — הוא עוד לומד.`);
    else if (streak <= -2)
      lines.push(`${Math.abs(streak)} הפסדים ברצף. הוא אומר "אני בירידה" — כולם מסכימים בשקט.`);
    else
      lines.push(`${n} ערבים ועדיין מגיע. האמונה שלו בעצמו גדולה מהכסף שנשאר בארנק.`);
  }

  return lines.slice(0, 2);
}

// ── Card configs ─────────────────────────────────────────────────────────────

const TOP_CFG = [
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
] as const;

const BOTTOM_CFG = [
  {
    medal: "💀",
    label: "אחרון הדירוג",
    gradient: "linear-gradient(135deg, rgba(239,68,68,0.12), rgba(185,28,28,0.06))",
    border: "rgba(239,68,68,0.35)",
    accent: "#f87171",
    glow: "0 0 25px rgba(239,68,68,0.1)",
  },
  {
    medal: "🤡",
    label: "לפני האחרון",
    gradient: "linear-gradient(135deg, rgba(251,146,60,0.1), rgba(194,65,12,0.05))",
    border: "rgba(251,146,60,0.3)",
    accent: "#fb923c",
    glow: "0 0 20px rgba(251,146,60,0.08)",
  },
] as const;

// ── Component ─────────────────────────────────────────────────────────────────

export function TopPlayersRoast({ top2, bottom2, groupId }: Props) {
  if (top2.length === 0 && bottom2.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center gap-3">
        <span className="text-xl">🎙️</span>
        <div>
          <h2 className="text-base font-bold text-slate-100">ניתוח שחקנים — ללא צנזורה</h2>
          <p className="text-xs text-slate-600">נתונים אמיתיים. פרשנות מפוקפקת. אין חסינות.</p>
        </div>
      </div>

      {/* Winners */}
      {top2.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {top2.map((row, i) => {
            const cfg = TOP_CFG[i];
            const lines = winnerLines(row, i + 1);
            return <RoastCard key={row.userId} row={row} cfg={cfg} lines={lines} groupId={groupId} />;
          })}
        </div>
      )}

      {/* Losers */}
      {bottom2.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {bottom2.map((row, i) => {
            const cfg = BOTTOM_CFG[i];
            const lines = loserLines(row, i + 1);
            return <RoastCard key={row.userId} row={row} cfg={cfg} lines={lines} groupId={groupId} />;
          })}
        </div>
      )}
    </div>
  );
}

// ── Shared card ───────────────────────────────────────────────────────────────

function RoastCard({
  row,
  cfg,
  lines,
  groupId,
}: {
  row: LeaderboardRow;
  cfg: { medal: string; label: string; gradient: string; border: string; accent: string; glow: string };
  lines: string[];
  groupId: string;
}) {
  return (
    <Link
      href={`/groups/${groupId}/players/${row.userId}`}
      className="rounded-2xl p-5 space-y-4 block transition-transform hover:scale-[1.01]"
      style={{ background: cfg.gradient, border: `1px solid ${cfg.border}`, boxShadow: cfg.glow }}
    >
      {/* Header */}
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
        <div className="text-right shrink-0">
          <p className="text-lg font-black" style={{ color: row.totalProfitLoss >= 0 ? "#10b981" : "#f87171" }}>
            {row.totalProfitLoss > 0 ? "+" : ""}{formatCurrency(row.totalProfitLoss)}
          </p>
          <p className="text-xs text-slate-600">{row.gamesPlayed} ערבים</p>
        </div>
      </div>

      {/* Mini stats */}
      <div className="flex gap-2 flex-wrap text-xs">
        <span className="px-2 py-1 rounded-lg font-semibold" style={{ background: "rgba(16,185,129,0.1)", color: "#10b981" }}>
          ✅ {row.profitableNights}
        </span>
        <span className="px-2 py-1 rounded-lg font-semibold" style={{ background: "rgba(248,113,113,0.1)", color: "#f87171" }}>
          ❌ {row.losingNights}
        </span>
        <span className="px-2 py-1 rounded-lg font-semibold" style={{ background: "rgba(255,255,255,0.05)", color: "#94a3b8" }}>
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
            {row.currentStreak > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {Math.abs(row.currentStreak)}
          </span>
        )}
      </div>

      {/* Roast lines */}
      <div className="rounded-xl px-3 py-3 space-y-2" style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.05)" }}>
        {lines.map((line, j) => (
          <p key={j} className="text-xs text-slate-400 leading-relaxed">
            <span className="text-slate-600 mr-1">{j === 0 ? "💬" : "💭"}</span>
            {line}
          </p>
        ))}
      </div>
    </Link>
  );
}
