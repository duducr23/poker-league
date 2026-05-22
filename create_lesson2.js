const pptxgen = require("C:/Users/user/AppData/Roaming/npm/node_modules/pptxgenjs");
const prs = new pptxgen();
prs.layout = 'LAYOUT_16x9';
prs.title = 'שיעור 2 — נרות יפניים';

// ── Palette ──────────────────────────────────
const BG="0A0E1A", CARD="111827", CARD2="1A2235";
const GOLD="F7A800", GOLD2="FFD166";
const GRN="00C851", GRN_D="1A4731";
const RED="E74C3C", RED_D="4A1A1A";
const WH="FFFFFF", GR="A0AEC0", LT="E2E8F0";
const BD="2D3748";

// ── RTL text helper: adds rtlMode + align right by default ──
// All text is called through t() to enforce RTL
const t = (s, text, opts) =>
  s.addText(text, { rtlMode: true, align: "right", ...opts });

// ── Shared helpers ────────────────────────────
const bars = s => {
  s.addShape(prs.shapes.RECTANGLE,{x:0,y:0,w:10,h:0.07,fill:{color:GOLD},line:{color:GOLD}});
  s.addShape(prs.shapes.RECTANGLE,{x:0,y:5.555,w:10,h:0.07,fill:{color:GOLD},line:{color:GOLD}});
};
const hdr = (s, txt, sz=22) => {
  bars(s);
  s.addShape(prs.shapes.RECTANGLE,{x:0.35,y:0.25,w:0.07,h:0.65,fill:{color:GOLD},line:{color:GOLD}});
  t(s, txt, {x:0.5,y:0.25,w:9,h:0.65,fontSize:sz,color:WH,bold:true,valign:"middle",fontFace:"Arial Black",margin:0});
  s.addShape(prs.shapes.LINE,{x:0.35,y:1.0,w:9.3,h:0,line:{color:BD,width:1}});
};

// Draw a single candle
const mk = (s,cx,ty,opts) => {
  const {c,uw=0,bh=0.28,lw=0,bw=0.16} = opts;
  if(uw>0) s.addShape(prs.shapes.LINE,{x:cx,y:ty,w:0,h:uw,line:{color:c,width:1.5}});
  s.addShape(prs.shapes.RECTANGLE,{x:cx-bw/2,y:ty+uw,w:bw,h:bh,fill:{color:c},line:{color:"000000",width:0.3}});
  if(lw>0) s.addShape(prs.shapes.LINE,{x:cx,y:ty+uw+bh,w:0,h:lw,line:{color:c,width:1.5}});
};

// 2×2 pattern card
const card4 = (s, x, y, name, signal, desc, sigColor, sigBg, candles, accent) => {
  const W=4.5, H=1.95;
  s.addShape(prs.shapes.RECTANGLE,{x,y,w:W,h:H,fill:{color:CARD2},line:{color:sigBg,width:1}});
  s.addShape(prs.shapes.RECTANGLE,{x,y,w:0.95,h:H,fill:{color:CARD},line:{color:BD,width:0}});
  s.addShape(prs.shapes.LINE,{x:x+0.95,y,w:0,h:H,line:{color:sigBg,width:1}});
  s.addShape(prs.shapes.RECTANGLE,{x:x+0.95,y,w:W-0.95,h:0.05,fill:{color:accent},line:{color:accent}});
  const n=candles.length, spacing=n===1?0:(0.7/(n-1)), startCX=n===1?x+0.475:x+0.18;
  candles.forEach((cd,i)=>mk(s, startCX+i*spacing, y+0.12, cd));
  t(s, name,   {x:x+1.05,y:y+0.08,w:3.35,h:0.35,fontSize:12,color:GOLD2,bold:true,valign:"top",margin:0});
  s.addShape(prs.shapes.RECTANGLE,{x:x+3.12,y:y+0.46,w:1.28,h:0.26,fill:{color:sigBg},line:{color:sigColor,width:0.5}});
  t(s, signal, {x:x+3.12,y:y+0.46,w:1.28,h:0.26,fontSize:8,color:sigColor,bold:true,align:"center",valign:"middle",margin:0});
  t(s, desc,   {x:x+1.05,y:y+0.78,w:3.35,h:1.1, fontSize:10.5,color:LT,valign:"top",margin:0});
};

