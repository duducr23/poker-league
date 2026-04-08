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

// 🥇 מקום ראשון — שבח מביך קיצוני
const RANK1_A: LineGen[] = [
  (r) => `${formatCurrency(r.totalProfitLoss)} נטו. לא מהעבודה, לא מהבורסה — רק מחברים שחושבים שהם יודעים לשחק פוקר. הוא לא מתקן אותם.`,
  (r) => `${r.successRate.toFixed(0)}% ניצחונות. FBI אמריקאי מנצח פחות תיקים בבית משפט. מישהו צריך לבדוק שאין לו מצלמות מסביב לשולחן.`,
  (r) => `ROI של ${r.roi.toFixed(0)}%. וורן באפט שמע על זה ושאל לשם. הוא לא ענה — היה עסוק בלספור את הכסף של החבר'ה.`,
  (r) => `${r.profitableNights} ערבים מנצחים מתוך ${r.gamesPlayed}. זה לא פוקר — זה גביית מיסים. כולם שם שותפים בלי לדעת.`,
  (r) => `ממוצע ${formatCurrency(r.avgProfitPerGame)} לערב. בסוף הלילה הוא נוסע הביתה, שאר הקבוצה עושה חשבון נפש בפקק.`,
  (r) => `הוא לא מנצח כי הוא מזיל זיעה — הוא מנצח כי השאר מזיל זיעה וזה גורם לו ריגוש עצום. ${formatCurrency(r.totalProfitLoss)} של ריגוש.`,
  (r) => `${r.gamesPlayed} ערבים, ${formatCurrency(r.totalProfitLoss)} רווח. פסיכולוג יגיד שהוא צריך לקבל עזרה. אנחנו אומרים שהוא צריך להמשיך.`,
  (r) => `כשהוא נכנס לחדר — כולם מחייכים. הם לא יודעים עדיין שהחיוך הזה עולה להם ממוצע ${formatCurrency(r.avgProfitPerGame)} ₪ לערב.`,
  (r) => `${r.successRate.toFixed(0)}% win rate. אם המדינה הייתה גובה מס על מוח פוקר — הוא היה מממן כיתת לימוד שלמה. לבד.`,
  (r) => `אפשר להפסיד ${formatCurrency(Math.abs(r.totalProfitLoss))} ₪ למישהו אחר, ואפשר להפסיד אותו לו. ההבדל? הוא לפחות נראה מצטער בשנייה הראשונה.`,
  (r) => `ה-hand reading שלו כל כך מדויק שאחד החבר'ה ניסה לחשוב בעברית פנימית — כדי שלא יקרא לו את המחשבות. לא עזר.`,
  (r) => `${r.profitableNights} ניצחונות. הוא לא מדבר על זה. לא צריך. המסך הזה עושה את זה בשבילו כל יום.`,
  (r) => `כשהוא מעלה — כולם מרגישים שיש להם את ה-hand הנכון. כשהוא מקפל — כולם חושבים שניצחו. אף אחד לא מרוויח פה חוץ ממנו.`,
  (r) => `${formatCurrency(r.totalProfitLoss)} בפלוס. למי שמחפש מנטור בפוקר — הוא לא עונה לפניות. אבל ניתן לשלוח לו כסף בשעתיים הבאות.`,
];

// 🥇 מקום ראשון — שורה ב (עוד יותר מביכה)
const RANK1_B: LineGen[] = [
  (_r) => `הבלאף שלו כל כך נקי שברגע שהוא מראה את הקלפים — שאר השולחן עובר את ה-5 שלבי האבל בשידור ישיר.`,
  (_r) => `'הוא שוב?!' — המשפט שנשמע בשקט לפני שהוא מגיע. כולם שם. כולם משלמים. זה לא מפסיק.`,
  (_r) => `ה-fish בשולחן חושבים שהוא נחמד. הוא נחמד. נחמד מאוד. ועם ארנק שמוכיח שהוא לא מתבלבל בין רגש לאסטרטגיה.`,
  (_r) => `קורא את הסיפור מהפרה-פלופ עד הריבר לפני שמישהו אחר הספיק לראות את שתי הקלפים שלו.`,
  (_r) => `שאלו אותו פעם מה הסוד. הוא אמר 'אני פשוט נהנה'. החבר'ה שמעו. הלכו הביתה. בכו.`,
  (_r) => `ה-3bet שלו גורם לאנשים לספור מחדש את הצ'יפס. ה-4bet שלו גורם להם לספור מחדש את ה-ATM הקרוב.`,
  (_r) => `הוא לא מדבר הרבה בסשן. הקלפים מדברים בשבילו. הכסף מסכים.`,
  (_r) => `ניסו ללמד אותו 'להפסיד בחן'. הוא מנסה. ממש מנסה. פשוט נדיר שיש לו הזדמנות לתרגל.`,
  (_r) => `ה-river bet שלו בגובה המדויק שגורם לך להתקפל ולתהות שבועות מה היה לו. זה אומנות. מכאיבה ומביכה.`,
  (_r) => `אחרי כל ערב הוא אומר 'שיחקתי ממוצע'. כולם מסכימים. כולם גם יודעים שממוצע שלו זה extraordinary של כולם.`,
];

