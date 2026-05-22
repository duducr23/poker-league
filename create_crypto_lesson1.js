const pptxgen = require("C:/Users/user/AppData/Roaming/npm/node_modules/pptxgenjs");

const pres = new pptxgen();
pres.layout = 'LAYOUT_16x9';
pres.title = 'שיעור 1 - מבוא לקריפטו ולמסחר טכני';

// Colors
const BG_DARK = "0A0E1A";
const BG_CARD = "111827";
const BG_CARD2 = "1A2235";
const GOLD = "F7A800";
const GOLD_LIGHT = "FFD166";
const BLUE_ACCENT = "1E90FF";
const TEXT_WHITE = "FFFFFF";
const TEXT_GRAY = "A0AEC0";
const TEXT_LIGHT = "E2E8F0";
const BORDER_COLOR = "2D3748";

// ─────────────────────────────────────────────
// SLIDE 1 — Title
// ─────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: BG_DARK };

  // Top gold accent bar
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.07, fill: { color: GOLD }, line: { color: GOLD } });

  // Subtle grid lines (decorative)
  for (let i = 1; i < 5; i++) {
    s.addShape(pres.shapes.LINE, { x: i * 2, y: 0.07, w: 0, h: 5.555, line: { color: "1A2235", width: 1 } });
  }
  for (let i = 1; i < 4; i++) {
    s.addShape(pres.shapes.LINE, { x: 0, y: i * 1.4, w: 10, h: 0, line: { color: "1A2235", width: 1 } });
  }

  // Center glow circle
  s.addShape(pres.shapes.OVAL, { x: 3.5, y: 1.0, w: 3, h: 3, fill: { color: "1E3A5F", transparency: 60 }, line: { color: "1E3A5F" } });
  s.addShape(pres.shapes.OVAL, { x: 3.9, y: 1.4, w: 2.2, h: 2.2, fill: { color: GOLD, transparency: 85 }, line: { color: GOLD, transparency: 70 } });

  // Big ₿ symbol
  s.addText("₿", { x: 4.1, y: 1.3, w: 1.8, h: 1.8, fontSize: 72, color: GOLD, bold: true, align: "center", valign: "middle", margin: 0 });

  // Course label
  s.addText("קורס קריפטו ומסחר טכני", { x: 1, y: 3.5, w: 8, h: 0.4, fontSize: 14, color: TEXT_GRAY, align: "center", charSpacing: 3 });

  // Main title
  s.addText("מבוא לקריפטו", { x: 0.5, y: 3.9, w: 9, h: 0.75, fontSize: 42, color: TEXT_WHITE, bold: true, align: "center", fontFace: "Arial Black" });
  s.addText("ולמסחר טכני", { x: 0.5, y: 4.55, w: 9, h: 0.6, fontSize: 38, color: GOLD, bold: true, align: "center", fontFace: "Arial Black" });

  // Lesson tag
  s.addShape(pres.shapes.RECTANGLE, { x: 4.2, y: 5.0, w: 1.6, h: 0.35, fill: { color: GOLD }, line: { color: GOLD } });
  s.addText("שיעור מספר 1", { x: 4.2, y: 5.0, w: 1.6, h: 0.35, fontSize: 11, color: "000000", bold: true, align: "center", valign: "middle", margin: 0 });

  // Bottom gold bar
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 5.555, w: 10, h: 0.07, fill: { color: GOLD }, line: { color: GOLD } });
}

