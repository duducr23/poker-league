import { type LeaderboardRow } from "@/types";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { TrendingUp, TrendingDown } from "lucide-react";

interface Props {
  top2: LeaderboardRow[];
  bottom2: LeaderboardRow[];
  groupId: string;
  rotationSeed: number;
}

// ── Seeded deterministic picker ───────────────────────────────────────────────

function userHash(userId: string): number {
  return userId.split("").reduce((acc, c, i) => acc + c.charCodeAt(0) * (i + 1), 0);
}

function pick<T>(arr: T[], seed: number): T {
  return arr[Math.abs(seed) % arr.length];
}

// ── LINE POOLS ────────────────────────────────────────────────────────────────

type LineGen = (r: LeaderboardRow) => string;

const RANK1_A: LineGen[] = [
  (r) => `מנצח ${r.successRate.toFixed(0)}% מהזמן. הוא לא קורא קלפים — הוא קורא נשמות. כולם שם מתקפלים בלי להבין למה.`,
  (r) => `${r.gamesPlayed} ערבים, ${r.totalProfitLoss > 0 ? "+" : ""}${formatCurrency(r.totalProfitLoss)}. מגיע לשולחן כמו גובה חוב — יודע בדיוק מה הוא בא לקחת ומאי.`,
  (r) => `ROI של ${r.roi.toFixed(0)}%. ברנקרול מנג'מנט שאחרים לומדים ב-YouTube ומעדיפים לשכוח מיד אחרי.`,
  (r) => `${r.successRate.toFixed(0)}% ניצחונות. בשלב זה כבר לא ברור אם השאר באו לשחק פוקר או לממן את קרן הפרישה שלו.`,
  (r) => `אחרי ${r.gamesPlayed} ערבים הוא בפלוס של ${formatCurrency(r.totalProfitLoss)}. אם פוקר היה עבודה — הוא כבר היה מבקש רכב חברה ויום עבודה מהבית.`,
  (r) => `ממוצע ${formatCurrency(r.avgProfitPerGame)} לערב. אנשי מכירות ותיקים שמעו על זה ובכו בשקט.`,
  (r) => `הוא לא משחק all-in כשהוא צריך — הוא משחק all-in כשהוא *רוצה*. ההבדל הזה שווה ${formatCurrency(r.totalProfitLoss)}.`,
  (r) => `${r.profitableNights} ניצחונות מתוך ${r.gamesPlayed} ערבים. לא מזל — מי שאומר "מזל" מנסה לישון בלילה.`,
];

const RANK1_B: LineGen[] = [
  (_r) => `כשהוא אומר 'צ'ק' — כולם מרגישים מאוימים. כשהוא ריז — כולם מתחילים לחשב pot odds בפאניקה.`,
  (_r) => `ריבר אחרי ריבר הוא שם. לא בגלל מזל — הוא קרא את הפלופ כשכולם עדיין חיו את הפרה-פלופ.`,
  (_r) => `הבלאף שלו כל כך מדויק שגם הוא לא תמיד בטוח אם יש לו קלפים. וזה בדיוק הסוד.`,
  (_r) => `שאר הקבוצה ב-tilt מהמחשבה שהוא שם. הוא? כבר ספר את הכסף בדרך הביתה.`,
  (_r) => `ה-hand reading שלו כל כך מדויק שאנשים חושבים שהוא מוחל. הוא לא. הוא סתם רואה את הקלפים שלך.`,
  (_r) => `ה-fish שבשולחן? הם חושבים שהוא friend. הוא חבר. עם ארנק שגדל בגלל החברות הזאת.`,
  (_r) => `כשהוא פולד — כולם מקלים נשימה. זו בעיה. כי הוא פולד כשכולם לא זזים, וריז כשכולם רוצים להתקפל.`,
  (_r) => `ה-cooler האחרון שהיכה אותו? הוא לא זוכר. כי הוא לא מחשיב bad beats — הוא מחשיב equity.`,
];