// 🥈 מקום שני — מר, ישיר, מביך
const RANK2_A: LineGen[] = [
  (r) => `שני. ${formatCurrency(r.totalProfitLoss)} בפלוס ועדיין מרגיש שפספס. כי פספס. מקום ראשון שם ומסתכל אחורה בנינוחות.`,
  (r) => `${r.successRate.toFixed(0)}% ניצחונות ורק שני — ביציאה מהערב הוא בפנים מחייך, בפנים? מחשב איפה בדיוק הוא איבד את הפנים.`,
  (r) => `${r.gamesPlayed} ערבים, מקום שני כרוני. יש שלב שצריך לשאול: זה תקרת זכוכית או תקרת אופי?`,
  (r) => `כל ניצחון שלו חצי טעים כי הוא יודע שמישהו שם עשה יותר. ${formatCurrency(r.totalProfitLoss)} של תסכול יפה.`,
  (r) => `קרוב מספיק ל-${formatCurrency(r.totalProfitLoss)} כדי להרגיש טוב. רחוק מספיק כדי לדעת שלא מספיק.`,
  (r) => `${r.profitableNights} ניצחונות. מספיק להיות מאושר. לא מספיק להיות ראשון. ההבדל הקטן הזה שומר אותו ער בלילה.`,
  (r) => `שני זה לא כישלון — זה הצלחה שמישהו אחר לקח. הוא יודע את זה. הוא מקבל. הוא לא מקבל.`,
  (r) => `ממוצע ${formatCurrency(r.avgProfitPerGame)} לערב. מרשים. בשום שולחן אחר הוא לא היה שני. אבל הוא לא בשום שולחן אחר.`,
  (r) => `${r.gamesPlayed} ערבים מול אותו מקום ראשון. בנקודה מסוימת — זה כבר לא variance. זה מערכת יחסים.`,
  (r) => `הוא לא מדבר על מקום ראשון. לא מנסה. פשוט שם, ממוקם, ממתין. הוא גם לא בטוח ל-מה.`,
];

const RANK2_B: LineGen[] = [
  (_r) => `ה-3bet שלו נקי. ה-4bet שלו — כמעט. ה-'כמעט' הזה שווה מקום.`,
  (_r) => `לפני האחרון? לא. שני מלמעלה? כן. ההבדל ברור לו. לכולם אחרים — פחות.`,
  (_r) => `עוד ריבר אחד, עוד call אחד — והוא ראשון. אמר גם בחודש שעבר. ובחודש שלפניו. הריבר לא מתרגש.`,
  (_r) => `כשהוא ריז — הראשון חושב. זה הישג אמיתי. הוא פשוט מחזיר לו call בחיוך שמעצבן יותר מ-reraise.`,
  (_r) => `ה-range שלו כמעט מושלם. ה-range של מי שמעליו — מושלם. בפוקר 'כמעט' שווה כל ההפרש שבניהם.`,
  (_r) => `שני זה לא להתבייש. שני זה גם לא מה שהוא חלם עליו בדרך לפה.`,
  (_r) => `ה-bluff catch שלו מדויק. ה-value bet שלו נכון. מה שחסר? שאלה טובה. הוא חושב עליה כל ערב.`,
  (_r) => `הוא שחקן טוב. אמיתי. ובשולחן אחר — הוא היה הסיפור. כאן הוא הפרק השני.`,
];