// ─────────────────────────────────────────────
// SLIDE 2 — מה זה קריפטו ואיך הוא בנוי
// ─────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: BG_DARK };

  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.07, fill: { color: GOLD }, line: { color: GOLD } });
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 5.555, w: 10, h: 0.07, fill: { color: GOLD }, line: { color: GOLD } });

  // Left gold accent
  s.addShape(pres.shapes.RECTANGLE, { x: 0.35, y: 0.25, w: 0.07, h: 0.65, fill: { color: GOLD }, line: { color: GOLD } });
  s.addText("מה זה קריפטו ואיך הוא בנוי?", { x: 0.5, y: 0.25, w: 9, h: 0.65, fontSize: 28, color: TEXT_WHITE, bold: true, align: "right", valign: "middle", fontFace: "Arial Black", margin: 0 });

  // Divider
  s.addShape(pres.shapes.LINE, { x: 0.35, y: 1.0, w: 9.3, h: 0, line: { color: BORDER_COLOR, width: 1 } });

  // Cards - 2x2 grid
  const cards = [
    { x: 0.3, y: 1.15, emoji: "🔗", title: "בלוקצ'יין", text: "רשת מבוזרת של בלוקים הקשורים זה לזה.\nאין גורם מרכזי שולט — כולם שומרים עותק.\nשקוף, מאובטח, בלתי ניתן לשינוי." },
    { x: 5.2, y: 1.15, emoji: "💎", title: "ביטקוין ואלטקוינים", text: "ביטקוין (BTC) — המטבע הראשון והמוביל.\nAltcoins — מטבעות חלופיים (ETH, SOL...).\nכל מטבע עם שימוש ומטרה ייחודית." },
    { x: 0.3, y: 3.1, emoji: "🌐", title: "כסף דיגיטלי", text: "לא מודפס ולא נשלט ע\"י בנקים מרכזיים.\nניתן לשלוח לכל מקום בעולם תוך שניות.\nניהול עצמי: המפתח הפרטי = הכסף שלך." },
    { x: 5.2, y: 3.1, emoji: "⛏️", title: "כרייה ואימות", text: "Miners מאמתים עסקאות ומקבלים תגמול.\nProof of Work / Proof of Stake.\nרשת מאובטחת ע\"י כוח חישוב גלובלי." },
  ];

  cards.forEach(c => {
    s.addShape(pres.shapes.RECTANGLE, { x: c.x, y: c.y, w: 4.5, h: 1.8, fill: { color: BG_CARD2 }, line: { color: BORDER_COLOR, width: 1 } });
    s.addShape(pres.shapes.RECTANGLE, { x: c.x, y: c.y, w: 0.06, h: 1.8, fill: { color: GOLD }, line: { color: GOLD } });

    s.addText(c.emoji + " " + c.title, { x: c.x + 0.15, y: c.y + 0.12, w: 4.2, h: 0.4, fontSize: 15, color: GOLD_LIGHT, bold: true, align: "right", margin: 0 });
    s.addText(c.text, { x: c.x + 0.15, y: c.y + 0.55, w: 4.2, h: 1.15, fontSize: 11.5, color: TEXT_LIGHT, align: "right", valign: "top", margin: 0 });
  });
}