const RANK2_A: LineGen[] = [
  (r) => `מקום שני. לא סקסי. אבל המוביל מסתכל לו מעל הכתף ולא מודה בזה אפילו לעצמו.`,
  (r) => `${r.successRate.toFixed(0)}% ניצחונות ורק שני — מישהו שם מעליו גרם לו לשכוח מה זה showdown ריגשי.`,
  (r) => `כמעט ראשון. 'כמעט' — המילה הנוראה ביותר בפוקר. ובחיים. וביחסים. וכאן.`,
  (r) => `${formatCurrency(r.totalProfitLoss)} בפלוס ורק שני. הוא זוכר כל יד שאיבד בה לאחד שמעליו. כל אחת.`,
  (r) => `קרוב מספיק כדי לריח את המקום הראשון. רחוק מספיק כדי לחיות עם זה.`,
  (r) => `${r.gamesPlayed} ערבים ומקום שני. ה-upswing שלו מרשים. ה-timing — פחות.`,
];

const RANK2_B: LineGen[] = [
  (_r) => `ה-3bet שלו נקי. ה-4bet שלו — פחות. בדיוק ההבדל בין מקום ראשון לשני.`,
  (_r) => `לפני האחרון? לא. שני מלמעלה. יש הבדל עצום. הוא מסביר את זה לכל מי שמוכן לשמוע.`,
  (_r) => `עוד ריבר אחד והוא ראשון. אמר גם בשבוע שעבר. ובשבוע שלפניו.`,
  (_r) => `כשהוא שמה bet בריבר — הראשון מתחיל לחשוב. זה כבר הישג.`,
  (_r) => `ה-range שלו טוב. ה-range של מי שמעליו — מעט יותר טוב. ובפוקר "מעט" שווה הכל.`,
  (_r) => `שני זה לא מקום להתבייש בו. שני זה מקום לשנוא בשקט.`,
];

const LAST_A: LineGen[] = [
  (r) => `${r.successRate.toFixed(0)}% ניצחונות. זה אפילו לא variance — זה הצהרת כוונות.`,
  (r) => `הוא all-in על כל רגש, כל ניחוש, כל bad beat שקיבל ב-3 השנים האחרונות. הארנק שלו הבין לפניו.`,
  (r) => `${r.losingNights} הפסדים מתוך ${r.gamesPlayed} ערבים. הוא לא fish — הוא whale. רק בכיוון הלא נכון.`,
  (r) => `כל ריבר שורף אותו. כל טורן מאכזב. כל פלופ נראה מבטיח ומסתיים בלעלע. הדילר כבר מרחם בשקט.`,
  (r) => `${formatCurrency(Math.abs(r.totalProfitLoss))} ירדו לתחתית הפוט. לפחות הוא מממן חוויות בלתי נשכחות לאחרים. זה גם סוג של נתינה.`,
  (r) => `הוא באמת מנסה. זה הכי מצמרר בכל הסיפור הזה.`,
  (r) => `ה-tilt שלו מגיע בדקה 3 ונשאר עד הבוקר. המשחק ממשיך — הוא פשוט כבר לא בפנים.`,
  (r) => `${r.gamesPlayed} ערבים ועדיין מגיע. אין תיאור אחר לזה מלבד אומץ. או הכחשה. בעיקר הכחשה.`,
  (r) => `ממוצע הפסד של ${formatCurrency(Math.abs(r.avgProfitPerGame))} לערב. ביטוח לאומי אפילו לא מכיר את הקטגוריה הזאת.`,
];