// 💀 אחרון — רוסט קטלני מבוסס נתונים
const LAST_A: LineGen[] = [
  (r) => `${formatCurrency(Math.abs(r.totalProfitLoss))} שיצאו מהארנק ולא חזרו. לא גנבו אותם — הוא נתן אותם מרצון, עם קלפים, עם אמונה, ועם אופטימיות שגרמה לאחרים לאהוב אותו מאוד.`,
  (r) => `${r.losingNights} ערבים מפסידים מתוך ${r.gamesPlayed}. זה לא downswing. זה לא variance. זה biography.`,
  (r) => `ROI של ${r.roi.toFixed(0)}%. לשם ההשוואה — קרן נאמנות ממוצעת מציעה ${r.roi.toFixed(0) > "-30" ? "יותר" : "בערך אותו דבר"}. רק שם לפחות שולחים דוח רבעוני.`,
  (r) => `ממוצע הפסד של ${formatCurrency(Math.abs(r.avgProfitPerGame))} לערב. אם זה היה שכר לימוד — הוא צריך לבקש קבלה ותואר.`,
  (r) => `${r.successRate.toFixed(0)}% ניצחונות. האחוז הזה לא שגוי — הוא נבדק. מספר פעמים. המסקנה כל פעם אותה מסקנה.`,
  (r) => `${formatCurrency(Math.abs(r.totalProfitLoss))} הפסד כולל. לו היה שם את הכסף הזה בביטקוין ב-2020 — לא היה מדברים עליו בהקשר הזה.`,
  (r) => `${r.gamesPlayed} ערבים. זה לא עקשנות — זה מחויבות. ממש. לדבר הלא נכון. בעקביות שמרשימה.`,
  (r) => `כשהוא אומר 'all-in' — הסביבה מחייכת. לא ממרירות. מהכרה. כי הסיפור ממשיך בכיוון ידוע.`,
  (r) => `הוא מגיע עם אמונה, מקפל עם כאב, יוצא עם הפסד. ${r.gamesPlayed} פעמים. יש בזה עקביות שמעטים מגיעים אליה.`,
  (r) => `הטעות הכי גדולה שלו היא שהוא חושב שהוא מבין כבר. ${formatCurrency(Math.abs(r.totalProfitLoss))} ₪ של 'אני כבר מבין'.`,
  (r) => `${r.losingNights} לילות הפסד. כל ריבר שורף, כל טורן מאכזב, כל פלופ מסתיים בתמיהה. הדילר כבר לא מופתע.`,
  (r) => `אם הייתה תחרות על הכי נדיב בשולחן — הוא היה מנצח ב-${r.successRate.toFixed(0) === "0" ? "100" : (100 - +r.successRate.toFixed(0)).toFixed(0)}% מהמקרים. תואר ראשון בנדיבות בלתי רצונית.`,
  (r) => `${formatCurrency(Math.abs(r.avgProfitPerGame))} לערב, ${r.gamesPlayed} ערבים. המדינה לא מקצה תקציב רווחה לקטגוריה הזאת, אבל אם הייתה — הוא היה מוביל הרשימה.`,
  (r) => `ה-bad beat stories שלו ארוכים מהמשחק עצמו. הסיבה? כי עם ${r.losingNights} הפסדים — יש מה לספר.`,
];

const LAST_B: LineGen[] = [
  (_r) => `'זה היה bad beat' — נכון. כל פעם. כל ערב. ה-bad beat הוא לא בקלפים — הוא בהחלטה להיכנס ל-pot הזה.`,
  (_r) => `הוא קורא לעצמו 'loose aggressive'. הנתונים קוראים לזה 'loose'. בלי ה-aggressive.`,
  (_r) => `ה-calling station שלו אגדי. כולם מדברים עליו. לא בצורה שהוא חושב.`,
  (_r) => `pot odds? implied odds? הוא שמע. אפילו הבין פעם אחת. אז קיבל bad beat ושכח הכל.`,
  (_r) => `כשמישהו מבליף נגדו — הוא קורא. כשיש לו עדיף — הוא מקפל. זה לא קלפים, זה כוריאוגרפיה.`,
  (_r) => `ה-shove שלו בטורן תמיד מרגיש נכון בזמן אמת. בדיעבד? יש תיאטרון שלם של 'למה עשיתי את זה'.`,
  (_r) => `variance? כן. תקופה קשה? אולי. אבל בשלב מסוים הגרף מדבר בלי רשות.`,
  (_r) => `אנשים שמחים שהוא בשולחן. הם מחייכים. הוא חושב שזה אהבה. זה אהבה. מסוג מסוים.`,
  (_r) => `הוא מחכה ל-'big hand' שיכסה הכל. הוא תמיד מגיע. ותמיד מסתיים אותו דבר.`,
  (_r) => `ה-tilt שלו גלוי כמו open limp ב-UTG — כולם רואים, כולם יודעים מה עושים, ורק הוא לא בטוח למה זה לא עובד.`,
  (_r) => `אחרי הערב הוא אומר 'הבאתי את ה-A game שלי'. ה-A game שלו צריך עוד work. ועוד. ועוד.`,
  (_r) => `הוא לא fish — הוא whale. רק בכיוון שמועיל לכולם שאינו הוא.`,
];