// ─────────────────────────────────────────────
// SLIDE 3 — כמות מוגבלת
// ─────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: BG_DARK };

  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.07, fill: { color: GOLD }, line: { color: GOLD } });
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 5.555, w: 10, h: 0.07, fill: { color: GOLD }, line: { color: GOLD } });

  s.addShape(pres.shapes.RECTANGLE, { x: 0.35, y: 0.25, w: 0.07, h: 0.65, fill: { color: GOLD }, line: { color: GOLD } });
  s.addText("כמות מוגבלת — למה זה משנה?", { x: 0.5, y: 0.25, w: 9, h: 0.65, fontSize: 28, color: TEXT_WHITE, bold: true, align: "right", valign: "middle", fontFace: "Arial Black", margin: 0 });
  s.addShape(pres.shapes.LINE, { x: 0.35, y: 1.0, w: 9.3, h: 0, line: { color: BORDER_COLOR, width: 1 } });

  // Big stat
  s.addShape(pres.shapes.RECTANGLE, { x: 0.3, y: 1.1, w: 9.4, h: 1.1, fill: { color: BG_CARD2 }, line: { color: GOLD, width: 1 } });
  s.addText("21,000,000", { x: 0.5, y: 1.15, w: 4.5, h: 1.0, fontSize: 48, color: GOLD, bold: true, align: "center", valign: "middle", fontFace: "Arial Black", margin: 0 });
  s.addText("סך כל הביטקוין שיהיו אי פעם —\nלא ניתן לשנות, לא ניתן להדפיס יותר", { x: 5.0, y: 1.15, w: 4.5, h: 1.0, fontSize: 15, color: TEXT_LIGHT, align: "right", valign: "middle", margin: 0 });

  // 3 info blocks
  const blocks = [
    { x: 0.3, label: "HALVING", emoji: "✂️", text: "כל ~4 שנים פרס הכרייה מתחצה.\n2009: 50 BTC → 2024: 3.125 BTC.\nהיצע קטן = לחץ כלפי מעלה על המחיר." },
    { x: 3.5, label: "SUPPLY & DEMAND", emoji: "⚖️", text: "ביקוש גדל + היצע קבוע = עלייה.\nכמו זהב דיגיטלי — נדיר באופן מוגדר.\nמשפיע ישירות על ערך המטבע." },
    { x: 6.7, label: "SCARCITY VALUE", emoji: "💰", text: "נדירות = ערך (כמו יהלומים, זהב).\nרק ~19.7M BTC כרויים כיום.\nהאחרון יכרה ב-2140 בערך." },
  ];

  blocks.forEach(b => {
    s.addShape(pres.shapes.RECTANGLE, { x: b.x, y: 2.4, w: 3.0, h: 2.95, fill: { color: BG_CARD }, line: { color: BORDER_COLOR, width: 1 } });
    s.addShape(pres.shapes.RECTANGLE, { x: b.x, y: 2.4, w: 3.0, h: 0.42, fill: { color: GOLD }, line: { color: GOLD } });
    s.addText(b.emoji + " " + b.label, { x: b.x + 0.1, y: 2.4, w: 2.8, h: 0.42, fontSize: 13, color: "000000", bold: true, align: "center", valign: "middle", margin: 0 });
    s.addText(b.text, { x: b.x + 0.15, y: 2.87, w: 2.7, h: 2.45, fontSize: 11.5, color: TEXT_LIGHT, align: "right", valign: "top", margin: 0 });
  });
}