// Full-width horizontal card
const cardH = (s, y, name, signal, desc, sigColor, sigBg, candles, accent) => {
  const W=9.4, H=1.35;
  s.addShape(prs.shapes.RECTANGLE,{x:0.3,y,w:W,h:H,fill:{color:CARD2},line:{color:sigBg,width:1}});
  s.addShape(prs.shapes.RECTANGLE,{x:0.3,y,w:1.5,h:H,fill:{color:CARD},line:{color:BD,width:0}});
  s.addShape(prs.shapes.LINE,{x:1.8,y,w:0,h:H,line:{color:sigBg,width:1}});
  s.addShape(prs.shapes.RECTANGLE,{x:1.8,y,w:W-1.5,h:0.05,fill:{color:accent},line:{color:accent}});
  const n=candles.length, spacing=n<=1?0:(1.1/(n-1)), startCX=n===1?1.05:0.55;
  candles.forEach((cd,i)=>mk(s, startCX+i*spacing, y+0.1, cd));
  t(s, name,   {x:1.9,y:y+0.08,w:7.7, h:0.35,fontSize:13,color:GOLD2,bold:true,valign:"top",margin:0});
  s.addShape(prs.shapes.RECTANGLE,{x:7.9,y:y+0.48,w:1.65,h:0.28,fill:{color:sigBg},line:{color:sigColor,width:0.5}});
  t(s, signal, {x:7.9,y:y+0.48,w:1.65,h:0.28,fontSize:9,color:sigColor,bold:true,align:"center",valign:"middle",margin:0});
  t(s, desc,   {x:1.9,y:y+0.5, w:5.8, h:0.78,fontSize:11,color:LT,valign:"top",margin:0});
};

// ─────────────────────────────────────────────
// SLIDE 1: Title
// ─────────────────────────────────────────────
{
  const s = prs.addSlide();
  s.background={color:BG};
  bars(s);
  // Decorative dim candles
  mk(s,1.2,0.5,{c:"1A3A1A",uw:0.3,bh:2.8,lw:0.4,bw:0.55});
  mk(s,2.0,0.3,{c:"3A1A1A",uw:0.5,bh:3.5,lw:0.3,bw:0.55});
  mk(s,7.8,0.7,{c:"1A3A1A",uw:0.08,bh:0.45,lw:2.5,bw:0.5});
  mk(s,8.6,0.5,{c:"3A1A1A",uw:2.2, bh:0.45,lw:0.08,bw:0.5});

  t(s,"קורס קריפטו ומסחר טכני",{x:1,y:1.6,w:8,h:0.4,fontSize:13,color:GR,align:"center",charSpacing:3});
  t(s,"נרות יפניים",             {x:0.5,y:2.0,w:9,h:0.85,fontSize:52,color:WH,bold:true,align:"center",fontFace:"Arial Black"});
  // English title — kept separate, LTR is fine here
  s.addText("Price Action Mastery",{x:0.5,y:2.82,w:9,h:0.65,fontSize:36,color:GOLD,bold:true,align:"center",fontFace:"Arial Black"});
  t(s,"ניתוח דפוסי נרות עולים ויורדים לקבלת החלטות מסחר מדויקות",
    {x:1,y:3.55,w:8,h:0.4,fontSize:13,color:GR,align:"center"});

  const badges=[
    {x:1.4,t:"11 דפוסים עולים", tc:GRN, bc:GRN_D},
    {x:3.9,t:"10 דפוסים יורדים",tc:RED, bc:RED_D},
    {x:6.4,t:"שיעור מספר 2",    tc:GOLD2,bc:"1E3A5F"},
  ];
  badges.forEach(b=>{
    s.addShape(prs.shapes.RECTANGLE,{x:b.x,y:4.15,w:2.3,h:0.38,fill:{color:b.bc},line:{color:b.tc,width:1}});
    t(s,b.t,{x:b.x,y:4.15,w:2.3,h:0.38,fontSize:12,color:b.tc,bold:true,align:"center",valign:"middle",margin:0});
  });
}