// 🤡 לפני אחרון — לא הכי גרוע, אבל מביך
const SECOND_LAST_A: LineGen[] = [
  (r) => `לפני האחרון. הוא יודע. הוא גם יודע מי כן אחרון ומחייך אליו בחמימות שנגמרת בדיוק שם.`,
  (r) => `${r.successRate.toFixed(0)}% ניצחונות. לא הכי גרוע. פשוט קרוב מספיק שנוח לצטט.`,
  (r) => `${r.gamesPlayed} ערבים ועדיין. האופטימיות שלו מרשימה. הנתונים — פחות.`,
  (r) => `${formatCurrency(Math.abs(r.totalProfitLoss))} הפסד ומכנה את זה 'שכר לימוד'. ${r.gamesPlayed} ערבים אחרי — הוא עדיין לומד. מאוד לאט.`,
  (r) => `'לפחות אני לא אחרון' — המשפט הזה מחמם אותו יותר מהחימום בבית. ${r.losingNights} פעמים חימום כזה.`,
  (r) => `ממוצע הפסד של ${formatCurrency(Math.abs(r.avgProfitPerGame))} לערב. לא קטסטרופה. רק מספיק כדי שנשים לב.`,
  (r) => `${r.gamesPlayed} ערבים, מקום לפני אחרון. לא מקרי. לא גזירת גורל. פשוט patterns שמתחילים להיות מוכרים.`,
  (r) => `הוא יוצא כל פעם עם 'הבנתי מה עשיתי'. הבנה שלא מתורגמת לתוצאות — זה גם סוג של consistency.`,
  (r) => `מקום לפני האחרון דורש: קביעות, עיקשות, ועיוורון סלקטיבי. יש לו שלושת השלושה. בשפע.`,
  (r) => `אחד ממנו — ויש לנו שניים ממי שלא צריך להיות שניים. הוא יודע. הוא גם לא בטוח מה לעשות עם הידיעה הזאת.`,
  (r) => `${r.successRate.toFixed(0)}% win rate. בסקאלה של נסיבות מקלות — זה בקטגוריה 'ניסה מאוד'.`,
];

const SECOND_LAST_B: LineGen[] = [
  (_r) => `'לפחות אני לא אחרון' — מנטרה. חוזרת יותר מ-check-fold ב-BB.`,
  (_r) => `ה-3bet שלו נגד ראשון — תמיד מאוחר. ה-fold נגד האחרון — תמיד מוקדם. טיימינג זה הכל.`,
  (_r) => `הוא יודע שצריך להשתפר. הוא יודע איפה. הוא ממשיך לבחור באותם ה-spots הלא נכונים. יש בזה נוחות.`,
  (_r) => `הבלאף הכי טוב שלו? לשכנע את עצמו שהוא 'בדרך לעלות'. גם זה skill.`,
  (_r) => `כשהוא מדבר על 'range advantage' — כולם מנדנדים. אף אחד לא מגלה לו שה-range שלו פתוח מדי.`,
  (_r) => `אחרי שבועיים הוא שוכח את ההפסד. אחרי חודש הוא זוכר רק ניצחונות. זה selective memory. זה שומר עליו.`,
  (_r) => `ה-call שלו ב-river תמיד נראה מוצדק לו. לאחרים פחות. לסטטיסטיקה — ממש לא.`,
  (_r) => `יש לו session טוב ומיד מאמין שמשהו השתנה. Session אחד לא מחליף 20 ערבים של patterns.`,
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
          <p className="text-xs text-slate-600">נתונים אמיתיים. פרשנות מפוקפקת. מתחלף כל 24 שעות.</p>
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