// ─────────────────────────────────────────────
// SLIDE 4 — מארקט קאפ וקורלציות
// ─────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: BG_DARK };

  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.07, fill: { color: GOLD }, line: { color: GOLD } });
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 5.555, w: 10, h: 0.07, fill: { color: GOLD }, line: { color: GOLD } });

  s.addShape(pres.shapes.RECTANGLE, { x: 0.35, y: 0.25, w: 0.07, h: 0.65, fill: { color: GOLD }, line: { color: GOLD } });
  s.addText("מארקט קאפ וקורלציות עם עולם המניות", { x: 0.5, y: 0.25, w: 9, h: 0.65, fontSize: 24, color: TEXT_WHITE, bold: true, align: "right", valign: "middle", fontFace: "Arial Black", margin: 0 });
  s.addShape(pres.shapes.LINE, { x: 0.35, y: 1.0, w: 9.3, h: 0, line: { color: BORDER_COLOR, width: 1 } });

  // Left column - Market Cap
  s.addShape(pres.shapes.RECTANGLE, { x: 0.3, y: 1.1, w: 4.5, h: 4.3, fill: { color: BG_CARD }, line: { color: BORDER_COLOR, width: 1 } });
  s.addShape(pres.shapes.RECTANGLE, { x: 0.3, y: 1.1, w: 4.5, h: 0.45, fill: { color: "1E3A5F" }, line: { color: "1E3A5F" } });
  s.addText("📊 Market Cap — שווי שוק", { x: 0.4, y: 1.1, w: 4.3, h: 0.45, fontSize: 14, color: GOLD, bold: true, align: "right", valign: "middle", margin: 0 });

  s.addText([
    { text: "נוסחה: ", options: { bold: true, color: GOLD_LIGHT, breakLine: false } },
    { text: "מחיר × היצע במחזור\n\n", options: { color: TEXT_LIGHT, breakLine: true } },
    { text: "BTC: ", options: { bold: true, color: GOLD_LIGHT, breakLine: false } },
    { text: "~$1.5 טריליון\n", options: { color: TEXT_LIGHT, breakLine: true } },
    { text: "ETH: ", options: { bold: true, color: GOLD_LIGHT, breakLine: false } },
    { text: "~$400 מיליארד\n\n", options: { color: TEXT_LIGHT, breakLine: true } },
    { text: "Large Cap:", options: { bold: true, color: GOLD_LIGHT, breakLine: true } },
    { text: "BTC, ETH — יציב יחסית\n", options: { color: TEXT_LIGHT, breakLine: true } },
    { text: "Mid Cap:", options: { bold: true, color: GOLD_LIGHT, breakLine: true } },
    { text: "SOL, BNB — סיכון בינוני\n", options: { color: TEXT_LIGHT, breakLine: true } },
    { text: "Small Cap:", options: { bold: true, color: GOLD_LIGHT, breakLine: true } },
    { text: "מטבעות קטנים — גבוה/נמוך", options: { color: TEXT_LIGHT } },
  ], { x: 0.4, y: 1.65, w: 4.3, h: 3.65, fontSize: 12.5, align: "right", valign: "top", margin: 0 });

  // Right column - Correlations
  s.addShape(pres.shapes.RECTANGLE, { x: 5.2, y: 1.1, w: 4.5, h: 4.3, fill: { color: BG_CARD }, line: { color: BORDER_COLOR, width: 1 } });
  s.addShape(pres.shapes.RECTANGLE, { x: 5.2, y: 1.1, w: 4.5, h: 0.45, fill: { color: "1E3A5F" }, line: { color: "1E3A5F" } });
  s.addText("🔗 קורלציות עם עולם המניות", { x: 5.3, y: 1.1, w: 4.3, h: 0.45, fontSize: 14, color: GOLD, bold: true, align: "right", valign: "middle", margin: 0 });

  const corrs = [
    { icon: "📈", text: "S&P 500 עולה → קריפטו בד\"כ עולה" },
    { icon: "😨", text: "Fear Index גבוה → שווקים יורדים" },
    { icon: "💵", text: "דולר חזק → לחץ על BTC" },
    { icon: "📉", text: "ריביות עולות → כסף יוצא מנכסי סיכון" },
    { icon: "🏦", text: "FED מדפיס → קריפטו לרוב עולה" },
    { icon: "⚡", text: "BTC מוביל → אלטקוינים עוקבים" },
  ];

  corrs.forEach((c, i) => {
    const yPos = 1.68 + i * 0.6;
    s.addShape(pres.shapes.RECTANGLE, { x: 5.3, y: yPos, w: 4.2, h: 0.48, fill: { color: BG_CARD2 }, line: { color: BORDER_COLOR, width: 1 } });
    s.addText(c.icon + " " + c.text, { x: 5.4, y: yPos, w: 4.1, h: 0.48, fontSize: 12, color: TEXT_LIGHT, align: "right", valign: "middle", margin: 0 });
  });
}