// ─────────────────────────────────────────────
// SLIDE 2: למה Price Action חשוב?
// ─────────────────────────────────────────────
{
  const s = prs.addSlide();
  s.background={color:BG};
  hdr(s,"למה ניתוח נרות יפניים חשוב למסחר?",21);

  // NOTE: descriptions are pure Hebrew — no inline English — to avoid BiDi jump
  const items=[
    {ic:"📊",t:"ויזואליזציה של סנטימנט השוק",
     d:"הנרות מראים בצורה ויזואלית את הלחץ בין קונים למוכרים — פחד, תאווה, היסוס — בכל מסגרת זמן."},
    {ic:"📈",t:"זיהוי טרנדים והיפוכים",
     d:"דפוסי נרות מסוימים מצביעים על שינוי כיוון מגמה לפני שהוא קורה — יתרון משמעותי על פני האינדיקטורים."},
    {ic:"⏱️",t:"תזמון כניסות ויציאות",
     d:"דפוסים ספציפיים מספקים אות כניסה מדויק לעסקה — הגדלת הדיוק ומיקסום הרווח הפוטנציאלי."},
    {ic:"🎯",t:"אישור תמיכה והתנגדות",
     d:"נר פטיש על רמת תמיכה = אישור חזק. נר כוכב ירי על התנגדות = אות מכירה ברור."},
    {ic:"🛡️",t:"ניהול סיכונים נכון",
     d:"הדפוסים עוזרים לקבוע עצירת הפסד מדויקת ולהגדיר יחס סיכון-תשואה אופטימלי לכל עסקה."},
    {ic:"🧩",t:"בסיס לאסטרטגיות מסחר",
     d:"רוב האסטרטגיות הפופולריות מבוססות על שילוב חכם של דפוסי נרות עם רמות מפתח בגרף."},
    {ic:"🔄",t:"עובד בכל מסגרת זמן",
     d:"מגרף של דקה אחת ועד גרף חודשי — אותם דפוסים, אותה שפה, אותה אמינות."},
    {ic:"🚫",t:"סינון רעשי שוק",
     d:"מיקוד על תנועת המחיר האמיתית — ולא על אינדיקטורים מורכבים שמגיעים תמיד באיחור."},
  ];

  items.forEach((it,i)=>{
    const col=i%2, row=Math.floor(i/2);
    const x=col===0?5.2:0.3, y=1.12+row*1.12;
    s.addShape(prs.shapes.RECTANGLE,{x,y,w:4.5,h:1.0,fill:{color:CARD2},line:{color:BD,width:1}});
    s.addShape(prs.shapes.RECTANGLE,{x,y,w:0.72,h:1.0,fill:{color:CARD},line:{color:BD,width:0}});
    s.addShape(prs.shapes.LINE,{x:x+0.72,y,w:0,h:1.0,line:{color:BD,width:1}});
    s.addText(it.ic,{x,y,w:0.72,h:1.0,fontSize:22,align:"center",valign:"middle",margin:0});
    t(s,it.t,{x:x+0.8,y:y+0.08,w:3.55,h:0.36,fontSize:13,color:GOLD2,bold:true,valign:"top",margin:0});
    t(s,it.d,{x:x+0.8,y:y+0.46,w:3.55,h:0.48,fontSize:10.5,color:LT,valign:"top",margin:0});
  });
}

