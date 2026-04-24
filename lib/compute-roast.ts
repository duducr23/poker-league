// lib/compute-roast.ts
// Generates funny Hebrew roast data for a poker session

export interface RoastPlayerInput {
  userId: string;
  name: string;
  profitLoss: number;
  totalInvested: number;
  rebuyCount: number;                  // # of approved REBUY requests
  fastestRebuyMinutes: number | null;  // minutes from first buyin → first rebuy
  historicalSessions: number;
  historicalWins: number;
  historicalLosses: number;
  historicalTotalRebuyCount: number;   // sum of rebuys across all past sessions
}

export interface RoastAward {
  emoji: string;
  title: string;
  recipientName: string;
  subtitle: string;
  color: string; // tailwind-safe hex color for border
}

export interface PlayerRoastCard {
  userId: string;
  name: string;
  profitLoss: number;
  lines: string[];
  badge: string;
  trashTalk: string; // short sharp line based on rank/result
}

export interface RoastResult {
  awards: RoastAward[];
  playerCards: PlayerRoastCard[];
}

// ── Award pickers ──────────────────────────────────────────────────────────

function pickRebuyKing(players: RoastPlayerInput[]): RoastPlayerInput | null {
  const p = [...players].sort((a, b) => b.rebuyCount - a.rebuyCount);
  return p[0]?.rebuyCount > 0 ? p[0] : null;
}

function pickFastestRebuy(players: RoastPlayerInput[]): { player: RoastPlayerInput; minutes: number } | null {
  const candidates = players
    .filter((p) => p.fastestRebuyMinutes !== null)
    .sort((a, b) => (a.fastestRebuyMinutes ?? 999) - (b.fastestRebuyMinutes ?? 999));
  const p = candidates[0];
  if (!p || p.fastestRebuyMinutes === null) return null;
  return { player: p, minutes: p.fastestRebuyMinutes };
}

function pickBiggestLoser(players: RoastPlayerInput[]): RoastPlayerInput | null {
  const p = [...players].sort((a, b) => a.profitLoss - b.profitLoss);
  return p[0]?.profitLoss < 0 ? p[0] : null;
}

function pickBiggestWinner(players: RoastPlayerInput[]): RoastPlayerInput | null {
  const p = [...players].sort((a, b) => b.profitLoss - a.profitLoss);
  return p[0]?.profitLoss > 0 ? p[0] : null;
}

function pickBiggestInvestor(players: RoastPlayerInput[]): RoastPlayerInput | null {
  const p = [...players].sort((a, b) => b.totalInvested - a.totalInvested);
  return p[0] ?? null;
}

function pickRock(players: RoastPlayerInput[]): RoastPlayerInput | null {
  const zeroes = players.filter((p) => p.rebuyCount === 0);
  if (zeroes.length === 0 || zeroes.length === players.length) return null;
  // pick the one with least invested (most disciplined)
  return zeroes.sort((a, b) => a.totalInvested - b.totalInvested)[0];
}

function pickHistoricalSufferer(players: RoastPlayerInput[]): RoastPlayerInput | null {
  const withHistory = players.filter((p) => p.historicalSessions >= 2);
  if (!withHistory.length) return null;
  return [...withHistory].sort(
    (a, b) =>
      b.historicalLosses / (b.historicalSessions || 1) -
      a.historicalLosses / (a.historicalSessions || 1)
  )[0];
}

function pickHistoricalKing(players: RoastPlayerInput[]): RoastPlayerInput | null {
  const withHistory = players.filter((p) => p.historicalSessions >= 2);
  if (!withHistory.length) return null;
  return [...withHistory].sort(
    (a, b) =>
      b.historicalWins / (b.historicalSessions || 1) -
      a.historicalWins / (a.historicalSessions || 1)
  )[0];
}

// ── Roast line generators ──────────────────────────────────────────────────