// ─────────────────────────────────────────────
// SLIDE 5 — איך הקריפטו נתפס ומי מזיז שווקים
// ─────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: BG_DARK };

  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.07, fill: { color: GOLD }, line: { color: GOLD } });
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 5.555, w: 10, h: 0.07, fill: { color: GOLD }, line: { color: GOLD } });

  s.addShape(pres.shapes.RECTANGLE, { x: 0.35, y: 0.25, w: 0.07, h: 0.65, fill: { color: GOLD }, line: { color: GOLD } });
  s.addText("איך הקריפטו נתפס ומי מזיז את השווקים", { x: 0.5, y: 0.25, w: 9, h: 0.65, fontSize: 24, color: TEXT_WHITE, bold: true, align: "right", valign: "middle", fontFace: "Arial Black", margin: 0 });
  s.addShape(pres.shapes.LINE, { x: 0.35, y: 1.0, w: 9.3, h: 0, line: { color: BORDER_COLOR, width: 1 } });

  // Top row - perception
  s.addText("🌍 כיצד הקריפטו נתפס בעולם", { x: 0.5, y: 1.05, w: 9, h: 0.4, fontSize: 16, color: GOLD_LIGHT, bold: true, align: "right", margin: 0 });

  const perceptions = [
    { x: 0.3, color: "1A4731", border: "2ECC71", icon: "✅", title: "תומכים", text: "נכס ערך עולמי\nחופש פיננסי\nטכנולוגיה מהפכנית" },
    { x: 3.5, color: "1A2F4A", border: "3498DB", icon: "🏛️", title: "מוסדות", text: "ETF ביטקוין אושר\nBTC כרזרבה אסטרטגית\nמיינסטרים פיננסי" },
    { x: 6.7, color: "4A1A1A", border: "E74C3C", icon: "⚠️", title: "ספקנים", text: "תנודתיות גבוהה\nחשש רגולטורי\nשימוש לרע" },
  ];

  perceptions.forEach(p => {
    s.addShape(pres.shapes.RECTANGLE, { x: p.x, y: 1.5, w: 3.0, h: 1.4, fill: { color: p.color }, line: { color: p.border, width: 1.5 } });
    s.addText(p.icon + " " + p.title, { x: p.x + 0.1, y: 1.55, w: 2.8, h: 0.38, fontSize: 14, color: TEXT_WHITE, bold: true, align: "right", margin: 0 });
    s.addText(p.text, { x: p.x + 0.1, y: 1.95, w: 2.8, h: 0.9, fontSize: 11.5, color: TEXT_LIGHT, align: "right", valign: "top", margin: 0 });
  });

  // Bottom row - who moves markets
  s.addText("🐋 מי מזיז את השווקים?", { x: 0.5, y: 3.05, w: 9, h: 0.4, fontSize: 16, color: GOLD_LIGHT, bold: true, align: "right", margin: 0 });

  const movers = [
    { x: 0.3, icon: "🐳", title: "ויילים (Whales)", text: "מחזיקי BTC גדולים.\nמכירה/קנייה גדולה = מהלך חד." },
    { x: 2.68, icon: "🏦", title: "מוסדות", text: "BlackRock, Fidelity.\nכניסה/יציאה מהירה של מיליארדים." },
    { x: 5.05, icon: "📰", title: "חדשות ורגולציה", text: "אישור ETF = עלייה.\nאיסור מדינתי = נפילה." },
    { x: 7.42, icon: "😱", title: "פחד ותאווה", text: "Fear & Greed Index.\nפאניקה → מכירה המונית." },
  ];

  movers.forEach(m => {
    s.addShape(pres.shapes.RECTANGLE, { x: m.x, y: 3.5, w: 2.2, h: 1.85, fill: { color: BG_CARD2 }, line: { color: BORDER_COLOR, width: 1 } });
    s.addShape(pres.shapes.RECTANGLE, { x: m.x, y: 3.5, w: 2.2, h: 0.42, fill: { color: "1E3A5F" }, line: { color: "1E3A5F" } });
    s.addText(m.icon, { x: m.x, y: 3.5, w: 0.5, h: 0.42, fontSize: 18, align: "center", valign: "middle", margin: 0 });
    s.addText(m.title, { x: m.x + 0.45, y: 3.5, w: 1.65, h: 0.42, fontSize: 11, color: GOLD, bold: true, align: "right", valign: "middle", margin: 0 });
    s.addText(m.text, { x: m.x + 0.1, y: 3.97, w: 2.0, h: 1.3, fontSize: 11, color: TEXT_LIGHT, align: "right", valign: "top", margin: 0 });
  });
}