// ─────────────────────────────────────────────
// SLIDE 3: Bullish Single Candle
// ─────────────────────────────────────────────
{
  const s = prs.addSlide();
  s.background={color:BG};
  hdr(s,"דפוסי נרות בודדים עולים — היפוך עולה",20);

  // All descriptions: pure Hebrew, no inline English
  card4(s,5.2,1.1,
    "Hammer — פטיש",
    "היפוך עולה | אחרי ירידה",
    "גוף קטן בחלק העליון. צל תחתון ארוך פי שניים-שלושה מהגוף. כמעט אין צל עליון. מופיע אחרי מגמת ירידה — מצביע על לחץ קנייה חזק.",
    GRN,GRN_D,[{c:GRN,uw:0.04,bh:0.22,lw:0.85,bw:0.16}],GRN);

  card4(s,0.3,1.1,
    "Inverted Hammer — פטיש הפוך",
    "היפוך עולה | אחרי ירידה",
    "גוף קטן בחלק התחתון. צל עליון ארוך. מופיע אחרי מגמת ירידה — ניסיון של הקונים להוביל את השוק מעלה.",
    GRN,GRN_D,[{c:GRN,uw:0.85,bh:0.22,lw:0.04,bw:0.16}],GRN);

  card4(s,5.2,3.15,
    "Spinning Top — ספינינג טופ עולה",
    "היסוס | פוטנציאל עולה",
    "גוף קטן באמצע. צלליות מעל ומתחת לגוף. שוק מהסס — אחרי מגמת ירידה מצביע על היחלשות המוכרים.",
    GRN,GRN_D,[{c:GRN,uw:0.35,bh:0.22,lw:0.35,bw:0.16}],GRN);

  card4(s,0.3,3.15,
    "Dragonfly Doji — דרגון-פליי דוג'י",
    "היפוך עולה חזק",
    "כמעט אין גוף. רק צל תחתון ארוך מאוד. הקונים דחפו את המחיר חזרה מלמטה — אות עולה חזק מאוד.",
    GRN,GRN_D,[{c:GRN,uw:0.02,bh:0.04,lw:0.92,bw:0.16}],GRN);
}

// ─────────────────────────────────────────────
// SLIDE 4: Bullish 2-Candle Patterns
// ─────────────────────────────────────────────
{
  const s = prs.addSlide();
  s.background={color:BG};
  hdr(s,"דפוסי שני נרות עולים — היפוך עולה",20);

  cardH(s,1.1,
    "Bullish Engulfing — בליעה עולה",
    "היפוך עולה חזק",
    "נר אדום קטן ואחריו נר ירוק גדול שבולע אותו לחלוטין. שינוי חד מלחץ מכירה ללחץ קנייה. אחד הדפוסים הנפוצים ביותר.",
    GRN,GRN_D,
    [{c:RED,uw:0.05,bh:0.25,lw:0.05,bw:0.14},{c:GRN,uw:0.05,bh:0.42,lw:0.05,bw:0.21}],GRN);

  cardH(s,2.62,
    "Bullish Harami — הרמי עולה",
    "היפוך עולה | חלש יותר",
    "נר אדום גדול ואחריו נר ירוק קטן שנמצא בתוך גוף הנר הקודם. המוכרים מאבדים כוח — סימן להיחלשות המגמה.",
    GRN,GRN_D,
    [{c:RED,uw:0.05,bh:0.45,lw:0.05,bw:0.21},{c:GRN,uw:0.18,bh:0.15,lw:0.18,bw:0.14}],GRN);

  cardH(s,4.14,
    "Tweezer Bottom — טוויזר בוטום",
    "תמיכה חזקה | היפוך",
    "שני נרות עם אותו שפל בדיוק. השוק ניסה לרדת פעמיים ונכשל — רמת תמיכה חזקה ולחץ קנייה חזר.",
    GRN,GRN_D,
    [{c:RED,uw:0.15,bh:0.32,lw:0.18,bw:0.16},{c:GRN,uw:0.12,bh:0.28,lw:0.18,bw:0.16}],GRN);
}