function rebuyKingLines(p: RoastPlayerInput): string[] {
  const n = p.rebuyCount;
  return [
    `${p.name} ביצע ${n} ריבאי הלילה — ${n === 1 ? "אחד, אבל בסגנון" : n === 2 ? "כפול ההנאה, כפול הכאב" : n >= 4 ? "בשלב מסוים זה כבר לא נקרא ריבאי, זה נקרא תשלום דמי חבר" : "הוא פשוט ממש אוהב את הקלפים האלה"}.`,
    `הארנק של ${p.name} לא נפתח — הוא פשוט נשאר פתוח לאורך כל הערב.`,
    `אם היה מקבל נקודות נאמנות על ריבאי, כבר היה בטיסה ראשונה לאיים.`,
  ];
}

function fastestRebuyLines(p: RoastPlayerInput, minutes: number): string[] {
  const desc =
    minutes <= 5
      ? "פחות מ-5 דקות"
      : minutes <= 15
      ? `${minutes} דקות`
      : `${minutes} דקות — שזה עוד יחסית מהיר`;
  return [
    `מ-buy-in לריבאי ב-${desc}. לפיזיקאים: זה קרוב לשיא עולמי.`,
    `${p.name} הוכיח שאפשר להפסיד כסף מהר יותר ממה שלוקח לאחד להכין קפה.`,
    `הפניקה על הפנים? לא. הוא פשוט ידע שיצטרך ריבאי — הוא רק לא ידע שיצטרך אותו כל כך מהר.`,
  ];
}

function biggestLoserLines(p: RoastPlayerInput): string[] {
  const amt = Math.abs(p.profitLoss).toFixed(0);
  return [
    `${p.name} לא הפסיד ${amt}₪ — הוא *תרם* אותם לרווחת הקבוצה. נדיב מאוד.`,
    `כבר בדרך הביתה הוא מחשב כמה עלייה בשכר הוא צריך לבקש מחר בבוקר.`,
    `אם כל ערב כזה, עד סוף השנה הוא יוכל לכתוב ספר: "איך לאבד כסף בחיוך".`,
  ];
}

function biggestWinnerLines(p: RoastPlayerInput): string[] {
  const amt = p.profitLoss.toFixed(0);
  return [
    `${p.name} הגיע, ישב, ולקח. בסדר הזה. בדיוק בסדר הזה.`,
    `ניצח ב-${amt}₪ — ועדיין לא ברור אם זה מזל, כישרון, או שהוא פשוט יודע משהו שאנחנו לא.`,
    `כדאי לשמור אותו קרוב. אולי מאוד קרוב. עם מצלמה.`,
  ];
}

function biggestInvestorLines(p: RoastPlayerInput): string[] {
  const amt = p.totalInvested.toFixed(0);
  return [
    `${p.name} השקיע ${amt}₪ הלילה — יותר ממה שהשקיע ב-Crypto ב-2021. לפחות כאן ידע שהוא מפסיד.`,
    `עם ${amt}₪ יכל לקנות מנוי שנתי לכל פלטפורמת סטרימינג ועוד ייתר לו. אבל פוקר זה יותר כיף, כנראה.`,
  ];
}

function rockLines(p: RoastPlayerInput): string[] {
  return [
    `${p.name} קנה buy-in אחד ולא נגע בכיס שוב. או שהוא ממש חד, או שהוא פשוט הגיע בשביל הנשנושים.`,
    `פסיכולוגיה של ברזל: לשבת ולראות כולם קונים ריבאי ולא לזוז. יש פה מה ללמוד.`,
  ];
}

function historicalSuffererLines(p: RoastPlayerInput): string[] {
  const rate = Math.round((p.historicalLosses / (p.historicalSessions || 1)) * 100);
  return [
    `היסטורית, ${p.name} מפסיד ב-${rate}% מהערבים. הוא לא מתייאש — זאת מחויבות.`,
    `${p.historicalSessions} ערבים בקבוצה, ${p.historicalLosses} הפסדים. אם היה מקבל אחוז קטן מכל הכסף שהפסיד, כבר היה יכול להחזיר חלק ממנו.`,
  ];
}