// ─────────────────────────────────────────────
// SLIDE 6 — מסחר טכני - מה נלמד
// ─────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: BG_DARK };

  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.07, fill: { color: GOLD }, line: { color: GOLD } });
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 5.555, w: 10, h: 0.07, fill: { color: GOLD }, line: { color: GOLD } });

  s.addShape(pres.shapes.RECTANGLE, { x: 0.35, y: 0.25, w: 0.07, h: 0.65, fill: { color: GOLD }, line: { color: GOLD } });
  s.addText("מסחר טכני — מה נלמד בקורס?", { x: 0.5, y: 0.25, w: 9, h: 0.65, fontSize: 28, color: TEXT_WHITE, bold: true, align: "right", valign: "middle", fontFace: "Arial Black", margin: 0 });
  s.addShape(pres.shapes.LINE, { x: 0.35, y: 1.0, w: 9.3, h: 0, line: { color: BORDER_COLOR, width: 1 } });

  // Roadmap items
  const steps = [
    { num: "01", title: "יסודות הגרף", text: "קריאת נרות יפניים, תמיכה והתנגדות, טרנדים" },
    { num: "02", title: "אינדיקטורים", text: "RSI, MACD, EMA, Volume — קריאה ושימוש נכון" },
    { num: "03", title: "פרייס אקשן", text: "דפוסי נרות, Breakout, Reversal, Consolidation" },
    { num: "04", title: "ניהול סיכונים", text: "Stop Loss, Take Profit, גודל פוזיציה, R:R Ratio" },
    { num: "05", title: "נזילות ומבנה שוק", text: "Order Flow, Liquidity Pools, Smart Money Concepts" },
    { num: "06", title: "אסטרטגיית מסחר", text: "בניית ועדכון תוכנית מסחר אישית מנצחת" },
  ];

  steps.forEach((step, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = col === 0 ? 5.2 : 0.3;
    const y = 1.12 + row * 1.45;

    s.addShape(pres.shapes.RECTANGLE, { x, y, w: 4.5, h: 1.28, fill: { color: BG_CARD2 }, line: { color: BORDER_COLOR, width: 1 } });

    // Number badge
    s.addShape(pres.shapes.RECTANGLE, { x: x + 3.9, y, w: 0.6, h: 1.28, fill: { color: GOLD }, line: { color: GOLD } });
    s.addText(step.num, { x: x + 3.9, y, w: 0.6, h: 1.28, fontSize: 18, color: "000000", bold: true, align: "center", valign: "middle", fontFace: "Arial Black", margin: 0 });

    s.addText(step.title, { x: x + 0.15, y: y + 0.1, w: 3.65, h: 0.42, fontSize: 14, color: GOLD_LIGHT, bold: true, align: "right", margin: 0 });
    s.addText(step.text, { x: x + 0.15, y: y + 0.55, w: 3.65, h: 0.65, fontSize: 11.5, color: TEXT_LIGHT, align: "right", valign: "top", margin: 0 });
  });
}