// ─────────────────────────────────────────────
// SLIDE 5: Bullish 3-Candle Patterns
// ─────────────────────────────────────────────
{
  const s = prs.addSlide();
  s.background={color:BG};
  hdr(s,"דפוסי שלושה נרות עולים — המשך ועוצמה",19);

  cardH(s,1.1,
    "Morning Star — כוכב הבוקר",
    "היפוך עולה חזק מאוד",
    "שלושה נרות: נר אדום גדול, נר קטן/דוג'י (היסוס), נר ירוק גדול שסוגר מעל אמצע הנר הראשון. אות היפוך עוצמתי.",
    GRN,GRN_D,
    [{c:RED,uw:0.06,bh:0.38,lw:0.06,bw:0.16},{c:"FFD166",uw:0.13,bh:0.12,lw:0.13,bw:0.12},{c:GRN,uw:0.06,bh:0.38,lw:0.06,bw:0.16}],GRN);

  cardH(s,2.62,
    "Three White Soldiers — שלושה חיילים לבנים",
    "מגמת עלייה חזקה",
    "שלושה נרות ירוקים עולים ברצף. כל נר פותח בתוך גוף הנר הקודם וסוגר גבוה יותר. לחץ קנייה רצוף ועוצמתי.",
    GRN,GRN_D,
    [{c:GRN,uw:0.05,bh:0.28,lw:0.04,bw:0.15},{c:GRN,uw:0.04,bh:0.34,lw:0.04,bw:0.17},{c:GRN,uw:0.04,bh:0.40,lw:0.04,bw:0.18}],GRN);

  cardH(s,4.14,
    "Three Line Strike — מכה של שלושה (עולה)",
    "המשך עולה | מלכודת דובים",
    "שלושה נרות ירוקים עולים ואחריהם נר אדום גדול שבולע את כולם. אל תמכור! לרוב המחיר ממשיך מעלה — מלכודת לדובים.",
    GRN,GRN_D,
    [{c:GRN,uw:0.04,bh:0.24,lw:0.04,bw:0.14},{c:GRN,uw:0.04,bh:0.30,lw:0.04,bw:0.15},{c:GRN,uw:0.04,bh:0.36,lw:0.04,bw:0.16},{c:RED,uw:0.06,bh:0.60,lw:0.06,bw:0.21}],GRN);
}

// ─────────────────────────────────────────────
// SLIDE 6: Bearish Single Candle Patterns
// ─────────────────────────────────────────────
{
  const s = prs.addSlide();
  s.background={color:BG};
  hdr(s,"דפוסי נרות בודדים יורדים — היפוך יורד",20);

  card4(s,5.2,1.1,
    "Hanging Man — התלוי",
    "היפוך יורד | אחרי עלייה",
    "גוף קטן בחלק העליון. צל תחתון ארוך. מופיע לאחר מגמת עלייה — מצביע על כניסת מוכרים לשוק.",
    RED,RED_D,[{c:RED,uw:0.04,bh:0.22,lw:0.85,bw:0.16}],RED);

  card4(s,0.3,1.1,
    "Shooting Star — כוכב הירי",
    "היפוך יורד | אחרי עלייה",
    "גוף קטן בתחתית. צל עליון ארוך. מופיע לאחר מגמת עלייה — המחיר ניסה לעלות ונדחה בחזרה בחוזקה.",
    RED,RED_D,[{c:RED,uw:0.85,bh:0.22,lw:0.04,bw:0.16}],RED);

  card4(s,5.2,3.15,
    "Spinning Top — ספינינג טופ יורד",
    "היסוס | פוטנציאל יורד",
    "גוף קטן. צלליות מעל ומתחת לגוף. אחרי מגמת עלייה מצביע על אובדן מומנטום הקונים — פוטנציאל ירידה.",
    RED,RED_D,[{c:RED,uw:0.35,bh:0.22,lw:0.35,bw:0.16}],RED);

  card4(s,0.3,3.15,
    "Gravestone Doji — גרייבסטון דוג'י",
    "היפוך יורד חזק",
    "כמעט אין גוף. רק צל עליון ארוך מאוד. המחיר עלה גבוה ונפל לנקודת הפתיחה — לחץ מכירה עוצמתי.",
    RED,RED_D,[{c:RED,uw:0.92,bh:0.04,lw:0.02,bw:0.16}],RED);
}

