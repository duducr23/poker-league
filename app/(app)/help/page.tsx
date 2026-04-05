import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import {
  BookOpen, Users, CalendarDays, Trophy, Mail, Settings,
  Shield, UserCircle2, LogIn, Copy, Eye, Spade,
  Star, Share2, CalendarPlus, BarChart3, ArrowLeft,
  Receipt, Pencil, Trash2, Snowflake, ShieldCheck, Plus
} from "lucide-react";

function Section({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
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

function Tip({ icon: Icon = Star, text }: { icon?: any; text: string }) {
  return (
    <div
      className="flex items-start gap-2 p-3 rounded-lg text-xs"
      style={{ background: "rgba(212,160,23,0.06)", border: "1px solid rgba(212,160,23,0.12)" }}
    >
      <Icon className="h-3.5 w-3.5 text-yellow-500 shrink-0 mt-0.5" />
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
            <Row icon="📋" label="העתקת קוד הזמנה מהדשבורד" desc="בכל כרטיס קבוצה בדשבורד — לחץ על כפתור ההעתקה שמציג את הקוד" />
            <Row icon="⚙️" label="הגדרות קבוצה" desc="לחץ על גלגל השיניים בדף הקבוצה — ניהול חברים, קוד הזמנה, מחיקת קבוצה" />
            <Row icon="❄️" label="הקפאת שחקן" desc="בהגדרות → חברים — הקפאת שחקן מסירה אותו מהדירוג בלי למחוק את ההיסטוריה" />
            <Row icon="🗑️" label={`הסרת שחקן מהקבוצה`} desc="בהגדרות → חברים — לחץ 'הסר' ובחר: שמור נתונים (ממשיך להופיע בהיסטוריה) או מחק הכל" />
            <Row icon="🎭" label="הוספת שחקן ללא רישום" desc="מנהל יכול להוסיף שחקן בשם בלבד — לשחקנים שלא נרשמו לאפליקציה" />
            <Tip icon={Copy} text="שלח את קוד ההזמנה לחברים — לחץ על הכפתור בדשבורד והקוד מועתק אוטומטית" />
          </Section>

          {/* 3. ערבי משחק */}
          <Section icon={CalendarDays} title="ערבי משחק (סשנים)">
            <Step num={1} text='לחץ "ערבי משחק" בסיידבר ← "ערב חדש"' />
            <Step num={2} text="הזן תאריך, מיקום ובחר עונה (אם רלוונטי)" />
            <Step num={3} text='הוסף שחקנים ← הזן buy-in, rebuy, add-ons וסכום יציאה לכל שחקן' />
            <Step num={4} text='לחץ "סגור ערב" כדי לחשב תוצאות ולהפיק חישגוזים' />
            <Tip icon={BarChart3} text="החישגוזים מחושבים אוטומטית — מי חייב לשלם למי ובכמה" />
            <Tip text="מנהל יכול לפתוח מצב מנהל 🔧 בדף הסשן לעריכת תוצאות ידנית" />
          </Section>

          {/* 4. הוצאות ערב — NEW */}
          <Section icon={Receipt} title={<>הוצאות ערב (אוכל / קניות משותפות) <NewBadge /></> as any}>
            <Step num={1} text='בדף הערב — גלול למטה לקטע "הוצאות ערב"' />
            <Step num={2} text='לחץ "הוצאה חדשה", הזן שם ההוצאה, סכום ומי שילם' />
            <Step num={3} text="בחר שיטת חלוקה: שווה בין כולם או ידנית לכל משתתף" />
            <Step num={4} text='כל משתתף שחייב כסף יכול ללחוץ "סמן כשולם" ולהעלות תמונת הוכחה' />
            <Step num={5} text="מקבל התשלום מאשר או דוחה את ההוכחה" />
            <Row icon="📸" label="העלאת הוכחת תשלום" desc="לחץ 'סמן כשולם' ← בחר תמונה מהמכשיר — הוכחה נשמרת ומוצגת למקבל" />
            <Row icon="✅" label="אישור תשלום" desc="מקבל הכסף מאשר את ההוכחה — הסטטוס משתנה ל'אושר' לכולם" />
            <Row icon="❌" label="דחיית הוכחה" desc="ניתן לדחות ולבקש הוכחה חדשה — התשלום חוזר לסטטוס 'ממתין'" />
            <Tip text="הרשימה מתרעננת אוטומטית כל 8 שניות — לא צריך לרענן ידנית" />
          </Section>

          {/* 5. הזמנות לערב */}
          <Section icon={CalendarPlus} title="הזמנות לערב (RSVP)">
            <Step num={1} text='לחץ "הזמנות" בסיידבר ← "הזמנה לערב"' />
            <Step num={2} text="מלא כותרת, תאריך ושעה, מיקום והערות" />
            <Step num={3} text="כל חברי הקבוצה יראו את ההזמנה בדשבורד ובדף ההזמנות" />
            <Step num={4} text="כל חבר לוחץ: מגיע ✅ / לא מגיע ❌ / אולי 🤔" />
            <Row icon="✏️" label={`עריכת הזמנה`} desc="יוצר ההזמנה / מנהל יכולים ללחוץ על אייקון העיפרון 🖊️ בכרטיסיית ההזמנה ולעדכן תאריך/מיקום/הערות" />
            <Row icon="🗓️" label="קישור לערב" desc="יצירת הזמנה פותחת ערב פוקר אוטומטית — לחץ 'כנס לערב' כדי לעבור לדף הסשן" />
            <Row icon="📊" label="צפי השתתפות" desc="רואים בזמן אמת כמה מגיעים, כמה לא, כמה עוד לא ענו" />
            <Row icon="📤" label="שיתוף" desc='לחץ "העתק הזמנה לשיתוף" — מעתיק טקסט מוכן לשליחה בוואטסאפ/טלגרם' />
            <Tip text="בדשבורד יופיע באנר צהוב כשיש הזמנות שעוד לא ענית עליהן" />
          </Section>

          {/* 6. חישגוזים */}
          <Section icon={ArrowLeft} title="חישגוזים (התחשבנות)">
            <Row icon="💸" label="מה זה חישגוז?" desc="חישוב מי חייב לשלם למי לאחר סיום הערב" />
            <Row icon="✅" label="סימון תשלום" desc='לחץ "סמן כשולם" לידך כשהעברת כסף — הסטטוס מתעדכן לכולם' />
            <Row icon="📊" label="מעקב" desc="ניתן לראות כמה חישגוזים שולמו וכמה ממתינים" />
          </Section>

          {/* 7. טבלת דירוג */}
          <Section icon={Trophy} title="טבלת דירוג (ליגה)">
            <Row icon="🏆" label="דירוג שחקנים" desc="מסודר לפי רווח/הפסד כולל בכל הסשנים" />
            <Row icon="📈" label="סטטיסטיקות" desc="רווח ממוצע, מספר ניצחונות, סשנים שהשתתף" />
            <Row icon="⚠️" label="מינימום משחקים" desc="שחקן חייב לפחות 2 משחקים כדי להופיע בטבלה" />
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
              <div>🧾 הוצאות → <code className="text-yellow-600">בדף הערב</code></div>
            </div>
          </div>

          <p className="text-center text-xs text-slate-700 pb-4">
            Poker League · כל הזכויות שמורות ♠️
          </p>
        </div>
    </AppShell>
  );
}