// ─────────────────────────────────────────────
// SLIDE 7 — כלי עבודה
// ─────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: BG_DARK };

  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.07, fill: { color: GOLD }, line: { color: GOLD } });
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 5.555, w: 10, h: 0.07, fill: { color: GOLD }, line: { color: GOLD } });

  s.addShape(pres.shapes.RECTANGLE, { x: 0.35, y: 0.25, w: 0.07, h: 0.65, fill: { color: GOLD }, line: { color: GOLD } });
  s.addText("כלי עבודה — TradingView & TradingLite", { x: 0.5, y: 0.25, w: 9, h: 0.65, fontSize: 26, color: TEXT_WHITE, bold: true, align: "right", valign: "middle", fontFace: "Arial Black", margin: 0 });
  s.addShape(pres.shapes.LINE, { x: 0.35, y: 1.0, w: 9.3, h: 0, line: { color: BORDER_COLOR, width: 1 } });

  // TradingView card
  s.addShape(pres.shapes.RECTANGLE, { x: 0.3, y: 1.1, w: 4.5, h: 4.3, fill: { color: BG_CARD }, line: { color: "2196F3", width: 1.5 } });
  s.addShape(pres.shapes.RECTANGLE, { x: 0.3, y: 1.1, w: 4.5, h: 0.55, fill: { color: "2196F3" }, line: { color: "2196F3" } });
  s.addText("📊 TradingView", { x: 0.4, y: 1.1, w: 4.3, h: 0.55, fontSize: 18, color: TEXT_WHITE, bold: true, align: "right", valign: "middle", margin: 0 });

  s.addText([
    { text: "הפלטפורמה הפופולרית ביותר לניתוח\nטכני בעולם הקריפטו\n\n", options: { color: TEXT_GRAY, breakLine: false } },
    { text: "✔ ", options: { color: "2ECC71", bold: true, breakLine: false } },
    { text: "גרפים מתקדמים לכל טיים-פריים\n", options: { color: TEXT_LIGHT, breakLine: true } },
    { text: "✔ ", options: { color: "2ECC71", bold: true, breakLine: false } },
    { text: "אינדיקטורים מובנים ומותאמים אישית\n", options: { color: TEXT_LIGHT, breakLine: true } },
    { text: "✔ ", options: { color: "2ECC71", bold: true, breakLine: false } },
    { text: "התראות Price Alerts בזמן אמת\n", options: { color: TEXT_LIGHT, breakLine: true } },
    { text: "✔ ", options: { color: "2ECC71", bold: true, breakLine: false } },
    { text: "סקריפטים Pine Script מתקדמים\n", options: { color: TEXT_LIGHT, breakLine: true } },
    { text: "✔ ", options: { color: "2ECC71", bold: true, breakLine: false } },
    { text: "Paper Trading לתרגול ללא סיכון\n", options: { color: TEXT_LIGHT, breakLine: true } },
    { text: "✔ ", options: { color: "2ECC71", bold: true, breakLine: false } },
    { text: "גרסה חינמית ומנוי Pro", options: { color: TEXT_LIGHT } },
  ], { x: 0.4, y: 1.75, w: 4.2, h: 3.55, fontSize: 12, align: "right", valign: "top", margin: 0 });

  // TradingLite card
  s.addShape(pres.shapes.RECTANGLE, { x: 5.2, y: 1.1, w: 4.5, h: 4.3, fill: { color: BG_CARD }, line: { color: GOLD, width: 1.5 } });
  s.addShape(pres.shapes.RECTANGLE, { x: 5.2, y: 1.1, w: 4.5, h: 0.55, fill: { color: "D4890A" }, line: { color: "D4890A" } });
  s.addText("💧 TradingLite — נזילות", { x: 5.3, y: 1.1, w: 4.3, h: 0.55, fontSize: 18, color: TEXT_WHITE, bold: true, align: "right", valign: "middle", margin: 0 });

  s.addText([
    { text: "כלי מתקדם לניתוח Order Flow\nונזילות בשווקי קריפטו\n\n", options: { color: TEXT_GRAY, breakLine: false } },
    { text: "✔ ", options: { color: GOLD, bold: true, breakLine: false } },
    { text: "Heatmap — מפת חום של ה-Orderbook\n", options: { color: TEXT_LIGHT, breakLine: true } },
    { text: "✔ ", options: { color: GOLD, bold: true, breakLine: false } },
    { text: "Liquidation Levels — רמות חיסול\n", options: { color: TEXT_LIGHT, breakLine: true } },
    { text: "✔ ", options: { color: GOLD, bold: true, breakLine: false } },
    { text: "Delta Volume — קנייה מול מכירה\n", options: { color: TEXT_LIGHT, breakLine: true } },
    { text: "✔ ", options: { color: GOLD, bold: true, breakLine: false } },
    { text: "Spoofing & Large Orders גילוי\n", options: { color: TEXT_LIGHT, breakLine: true } },
    { text: "✔ ", options: { color: GOLD, bold: true, breakLine: false } },
    { text: "מראה \"איפה הכסף החכם\" נמצא\n", options: { color: TEXT_LIGHT, breakLine: true } },
    { text: "→ ", options: { color: GOLD, bold: true, breakLine: false } },
    { text: "משמש יחד עם TradingView", options: { color: GOLD_LIGHT, bold: true } },
  ], { x: 5.3, y: 1.75, w: 4.2, h: 3.55, fontSize: 12, align: "right", valign: "top", margin: 0 });
}

// Save
const outputPath = "שיעור_1_מבוא_לקריפטו.pptx";
pres.writeFile({ fileName: outputPath }).then(() => {
  console.log("✅ Saved:", outputPath);
}).catch(err => {
  console.error("❌ Error:", err);
});