const LAST_B: LineGen[] = [
  (_r) => `אחד היה צריך להגיד לו ש-'pot committed' זו לא אסטרטגיה — זו שלב של אבל.`,
  (_r) => `הוא תמיד בטוח שיש לו ה-best hand. הקלפים לא תמיד חולקים את ההערכה העצמית הזאת.`,
  (_r) => `'זה היה bad beat' — משפט שחוזר אצלו יותר מ'בוקר טוב'. ב-מ-ש-פ-ט.`,
  (_r) => `ה-calling station שלו ידוע. הקופה כבר מכירה את הפנים שלו בצאת הכסף.`,
  (_r) => `הוא לא מבין למה כולם מבליפים נגדו. הם לא. הם פשוט בטוחים שיש להם את ה-hand הטוב יותר. ובצדק.`,
  (_r) => `ה-shove שלו בטורן תמיד מרגיש נכון לו. בדיעבד — פחות. בהרבה פחות.`,
  (_r) => `variance הוא תירוץ מצוין. גם לו. גם ל-20 הערבים הקודמים. גם לאחרי זה.`,
  (_r) => `אנשים שמחים שהוא בשולחן. הם לא מגלים לו למה.`,
];

const SECOND_LAST_A: LineGen[] = [
  (r) => `לפני האחרון. מזל מסוים — הוא יודע בדיוק מי כן מתחתיו ומחייך אליו בחמימות אמיתית.`,
  (r) => `${r.successRate.toFixed(0)}% ניצחונות. לא הכי גרוע בקבוצה. רק קרוב מספיק כדי שמישהו יציין את זה.`,
  (r) => `${r.gamesPlayed} ערבים ועדיין. האופטימיות שלו מפחידה יותר מהסטטיסטיקה.`,
  (r) => `${formatCurrency(Math.abs(r.totalProfitLoss))} הפסד. הוא קורא לזה 'שכר לימוד'. ${r.gamesPlayed} ערבים אחרי — הוא עדיין לומד.`,
  (r) => `לא אחרון. זה המשפט היחיד שהוא מצפה לשמוע כשהערב נגמר.`,
  (r) => `מקום לפני האחרון לא מגיע במקרה. זה דורש קביעות, עיקשות, ועיוורון סלקטיבי מרשים.`,
];

const SECOND_LAST_B: LineGen[] = [
  (_r) => `'לפחות אני לא אחרון' — המנטרה. חוזרת יותר מ-check-fold בביג בליינד.`,
  (_r) => `ה-3bet שלו נגד מי שמעליו תמיד מאוחר רבע שנייה. ה-fold נגד מי שמתחתיו — תמיד מוקדם מדי.`,
  (_r) => `הוא יודע שהוא צריך להשתפר. הוא אפילו יודע איפה. הוא פשוט ממשיך לבחור באותם ה-spots הלא נכונים.`,
  (_r) => `הבלאף הטוב ביותר שלו? להגיד לעצמו שהוא 'בדרך לעלות בדירוג'.`,
  (_r) => `כשהוא מדבר על 'range advantage' — כולם מנדנדים ראש. אף אחד לא אומר לו שה-range שלו פתוח מדי.`,
  (_r) => `אחרי שבוע — הוא שוכח את ההפסד. אחרי חודש — הוא זוכר רק את הניצחונות. זה כישרון. מסוג מסוים.`,
];

// ── Card visual configs ───────────────────────────────────────────────────────

const TOP_CFG = [
  {
    medal: "🥇", label: "מוביל הקבוצה",
    gradient: "linear-gradient(135deg, rgba(212,160,23,0.15), rgba(245,200,66,0.06))",
    border: "rgba(212,160,23,0.4)", accent: "#f5c842",
    glow: "0 0 30px rgba(212,160,23,0.12)",
  },
  {
    medal: "🥈", label: "סגן האלוף",
    gradient: "linear-gradient(135deg, rgba(148,163,184,0.12), rgba(100,116,139,0.05))",
    border: "rgba(148,163,184,0.3)", accent: "#94a3b8",
    glow: "0 0 20px rgba(148,163,184,0.08)",
  },
] as const;

