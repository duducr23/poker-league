"use server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import {
  BookOpen, Users, CalendarDays, Trophy, Mail, Settings,
  Shield, UserCircle2, LogIn, Copy, Spade,
  Star, Share2, CalendarPlus, BarChart3, ArrowLeftRight,
  Receipt, CheckCircle2, XCircle, Camera, Clock, Plus,
  CreditCard, AlertCircle, RefreshCw, Scale, Info
} from "lucide-react";

function Section({ icon: Icon, title, children }: { icon: any; title: string | React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(212,160,23,0.12)" }}>
      <div
        className="flex items-center gap-3 px-5 py-4"
        style={{ background: "rgba(212,160,23,0.06)", borderBottom: "1px solid rgba(212,160,23,0.1)" }}
      >
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg shrink-0"
          style={{ background: "linear-gradient(135deg, #d4a017, #f5d060)", color: "#0a0a12" }}
        >
          <Icon className="h-4 w-4" />
        </div>
        <h2 className="text-base font-bold text-slate-100">{title}</h2>
      </div>
      <div className="p-5 space-y-3" style={{ background: "#0d0d18" }}>
        {children}
      </div>
    </div>
  );
}

function Step({ num, text, sub }: { num: number; text: string; sub?: string }) {
  return (
    <div className="flex items-start gap-3">
      <div
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold mt-0.5"
        style={{ background: "linear-gradient(135deg, #d4a017, #f5c842)", color: "#0a0a12" }}
      >
        {num}
      </div>
      <div>
        <p className="text-sm text-slate-200">{text}</p>
        {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function Tip({ icon: Icon = Star, text, color }: { icon?: any; text: string; color?: string }) {
  return (
    <div
      className="flex items-start gap-2 p-3 rounded-lg text-xs"
      style={{ background: color ? "rgba(52,211,153,0.06)" : "rgba(212,160,23,0.06)", border: color ? "1px solid rgba(52,211,153,0.2)" : "1px solid rgba(212,160,23,0.12)" }}
    >
      <Icon className={`h-3.5 w-3.5 shrink-0 mt-0.5 ${color || "text-yellow-500"}`} />
      <span className="text-slate-400">{text}</span>
    </div>
  );
}

function Row({ icon, label, desc }: { icon: string; label: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 py-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
      <span className="text-lg shrink-0">{icon}</span>
      <div>
        <p className="text-sm font-medium text-slate-200">{label}</p>
        <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
      </div>
    </div>
  );
}

function StatusBadge({ label, color }: { label: string; color: "yellow" | "green" | "blue" | "red" }) {
  const styles: Record<string, { bg: string; text: string; border: string }> = {
    yellow: { bg: "rgba(234,179,8,0.12)", text: "#facc15", border: "rgba(234,179,8,0.3)" },
    green:  { bg: "rgba(52,211,153,0.12)", text: "#34d399", border: "rgba(52,211,153,0.3)" },
    blue:   { bg: "rgba(96,165,250,0.12)", text: "#60a5fa", border: "rgba(96,165,250,0.3)" },
    red:    { bg: "rgba(248,113,113,0.12)", text: "#f87171", border: "rgba(248,113,113,0.3)" },
  };
  const s = styles[color];
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold"
      style={{ background: s.bg, color: s.text, border: `1px solid ${s.border}` }}
    >
      {label}
    </span>
  );
}

function NewBadge() {
  return (
    <span
      className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-bold ml-1"
      style={{ background: "rgba(52,211,153,0.15)", color: "#34d399", border: "1px solid rgba(52,211,153,0.3)" }}
    >
      חדש
    </span>
  );
}

function Divider() {
  return <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", margin: "4px 0" }} />;
}

export default async function HelpPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const [currentUser, memberships] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { canCreateGroup: true, email: true, image: true },
    }),
    prisma.groupMember.findMany({
      where: { userId: session.user.id },
      include: { group: { select: { id: true, name: true } } },
    }),
  ]);

  const groups = memberships.map((m) => ({ id: m.group.id, name: m.group.name }));
  const isSuperAdmin = currentUser?.email?.toLowerCase() === process.env.SUPER_ADMIN_EMAIL?.toLowerCase();
  const isAnyGroupAdmin = memberships.some((m) => m.role === "ADMIN");
  const canCreateGroup = currentUser?.canCreateGroup || isSuperAdmin || isAnyGroupAdmin;

  return (
    <AppShell groups={groups} canCreateGroup={canCreateGroup} isSuperAdmin={isSuperAdmin} userImage={currentUser?.image}>
      <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-6 pb-16">

        {/* Header */}
        <div className="text-center py-6">
          <div className="text-5xl mb-3">🃏</div>
          <h1
            className="text-3xl font-bold mb-2"
            style={{
              background: "linear-gradient(135deg, #d4a017, #f5d060)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            מדריך למשתמש
          </h1>
          <p className="text-slate-500 text-sm">Poker League — כל מה שצריך לדעת</p>
        </div>

        {/* 1. הרשמה וכניסה */}
        <Section icon={LogIn} title="הרשמה וכניסה למערכת">
          <Step num={1} text='לחץ "הירשם" ומלא שם, אימייל וסיסמה' sub="סיסמה חייבת להכיל לפחות 6 תווים" />
          <Step num={2} text="לחץ על עין 👁 כדי להציג/להסתיר את הסיסמה" />
          <Step num={3} text="אם קיבלת קישור הצטרפות — הירשם דרכו ותצטרף לקבוצה אוטומטית" />
          <Tip text="קישור הצטרפות נראה כך: /register?invite=ABCD1234 — לחץ עליו כדי להצטרף לקבוצה ישר אחרי ההרשמה" />
        </Section>

        {/* 2. קבוצות */}
        <Section icon={Users} title="ניהול קבוצות">
          <Row icon="➕" label="יצירת קבוצה" desc="מנהלי קבוצה קיימת יכולים לפתוח קבוצה חדשה ישירות מהדשבורד" />
          <Row icon="🔑" label="הצטרפות עם קוד" desc='לחץ "הצטרף עם קוד" בדשבורד, הזן את קוד ההזמנה שקיבלת מהמנהל' />
          <Row icon="📋" label="העתקת קוד הזמנה" desc="בכל כרטיס קבוצה בדשבורד — לחץ על כפתור ההעתקה שמציג את הקוד" />
          <Row icon="⚙️" label="הגדרות קבוצה" desc="לחץ על גלגל השיניים בדף הקבוצה — ניהול חברים, קוד הזמנה, מחיקת קבוצה" />
          <Row icon="❄️" label="הקפאת שחקן" desc="בהגדרות → חברים — הקפאת שחקן מסירה אותו מהדירוג בלי למחוק את ההיסטוריה" />
          <Row icon="🗑️" label="הסרת שחקן מהקבוצה" desc="בהגדרות → חברים — לחץ 'הסר' ובחר: שמור נתונים (ממשיך להופיע בהיסטוריה) או מחק הכל" />
          <Row icon="🎭" label="הוספת שחקן ללא רישום" desc="מנהל יכול להוסיף שחקן בשם בלבד — לשחקנים שלא נרשמו לאפליקציה" />
          <Tip icon={Copy} text="שלח את קוד ההזמנה לחברים — לחץ על הכפתור בדשבורד והקוד מועתק אוטומטית" />
        </Section>

        {/* 3. ערבי משחק */}
        <Section icon={CalendarDays} title="ערבי משחק (סשנים)">
          <Step num={1} text='לחץ "ערבי משחק" בסיידבר ← "ערב חדש"' />
          <Step num={2} text="הזן תאריך, מיקום ובחר עונה (אם רלוונטי)" />
          <Step num={3} text='הוסף שחקנים ← הזן קנייה, רה-ביי וסכום יציאה לכל שחקן' />
          <Step num={4} text='לחץ "סגור ערב" כדי לחשב תוצאות ולהפיק חישגוזים' />
          <Tip icon={BarChart3} text="לאחר סגירת הערב — החישגוזים מחושבים אוטומטית ומופיעים לכל חברי הקבוצה" />
          <Tip text="מנהל יכול לפתוח מצב מנהל 🔧 בדף הסשן לעריכת תוצאות ידנית גם אחרי הסגירה" />
        </Section>

        {/* 4. חישגוזים */}
        <Section icon={ArrowLeftRight} title="חישגוזים — התחשבנות בין שחקנים">

          <p className="text-xs text-slate-500 pb-1">
            לאחר סגירת ערב, המערכת מחשבת אוטומטית מי חייב לשלם למי ובכמה — ומציגה רשימת תשלומים מינימלית.
          </p>

          <Divider />
          <p className="text-xs font-semibold text-yellow-500">🔄 זרימת תשלום חישגוז</p>

          <div className="space-y-2 mt-1">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <StatusBadge label="ממתין לתשלום" color="yellow" />
              <span className="text-slate-500">→ המשלם לוחץ "סמן כשולם"</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <StatusBadge label="הוכחה הועלתה" color="blue" />
              <span className="text-slate-500">→ מקבל הכסף בודק ומאשר/דוחה</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <StatusBadge label="שולם ✓" color="green" />
              <span className="text-slate-500">→ הסתיים, נרשם בהיסטוריה</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <StatusBadge label="נדחה" color="red" />
              <span className="text-slate-500">→ חוזר ל"ממתין", צריך להעלות הוכחה חדשה</span>
            </div>
          </div>

          <Divider />
          <p className="text-xs font-semibold text-yellow-500">🚶 צד המשלם (מי שחייב כסף)</p>
          <Row icon="1️⃣" label='לחץ "סמן כשולם"' desc='מופיע בכרטיסיית החישגוז שלך כשהסטטוס הוא "ממתין לתשלום"' />
          <Row icon="2️⃣" label="העלה הוכחת תשלום" desc="צלם/בחר תמונה של האסמכתה (ביט, פייבוקס, העברה בנקאית וכו׳)" />
          <Row icon="3️⃣" label="המתן לאישור" desc='הסטטוס יעבור ל"הוכחה הועלתה" — מקבל הכסף יאשר' />

          <Divider />
          <p className="text-xs font-semibold text-yellow-500">🙋 צד המקבל (מי שמגיע לו כסף)</p>
          <Row icon="1️⃣" label="קבל התראה" desc="כשמישהו מעלה הוכחת תשלום עבורך — ניתן לראות אותה בדף הסשן" />
          <Row icon="2️⃣" label='לחץ "אשר תשלום"' desc="אם קיבלת את הכסף — אשר. הסטטוס יעבור לירוק ✅ לכולם" />
          <Row icon="3️⃣" label='לחץ "דחה"' desc="אם לא קיבלת או שהתמונה שגויה — דחה והמשלם יצטרך להעלות שוב" />

          <Divider />
          <Tip icon={AlertCircle} text="חישגוז שלא שולם לא נמחק — הוא ממשיך להופיע עד שמסמנים אותו כשולם ומאשרים" />
          <Tip icon={BarChart3} text="ניתן לראות סיכום — כמה חישגוזים שולמו וכמה ממתינים בראש דף הסשן" />
        </Section>

        {/* 5. הוצאות ערב */}
        <Section icon={Receipt} title={<>הוצאות ערב (אוכל / קניות משותפות) <NewBadge /></> as any}>

          <p className="text-xs text-slate-500 pb-1">
            הוצאות ערב הן <strong className="text-slate-400">נפרדות</strong> מחישגוזי הפוקר. הן מיועדות לחלוקת הוצאות משותפות כמו אוכל, שתייה, שכירות מקום וכו׳.
          </p>

          <Divider />
          <p className="text-xs font-semibold text-yellow-500">➕ יצירת הוצאה חדשה (מנהל בלבד)</p>
          <Step num={1} text='בדף הערב — גלול למטה לקטע "הוצאות ערב" ולחץ "הוצאה חדשה"' />
          <Step num={2} text="הזן שם ההוצאה (למשל: פיצה, ביירה, שכירות)" sub="ניתן להוסיף תיאור נוסף אם רוצים" />
          <Step num={3} text="הזן סכום כולל ובחר מי שילם מהכיס שלו (ישולם לו בחזרה)" />
          <Step num={4} text="בחר שיטת חלוקה:" sub="• שווה — מחולק שווה בין כל המשתתפים • ידנית — אתה קובע כמה כל אחד משלם" />
          <Step num={5} text='לחץ "צור הוצאה" — המשתתפים יראו אוטומטית כמה הם חייבים' />

          <Divider />
          <p className="text-xs font-semibold text-yellow-500">🔄 זרימת תשלום הוצאה</p>

          <div className="space-y-2 mt-1">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <StatusBadge label="ממתין לתשלום" color="yellow" />
              <span className="text-slate-500">→ החייב לוחץ "סמן כשולם" ומעלה הוכחה</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <StatusBadge label="הוכחה הועלתה" color="blue" />
              <span className="text-slate-500">→ מי ששילם מהכיס בודק ומאשר</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <StatusBadge label="אושר ✓" color="green" />
              <span className="text-slate-500">→ הוצאה שולמה, נגמר</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <StatusBadge label="נדחה" color="red" />
              <span className="text-slate-500">→ חוזר ל"ממתין", יש להעלות הוכחה חדשה</span>
            </div>
          </div>

          <Divider />
          <p className="text-xs font-semibold text-yellow-500">🚶 מה עושה מי שחייב כסף</p>
          <Row icon="📸" label='לחץ "סמן כשולם"' desc='מופיע בכרטיסיית ההוצאה שלך כשהסטטוס "ממתין לתשלום"' />
          <Row icon="🖼️" label="העלה תמונת הוכחה" desc="צלם אסמכתה (ביט, פייבוקס, כרטיס אשראי וכו׳) — חובה להעלות תמונה" />
          <Row icon="⏳" label="המתן לאישור" desc="מי שגבה את הכסף יראה את ההוכחה ויאשר או ידחה" />

          <Divider />
          <p className="text-xs font-semibold text-yellow-500">🙋 מה עושה מי שגבה את הכסף</p>
          <Row icon="✅" label='לחץ "אשר תשלום"' desc="אם קיבלת את הכסף — אשר. הסטטוס יעבור לירוק לכולם" />
          <Row icon="❌" label='לחץ "דחה"' desc="אם התמונה לא תקינה — דחה, והחייב יצטרך להעלות הוכחה חדשה" />

          <Divider />
          <Tip icon={RefreshCw} text="הרשימה מתרעננת אוטומטית כל 8 שניות — לא צריך לרענן ידנית" />
          <Tip text="הוצאות ערב לא משפיעות על חישגוזי הפוקר — הן מנוהלות בנפרד לגמרי" />
        </Section>

        {/* 6. הזמנות לערב */}
        <Section icon={CalendarPlus} title="הזמנות לערב (RSVP)">
          <Step num={1} text='לחץ "הזמנות" בסיידבר ← "הזמנה לערב"' />
          <Step num={2} text="מלא כותרת, תאריך ושעה, מיקום והערות" />
          <Step num={3} text="כל חברי הקבוצה יראו את ההזמנה בדשבורד ובדף ההזמנות" />
          <Step num={4} text="כל חבר לוחץ: מגיע ✅ / לא מגיע ❌ / אולי 🤔" />
          <Row icon="✏️" label="עריכת הזמנה" desc="יוצר ההזמנה / מנהל יכולים ללחוץ על אייקון העיפרון 🖊️ ולעדכן תאריך/מיקום/הערות" />
          <Row icon="🗺️" label="Waze / Google Maps" desc="אם הוזן מיקום — מופיעים כפתורי ניווט ישירות בכרטיסיית ההזמנה" />
          <Row icon="🗓️" label="קישור לערב" desc="יצירת הזמנה פותחת ערב פוקר אוטומטית — לחץ 'כנס לערב' כדי לעבור לדף הסשן" />
          <Row icon="📊" label="צפי השתתפות" desc="רואים בזמן אמת כמה מגיעים, כמה לא, כמה עוד לא ענו" />
          <Row icon="📤" label="שיתוף" desc='לחץ "העתק הזמנה לשיתוף" — מעתיק טקסט מוכן לשליחה בוואטסאפ/טלגרם' />
          <Tip text="בדשבורד יופיע באנר צהוב כשיש הזמנות שעוד לא ענית עליהן" />
        </Section>

        {/* 7. טבלת דירוג */}
        <Section icon={Trophy} title="טבלת דירוג (ליגה)">
          <Row icon="🏆" label="דירוג שחקנים" desc="מסודר לפי רווח/הפסד כולל בכל הסשנים" />
          <Row icon="📈" label="סטטיסטיקות" desc="רווח ממוצע, מספר ניצחונות, סשנים שהשתתף" />
          <Row icon="⚠️" label="מינימום הגעה" desc="שחקן חייב להגיע לפחות ל-25% מהערבים הסגורים כדי להופיע בטבלה" />
          <Tip icon={Star} text="ניתן לייצא את הדירוג לקובץ CSV מדף הדירוג" />
        </Section>

        {/* 8. פרופיל ואווטאר */}
        <Section icon={UserCircle2} title="פרופיל ואווטאר">
          <Step num={1} text="לחץ על השם שלך בתחתית הסיידבר" />
          <Step num={2} text="בחר סגנון: הרפתקנים / אמוג'י / דמויות / פנים / רובוטים / פיקסל" />
          <Step num={3} text="בחר אווטאר מתוך 12 אפשרויות צבעוניות ← לחץ שמור" />
          <Tip text="האווטאר מופיע בסיידבר וידוע לכל חברי הקבוצה" />
        </Section>

        {/* 9. לוח ניהול */}
        <Section icon={Shield} title="לוח ניהול (מנהל אפליקציה בלבד)">
          <Row icon="🔐" label="כניסה ל-/admin" desc="רק מנהל האפליקציה (SUPER_ADMIN) יכול לגשת לדף זה — מופיע בסיידבר עם אייקון מגן" />
          <Row icon="✅" label="הרשאת פתיחת קבוצה" desc="הפעל/כבה הרשאה לכל משתמש לפתוח קבוצות חדשות" />
          <Row icon="✏️" label="עריכת משתמש" desc="שינוי שם, אימייל וסיסמה לכל משתמש ישירות מלוח הניהול" />
          <Row icon="👥" label="שיוך לקבוצה" desc="הוסף משתמש לכל קבוצה קיימת ישירות ממסך הניהול" />
          <Row icon="🗑️" label="מחיקת משתמש" desc="מחיקה מלאה של חשבון — פעולה בלתי הפיכה, מוגנת בהסכמה כפולה" />
          <Row icon="🔗" label="קישורי הרשמה" desc="העתק קישור הרשמה כללי או עם קוד קבוצה ספציפי לשיתוף" />
          <Tip icon={Share2} text="קישור עם קוד: /register?invite=XXX — הנרשם מצטרף לקבוצה אוטומטית אחרי ההרשמה" />
        </Section>

        {/* 10. התקנה כאפליקציה */}
        <Section icon={Spade} title="התקנה כאפליקציה (PWA)">
          <Row icon="📱" label="אנדרואיד (Chrome)" desc='לחץ על שלוש הנקודות ← "הוסף למסך הבית"' />
          <Row icon="🍎" label="אייפון (Safari)" desc='לחץ על כפתור השיתוף ← "הוסף למסך הבית"' />
          <Row icon="💻" label="מחשב (Chrome/Edge)" desc="לחץ על האייקון שמופיע בשורת הכתובת ← התקן" />
          <Tip text="לאחר ההתקנה האפליקציה נפתחת ישירות בלי דפדפן, כמו אפליקציה רגילה" />
        </Section>

        {/* 11. ספר חוקים */}
        <Section icon={Scale} title="ספר חוקים — כל התניות המערכת">

          <p className="text-xs text-slate-500 pb-1">
            כאן מרוכזות כל הכללים הפנימיים שקובעים מי מופיע איפה, מתי ולמה.
          </p>

          <Divider />
          <p className="text-xs font-semibold text-yellow-500">🪑 חסר בשולחן</p>
          <Row icon="❌" label="תנאי הופעה" desc="שחקן יופיע ב'חסר בשולחן' רק אם נעדר משני הערבים הסגורים האחרונים ברצף" />
          <Row icon="✅" label="הסרה אוטומטית" desc="שיחק בערב האחרון? נעלם מהרשימה מיד — גם אם פספס לפני כן" />
          <Row icon="ℹ️" label="פחות מ-2 ערבים סגורים?" desc="הווידג'ט לא יופיע בכלל — אין מספיק נתונים לקבוע" />

          <Divider />
          <p className="text-xs font-semibold text-yellow-500">📊 זכאות לטבלת דירוג וניתוח שחקנים</p>
          <Row icon="🎯" label="סף כניסה" desc="שחקן מוסמך אם שיחק לפחות 25% מכלל הערבים הסגורים בקבוצה" />
          <Row icon="📉" label="מה לא נחשב" desc="שחקנים מתחת לסף לא מופיעים בטבלת הדירוג, ולא בטופ/בוטום" />
          <Row icon="❄️" label="שחקן מוקפא" desc="שחקן מוקפא לא מופיע בשום טבלת דירוג, גם אם עמד בסף" />

          <Divider />
          <p className="text-xs font-semibold text-yellow-500">🏆 טופ 3 כל הזמנים</p>
          <Row icon="🥇" label="מי מופיע" desc="3 השחקנים המוסמכים עם הרווח הכולל הגבוה ביותר לאורך כל הזמן" />
          <Row icon="🔢" label="מינימום נדרש" desc="לפחות 25% הגעה מכלל ערבים סגורים — ראה סף כניסה למעלה" />
          <Row icon="📍" label="מיקום בדף" desc="מוצג בעמוד הבית של הקבוצה, בכרטיסיות זהב/כסף/ארד" />

          <Divider />
          <p className="text-xs font-semibold text-yellow-500">💀 נלחמים בתחתית</p>
          <Row icon="🃏" label="מי מופיע" desc="3 השחקנים המוסמכים עם הרווח הכולל הנמוך ביותר (הפסד הגדול ביותר)" />
          <Row icon="🚫" label="ללא חפיפה" desc="שחקן שמופיע בטופ 3 לא יכול להופיע גם בתחתית — אין כפילות" />
          <Row icon="📍" label="מיקום בדף" desc="מוצג מיד מתחת לטופ 3 בדף הבית של הקבוצה" />

          <Divider />
          <p className="text-xs font-semibold text-yellow-500">🔥 ניתוח שחקנים ללא צנזורה (Roast)</p>
          <Row icon="👑" label="מי מופיע" desc="טופ 2 הרווחיים ביותר + 2 המפסידים הגדולים ביותר — מבין המוסמכים בלבד" />
          <Row icon="🔄" label="סיבוב טקסטים" desc="הטקסטים מתחלפים אוטומטית כל יומיים החל מתאריך הערב האחרון" />
          <Row icon="🎲" label="שונה בין שחקנים" desc="כל שחקן מקבל טקסט שונה — מבוסס על זהות השחקן + מחזור הזמן הנוכחי" />
          <Row icon="📍" label="מיקום בדף" desc="כרטיסיות זהב (טופ) ואדומות (תחתית) בדף הבית של הקבוצה, מתחת לדירוג" />

          <Divider />
          <p className="text-xs font-semibold text-yellow-500">🏅 הכי הרבה נצחונות / הכי הרבה הפסדים</p>
          <Row icon="🏆" label="נצחונות" desc="השחקן המוסמך עם המספר הגבוה ביותר של ערבים שיצא מהם ברווח (profit > 0)" />
          <Row icon="💸" label="הפסדים" desc="השחקן המוסמך עם המספר הגבוה ביותר של ערבים שיצא מהם בהפסד (profit < 0)" />
          <Row icon="📍" label="מיקום בדף" desc="שתי כרטיסיות הייליט מתחת לדירוג הראשי בדף הבית של הקבוצה" />
          <Tip icon={Info} text="בכל הרשימות — שחקן שמוקפא לא נלקח בחשבון, גם אם יש לו נתונים היסטוריים חזקים" />

        </Section>

        {/* Quick reference */}
        <div
          className="rounded-xl p-5"
          style={{ background: "rgba(212,160,23,0.05)", border: "1px solid rgba(212,160,23,0.15)" }}
        >
          <h3 className="text-sm font-bold text-yellow-400 mb-3 flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            קיצורי דרך מהירים
          </h3>
          <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
            <div>📊 דשבורד → <code className="text-yellow-600">/dashboard</code></div>
            <div>🏆 דירוג → <code className="text-yellow-600">/groups/ID/leaderboard</code></div>
            <div>📅 ערבים → <code className="text-yellow-600">/groups/ID/sessions</code></div>
            <div>✉️ הזמנות → <code className="text-yellow-600">/groups/ID/invitations</code></div>
            <div>⚙️ הגדרות → <code className="text-yellow-600">/groups/ID/settings</code></div>
            <div>🎭 פרופיל → <code className="text-yellow-600">/profile</code></div>
            <div>🔐 ניהול → <code className="text-yellow-600">/admin</code></div>
            <div>🧾 הוצאות → <code className="text-yellow-600">בדף הערב ↓</code></div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-700 pb-4">
          Poker League · כל הזכויות שמורות ♠️
        </p>
      </div>
    </AppShell>
  );
}