// ─────────────────────────────────────────────
// SLIDE 7: Bearish Multi-Candle Patterns
// ─────────────────────────────────────────────
{
  const s = prs.addSlide();
  s.background={color:BG};
  hdr(s,"דפוסי שני ושלושה נרות יורדים — היפוך יורד",18);

  cardH(s,1.1,
    "Bearish Engulfing — בליעה יורדת",
    "היפוך יורד חזק",
    "נר ירוק קטן ואחריו נר אדום גדול שבולע אותו לחלוטין. שינוי חד מלחץ קנייה ללחץ מכירה. אות חזק מאוד.",
    RED,RED_D,
    [{c:GRN,uw:0.05,bh:0.25,lw:0.05,bw:0.14},{c:RED,uw:0.05,bh:0.42,lw:0.05,bw:0.21}],RED);

  cardH(s,2.62,
    "Bearish Harami — הרמי יורד",
    "היפוך יורד | היסוס",
    "נר ירוק גדול ואחריו נר אדום קטן שנמצא בתוך הגוף הירוק. הקונים מאבדים שליטה — סימן להיחלשות המגמה.",
    RED,RED_D,
    [{c:GRN,uw:0.05,bh:0.45,lw:0.05,bw:0.21},{c:RED,uw:0.18,bh:0.15,lw:0.18,bw:0.14}],RED);

  cardH(s,4.14,
    "Evening Star — כוכב הערב",
    "היפוך יורד חזק מאוד",
    "שלושה נרות: נר ירוק גדול, נר קטן/דוג'י (היסוס), נר אדום גדול שסוגר מתחת לאמצע הנר הראשון. אות יורד עוצמתי.",
    RED,RED_D,
    [{c:GRN,uw:0.06,bh:0.38,lw:0.06,bw:0.16},{c:"FFD166",uw:0.13,bh:0.12,lw:0.13,bw:0.12},{c:RED,uw:0.06,bh:0.38,lw:0.06,bw:0.16}],RED);
}