const BOTTOM_CFG = [
  {
    medal: "💀", label: "אחרון הדירוג",
    gradient: "linear-gradient(135deg, rgba(239,68,68,0.13), rgba(185,28,28,0.06))",
    border: "rgba(239,68,68,0.4)", accent: "#f87171",
    glow: "0 0 25px rgba(239,68,68,0.1)",
  },
  {
    medal: "🤡", label: "לפני האחרון",
    gradient: "linear-gradient(135deg, rgba(251,146,60,0.11), rgba(194,65,12,0.05))",
    border: "rgba(251,146,60,0.3)", accent: "#fb923c",
    glow: "0 0 20px rgba(251,146,60,0.08)",
  },
] as const;

// ── Line selector ─────────────────────────────────────────────────────────────

function getLines(
  row: LeaderboardRow,
  poolA: LineGen[],
  poolB: LineGen[],
  seed: number
): [string, string] {
  const h = userHash(row.userId);
  const line1 = pick(poolA, h + seed * 31)(row);
  const line2 = pick(poolB, h + seed * 17 + 7)(row);
  return [line1, line2];
}

function winnerLines(row: LeaderboardRow, rank: number, seed: number): [string, string] {
  return rank === 1
    ? getLines(row, RANK1_A, RANK1_B, seed)
    : getLines(row, RANK2_A, RANK2_B, seed);
}

function loserLines(row: LeaderboardRow, reverseRank: number, seed: number): [string, string] {
  return reverseRank === 1
    ? getLines(row, LAST_A, LAST_B, seed)
    : getLines(row, SECOND_LAST_A, SECOND_LAST_B, seed);
}

// ── Component ─────────────────────────────────────────────────────────────────

export function TopPlayersRoast({ top2, bottom2, groupId, rotationSeed }: Props) {
  if (top2.length === 0 && bottom2.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="text-xl">🎙️</span>
        <div>
          <h2 className="text-base font-bold text-slate-100">ניתוח שחקנים — ללא צנזורה</h2>
          <p className="text-xs text-slate-600">נתונים אמיתיים. פרשנות מפוקפקת. אין חסינות.</p>
        </div>
      </div>

      {top2.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {top2.map((row, i) => {
            const cfg = TOP_CFG[i];
            const [l1, l2] = winnerLines(row, i + 1, rotationSeed);
            return <RoastCard key={row.userId} row={row} cfg={cfg} lines={[l1, l2]} groupId={groupId} />;
          })}
        </div>
      )}

      {bottom2.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {bottom2.map((row, i) => {
            const cfg = BOTTOM_CFG[i];
            const [l1, l2] = loserLines(row, i + 1, rotationSeed);
            return <RoastCard key={row.userId} row={row} cfg={cfg} lines={[l1, l2]} groupId={groupId} />;
          })}
        </div>
      )}
    </div>
  );
}

// ── Shared card ───────────────────────────────────────────────────────────────

function RoastCard({
  row, cfg, lines, groupId,
}: {
  row: LeaderboardRow;
  cfg: { medal: string; label: string; gradient: string; border: string; accent: string; glow: string };
  lines: [string, string];
  groupId: string;
}) {
  return (
    <Link
      href={`/groups/${groupId}/players/${row.userId}`}
      className="rounded-2xl p-5 space-y-4 block transition-transform hover:scale-[1.01]"
      style={{ background: cfg.gradient, border: `1px solid ${cfg.border}`, boxShadow: cfg.glow }}
    >
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

      <div className="rounded-xl px-3 py-3 space-y-2" style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.05)" }}>
        <p className="text-xs text-slate-300 leading-relaxed">
          <span className="text-slate-500 mr-1">💬</span>{lines[0]}
        </p>
        <p className="text-xs text-slate-500 leading-relaxed">
          <span className="text-slate-600 mr-1">💭</span>{lines[1]}
        </p>
      </div>
    </Link>
  );
}