function historicalKingLines(p: RoastPlayerInput): string[] {
  const rate = Math.round((p.historicalWins / (p.historicalSessions || 1)) * 100);
  return [
    `${p.name} מנצח ב-${rate}% מהערבים. כולם מזמינים אותו בחזרה כי הם בטוחים שהפעם יהיה שונה. זה לא שונה.`,
    `מלך הקבוצה. עד שזה ישתנה, הוא יזכיר לכולם שזה לא השתנה.`,
  ];
}

function genericLines(p: RoastPlayerInput): string[] {
  if (p.profitLoss === 0) {
    return [
      `${p.name} יצא בדיוק בלי כלום. ביצועים של רו"ח — לא רווח, לא הפסד, פשוט שם.`,
    ];
  }
  if (p.profitLoss > 0) {
    return [`${p.name} יצא בפלוס. לא תמיד, אבל הלילה — כן.`];
  }
  return [`${p.name} תרם לאווירה הכלכלית הטובה של הערב.`];
}

// ── Trash talk by rank ────────────────────────────────────────────────────────

function pick(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateTrashTalk(
  p: RoastPlayerInput,
  rank: number,   // 1-based, sorted profitLoss desc
  total: number,
  _rebuyKingId: string | null,
  _fastestRebuyId: string | null,
): string {
  const n = p.name;
  const amt = Math.abs(p.profitLoss);
  const isNearZero = amt <= 40;

  // ── TOP 3 (winners) ────────────────────────────────────────────────────────
  if (rank <= 3 && p.profitLoss > 0) {
    const top1 = [
      `הערב הכל נדבק ל${n} — מסוג הערבים שאם היה מסתובב ברחוב גם פמלה אנדרסון הייתה נדבקת.`,
      `להיות בפסגה כל כך הרבה זמן זה כבר לא מזל — זאת מקצוענות. ${n} יודע משהו שאתם לא.`,
      `${n} מכתיב את הקצב בשולחן — אף אחד לא מאיץ בו. כולם רועדים.`,
      `מלך האומה. ${n}. ללא ספק.`,
      `ה"פוקטים" מגיעים פעם אחר פעם — ${n} מתחיל להבין שהוא מזמן אותם.`,
      `כל זימון של ${n} — בומבה! אין מה להגיד.`,
      `כולם מחכים ש${n} יפול, יפסיד וכמה שיותר — אבל הוא רק טוחן אותם עוד ועוד.`,
      `אם ${n} היה יושב בשולחן קזינו — כל המצלמות היו עליו. כוכב.`,
      `${n} לא שיחק פוקר הלילה — הוא ניהל את כולם בלי שידעו.`,
      `${n} הגיע, ראה, לקח. בסדר הזה. בדיוק.`,
    ];
    const top23 = [
      `${n} — ניצחון של מי שיודע מה הוא עושה. טוב, בערך.`,
      `כמעט ראשון, אבל גם ככה נשאר הביתה עם כסף. לא רע בכלל.`,
      `${n} לא הגיע למקום הראשון הלילה — אבל הכסף שלו מחייך.`,
      `מקום ${rank} — חלק מהתוכנית הגדולה של ${n}. לפחות זה מה שהוא יגיד.`,
      `${n} הוכיח שאפשר לנצח גם בלי להיות ה-1. מספיק.`,
    ];
    return rank === 1 ? pick(top1) : pick(top23);
  }

  // ── BREAK EVEN / אמצע (רווח/הפסד עד 40₪) ─────────────────────────────────
  if (isNearZero) {
    return pick([
      `אמצע טבלה קלאסי — שחקן אפור. ככה קוראים לזה בשכונה.`,
      `ערב מיותר. היה עדיף ל${n} להמשיך לישון בבית.`,
      `קאספר של הערב — ${n} לא הרוויח, לא הפסיד. בקושי הרגישו שהוא שם.`,
      `יש ערבים שאתה חוזר הביתה בדיוק כמו שיצאת. זה אחד מהם.`,
      `פעם ${n} היה נוצץ. היום — אפור. בינוני. מה לעשות.`,
      `${n} שיחק כל הערב כדי להגיע לאפס. פשוט מדהים.`,
      `${n} — לא זכור, לא מוכר. ערב כחול-לבן. ניטרלי. אפרפר.`,
      `אם הערב הזה היה סרט — ${n} היה מקבל 3/10 על רוטן טומייטוס.`,
    ]);
  }

  // ── LOSERS (bottom half, loss > 40₪) ──────────────────────────────────────
  const loserLines = [
    `${n} חושב שהוא יודע לשחק — אבל עדיף שילך לשחק ברידג', כי בפוקר הוא חלש.`,
    `מסתמך ונשען על המזל. לא פלא ש${n} בתחתית.`,
    `גם אם ${n} היה נשאר עוד 4 שעות בשולחן — לא היה מצליח להרוויח. פוקר זה לא הצד החזק שלו.`,
    `${n} תורם לאווירת המורל של החבר'ה — בלעדיו אין על מי לצחוק.`,
    `הרבה זמן לא ראינו קבלת החלטות כזאת גרועה — ילד בן 5 היה מחליט טוב יותר.`,
    `מופע של איש אחד — ${n} תרם לכולם. כולם מודים לו מעומק הלב.`,
    `${n} הפסיד -${amt.toFixed(0)}₪ ועדיין לא מבין למה. זה חלק מהקסם.`,
    `הקלפים של ${n} לא היו רעים — ההחלטות שלו כן.`,
    `${n} שיחק כאילו הוא יודע — אבל הכסף הבין אחרת.`,
    `כל ה"בלאף" של ${n} הלילה? גלוי. שקוף. כמו זכוכית.`,
    `${n} — הוכחה חיה שאופטימיות לבד לא מנצחת בפוקר.`,
    `נדיבות אמיתית: ${n} חילק את כספו לכולם בשמחה. ביודעין? פחות.`,
  ];

  // extra sting for dead last
  if (rank === total) {
    return pick([
      ...loserLines,
      `מקום אחרון. ${n} — ה-MVP של ההפסדים. הגביע לא מגיע בדואר אבל הביזיון כן.`,
      `${n} בא בגדול ויצא בקטן. -${amt.toFixed(0)}₪ ואין מילים. יש רק שקט.`,
      `-${amt.toFixed(0)}₪. ${n} לא ישן הלילה. הקלפים ישנו מעולה.`,
    ]);
  }

  return pick(loserLines);
}

// ── Main export ─────────────────────────────────────────────────────────────

export function computeRoast(players: RoastPlayerInput[]): RoastResult {
  if (players.length === 0) return { awards: [], playerCards: [] };

  // ── Awards ────────────────────────────────────────────────────────────────
  const awards: RoastAward[] = [];

  const rebuyKing = pickRebuyKing(players);
  if (rebuyKing) {
    awards.push({
      emoji: "🩸",
      title: "השבור הרשמי של הערב",
      recipientName: rebuyKing.name,
      subtitle: `${rebuyKing.rebuyCount} ריבאי — מישהו עצר אותו?`,
      color: "#ef4444",
    });
  }

  const fastest = pickFastestRebuy(players);
  if (fastest) {
    awards.push({
      emoji: "⚡",
      title: "ברק הריבאי",
      recipientName: fastest.player.name,
      subtitle: `ריבאי ראשון תוך ${fastest.minutes} דקות`,
      color: "#fbbf24",
    });
  }

  const loser = pickBiggestLoser(players);
  if (loser) {
    awards.push({
      emoji: "🪦",
      title: "תרומת הערב",
      recipientName: loser.name,
      subtitle: `${Math.abs(loser.profitLoss).toFixed(0)}₪ לרווחת הקבוצה`,
      color: "#94a3b8",
    });
  }

  const winner = pickBiggestWinner(players);
  if (winner) {
    awards.push({
      emoji: "🎯",
      title: "חד הערב",
      recipientName: winner.name,
      subtitle: `+${winner.profitLoss.toFixed(0)}₪ — ידע בדיוק מה הוא עושה`,
      color: "#10b981",
    });
  }

  const investor = pickBiggestInvestor(players);
  if (investor && (!winner || investor.userId !== winner.userId) && (!loser || investor.userId !== loser.userId)) {
    awards.push({
      emoji: "💸",
      title: "המשקיע הנועז",
      recipientName: investor.name,
      subtitle: `${investor.totalInvested.toFixed(0)}₪ בקופה — מחויבות אמיתית`,
      color: "#a78bfa",
    });
  }

  const rock = pickRock(players);
  if (rock) {
    awards.push({
      emoji: "🧊",
      title: "הסלע של הערב",
      recipientName: rock.name,
      subtitle: "buy-in אחד, אפס ריבאי — פסיכולוגיה של ברזל",
      color: "#38bdf8",
    });
  }

  const histSufferer = pickHistoricalSufferer(players);
  if (histSufferer && histSufferer.historicalSessions >= 3) {
    awards.push({
      emoji: "📉",
      title: "השבור ההיסטורי",
      recipientName: histSufferer.name,
      subtitle: `${histSufferer.historicalLosses}/${histSufferer.historicalSessions} ערבים בהפסד — נאמנות ראויה לציון`,
      color: "#f97316",
    });
  }

  const histKing = pickHistoricalKing(players);
  if (histKing && histKing.historicalSessions >= 3 && histKing.historicalWins > 0) {
    awards.push({
      emoji: "👑",
      title: "מלך הקבוצה",
      recipientName: histKing.name,
      subtitle: `${histKing.historicalWins}/${histKing.historicalSessions} ניצחונות — כולם מזמינים אותו שוב`,
      color: "#d4a017",
    });
  }

  // ── Per-player roast cards ────────────────────────────────────────────────
  const sortedByRank = [...players].sort((a, b) => b.profitLoss - a.profitLoss);

  const playerCards: PlayerRoastCard[] = players.map((p) => {
    const rank = sortedByRank.findIndex((s) => s.userId === p.userId) + 1;
    const lines: string[] = [];

    if (rebuyKing && p.userId === rebuyKing.userId) lines.push(...rebuyKingLines(p));
    if (fastest && p.userId === fastest.player.userId) lines.push(...fastestRebuyLines(p, fastest.minutes));
    if (loser && p.userId === loser.userId) lines.push(...biggestLoserLines(p));
    if (winner && p.userId === winner.userId) lines.push(...biggestWinnerLines(p));
    if (investor && p.userId === investor.userId && lines.length < 2) lines.push(...biggestInvestorLines(p));
    if (rock && p.userId === rock.userId) lines.push(...rockLines(p));
    if (histSufferer && p.userId === histSufferer.userId && p.historicalSessions >= 3) lines.push(...historicalSuffererLines(p));
    if (histKing && p.userId === histKing.userId && p.historicalSessions >= 3) lines.push(...historicalKingLines(p));

    // fallback
    if (lines.length === 0) lines.push(...genericLines(p));

    // pick max 3 funniest lines
    const finalLines = lines.slice(0, 3);

    // badge
    let badge = "";
    if (winner && p.userId === winner.userId) badge = "🎯 חד הערב";
    else if (loser && p.userId === loser.userId) badge = "🪦 תרומת הערב";
    else if (rebuyKing && p.userId === rebuyKing.userId) badge = "🩸 שבור רשמי";
    else if (fastest && p.userId === fastest.player.userId) badge = "⚡ ברק הריבאי";
    else if (rock && p.userId === rock.userId) badge = "🧊 הסלע";

    const trashTalk = generateTrashTalk(
      p,
      rank,
      players.length,
      rebuyKing?.userId ?? null,
      fastest?.player.userId ?? null,
    );

    return { userId: p.userId, name: p.name, profitLoss: p.profitLoss, lines: finalLines, badge, trashTalk };
  });

  return { awards, playerCards };
}