// ─────────────────────────────────────────────
// SLIDE 8: Three Black Crows + טבלת עזר
// ─────────────────────────────────────────────
{
  const s = prs.addSlide();
  s.background={color:BG};
  hdr(s,"Three Black Crows + טבלת עזר מהירה",21);

  // Three Black Crows card (left side)
  {
    const x=0.3,y=1.1,W=4.5,H=1.85;
    s.addShape(prs.shapes.RECTANGLE,{x,y,w:W,h:H,fill:{color:CARD2},line:{color:RED_D,width:1}});
    s.addShape(prs.shapes.RECTANGLE,{x,y,w:1.1,h:H,fill:{color:CARD},line:{color:BD,width:0}});
    s.addShape(prs.shapes.LINE,{x:x+1.1,y,w:0,h:H,line:{color:RED_D,width:1}});
    s.addShape(prs.shapes.RECTANGLE,{x:x+1.1,y,w:W-1.1,h:0.05,fill:{color:RED},line:{color:RED}});
    mk(s,x+0.25,y+0.1, {c:RED,uw:0.04,bh:0.40,lw:0.04,bw:0.17});
    mk(s,x+0.57,y+0.22,{c:RED,uw:0.04,bh:0.34,lw:0.04,bw:0.16});
    mk(s,x+0.87,y+0.36,{c:RED,uw:0.04,bh:0.28,lw:0.04,bw:0.15});
    t(s,"Three Black Crows — שלושה עורבים שחורים",
      {x:x+1.2,y:y+0.08,w:3.2,h:0.36,fontSize:11.5,color:GOLD2,bold:true,valign:"top",margin:0});
    s.addShape(prs.shapes.RECTANGLE,{x:x+3.1,y:y+0.48,w:1.3,h:0.26,fill:{color:RED_D},line:{color:RED,width:0.5}});
    t(s,"מגמה יורדת חזקה",
      {x:x+3.1,y:y+0.48,w:1.3,h:0.26,fontSize:8,color:RED,bold:true,align:"center",valign:"middle",margin:0});
    t(s,"שלושה נרות אדומים ברצף. כל נר פותח בתוך גוף הנר הקודם וסוגר נמוך יותר. המוכרים שולטים לחלוטין בשוק.",
      {x:x+1.2,y:y+0.82,w:3.2,h:0.96,fontSize:11,color:LT,valign:"top",margin:0});
  }

  // Bullish reference table (right)
  s.addShape(prs.shapes.RECTANGLE,{x:5.2,y:1.1,w:4.5,h:0.38,fill:{color:GRN_D},line:{color:GRN,width:1}});
  t(s,"דפוסים עולים",{x:5.2,y:1.1,w:4.5,h:0.38,fontSize:13,color:GRN,bold:true,valign:"middle",margin:0});

  const bull=[
    ["Hammer","פטיש","היפוך עולה"],
    ["Inverted Hammer","פטיש הפוך","היפוך עולה"],
    ["Dragonfly Doji","דרגון-פליי דוג'י","היפוך חזק"],
    ["Spinning Top","ספינינג טופ","היסוס / עולה"],
    ["Bullish Engulfing","בליעה עולה","היפוך חזק"],
    ["Morning Star","כוכב הבוקר","היפוך חזק"],
    ["3 White Soldiers","שלושה חיילים לבנים","מגמה עולה"],
  ];
  bull.forEach((r,i)=>{
    const y=1.53+i*0.42;
    s.addShape(prs.shapes.RECTANGLE,{x:5.2,y,w:4.5,h:0.38,fill:{color:i%2===0?CARD2:CARD},line:{color:BD,width:0.5}});
    s.addText(r[0],{x:5.25,y,w:1.7,h:0.38,fontSize:9.5,color:GR,align:"left",valign:"middle",margin:0});
    t(s,r[1],{x:7.0,y,w:1.28,h:0.38,fontSize:9.5,color:LT,bold:true,align:"center",valign:"middle",margin:0});
    s.addShape(prs.shapes.RECTANGLE,{x:8.35,y:y+0.07,w:1.28,h:0.24,fill:{color:GRN_D},line:{color:GRN,width:0.5}});
    t(s,r[2],{x:8.35,y:y+0.07,w:1.28,h:0.24,fontSize:8,color:GRN,bold:true,align:"center",valign:"middle",margin:0});
  });

  // Bearish reference table (bottom left)
  s.addShape(prs.shapes.RECTANGLE,{x:0.3,y:3.1,w:4.5,h:0.38,fill:{color:RED_D},line:{color:RED,width:1}});
  t(s,"דפוסים יורדים",{x:0.3,y:3.1,w:4.5,h:0.38,fontSize:13,color:RED,bold:true,valign:"middle",margin:0});

  const bear=[
    ["Hanging Man","התלוי","היפוך יורד"],
    ["Shooting Star","כוכב הירי","היפוך יורד"],
    ["Gravestone Doji","גרייבסטון דוג'י","היפוך חזק"],
    ["Bearish Engulfing","בליעה יורדת","היפוך חזק"],
    ["Evening Star","כוכב הערב","היפוך חזק"],
    ["3 Black Crows","שלושה עורבים שחורים","מגמה יורדת"],
  ];
  bear.forEach((r,i)=>{
    const y=3.53+i*0.33;
    s.addShape(prs.shapes.RECTANGLE,{x:0.3,y,w:4.5,h:0.3,fill:{color:i%2===0?CARD2:CARD},line:{color:BD,width:0.5}});
    s.addText(r[0],{x:0.35,y,w:1.7,h:0.3,fontSize:9,color:GR,align:"left",valign:"middle",margin:0});
    t(s,r[1],{x:2.1,y,w:1.28,h:0.3,fontSize:9,color:LT,bold:true,align:"center",valign:"middle",margin:0});
    s.addShape(prs.shapes.RECTANGLE,{x:3.45,y:y+0.04,w:1.28,h:0.22,fill:{color:RED_D},line:{color:RED,width:0.5}});
    t(s,r[2],{x:3.45,y:y+0.04,w:1.28,h:0.22,fontSize:8,color:RED,bold:true,align:"center",valign:"middle",margin:0});
  });
}

// ── Save ──────────────────────────────────────
prs.writeFile({fileName:"שיעור_2_נרות_יפניים.pptx"})
  .then(()=>console.log("✅ Saved!"))
  .catch(e=>console.error("❌",e));
