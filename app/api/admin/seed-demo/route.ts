import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

const PLAYERS = [
  { name: "דוד כהן",     email: "david.cohen@demo.com"    },
  { name: "יוסי לוי",    email: "yossi.levi@demo.com"     },
  { name: "מיכל אברהם",  email: "michal.avraham@demo.com" },
  { name: "רועי בן-דוד", email: "roi.bendavid@demo.com"   },
  { name: "נועה שפירא",  email: "noa.shapira@demo.com"    },
  { name: "אמיר גולן",   email: "amir.golan@demo.com"     },
];

type PR = [number, number, number]; // [buyIn, rebuy, cashOut]

const SESSIONS: { daysAgo: number; location: string; players: PR[] }[] = [
  { daysAgo: 180, location: "בית דוד",   players: [[100,0,400],[100,100,250],[100,0,80],[100,0,30],[100,100,40],[100,100,100]] },
  { daysAgo: 168, location: "בית יוסי",  players: [[100,0,50],[100,0,320],[100,100,190],[100,100,180],[100,0,10],[100,100,150]] },
  { daysAgo: 154, location: "בית דוד",   players: [[100,100,500],[100,0,100],[100,0,120],[100,100,100],[100,100,80],[100,0,0]] },
  { daysAgo: 140, location: "בית מיכל",  players: [[100,0,280],[100,0,220],[100,100,200],[100,0,50],[100,100,50],[100,100,100]] },
  { daysAgo: 126, location: "בית יוסי",  players: [[100,0,400],[100,100,100],[100,0,150],[100,100,90],[100,0,60],[100,100,100]] },
  { daysAgo: 112, location: "בית רועי",  players: [[100,100,0],[100,0,50],[100,100,100],[100,100,30],[100,0,70],[100,0,650]] },
  { daysAgo: 98,  location: "בית דוד",   players: [[100,0,450],[100,100,250],[100,0,150],[100,100,50],[100,100,50],[100,100,50]] },
  { daysAgo: 84,  location: "בית נועה",  players: [[100,0,200],[100,0,300],[100,100,200],[100,0,100],[100,100,50],[100,100,50]] },
  { daysAgo: 70,  location: "בית יוסי",  players: [[100,100,100],[100,0,400],[100,0,200],[100,100,100],[100,100,100],[100,100,100]] },
  { daysAgo: 56,  location: "בית מיכל",  players: [[100,0,300],[100,100,200],[100,100,250],[100,0,100],[100,0,0],[100,100,50]] },
  { daysAgo: 49,  location: "בית דוד",   players: [[100,100,150],[100,0,250],[100,100,200],[100,0,200],[100,100,100],[100,0,0]] },
  { daysAgo: 42,  location: "בית רועי",  players: [[100,0,350],[100,0,100],[100,0,150],[100,100,100],[100,100,100],[100,100,100]] },
  { daysAgo: 28,  location: "בית אמיר",  players: [[100,0,200],[100,100,300],[100,0,200],[100,0,200],[100,100,0],[100,100,0]] },
  { daysAgo: 14,  location: "בית יוסי",  players: [[100,100,50],[100,0,300],[100,100,100],[100,0,250],[100,0,100],[100,100,100]] },
  { daysAgo: 7,   location: "בית דוד",   players: [[100,0,500],[100,0,200],[100,100,100],[100,100,100],[100,100,50],[100,100,50]] },
];

function computeSettlements(results: { userId: string; profitLoss: number }[]) {
  const debtors   = results.filter(r => r.profitLoss < 0).map(r => ({ ...r, amt: -r.profitLoss }));
  const creditors = results.filter(r => r.profitLoss > 0).map(r => ({ ...r, amt:  r.profitLoss }));
  const out: { fromUserId: string; toUserId: string; amount: number }[] = [];
  let di = 0, ci = 0;
  while (di < debtors.length && ci < creditors.length) {
    const d = debtors[di], c = creditors[ci];
    const amt = Math.min(d.amt, c.amt);
    if (amt > 0.01) out.push({ fromUserId: d.userId, toUserId: c.userId, amount: Math.round(amt * 100) / 100 });
    d.amt -= amt; c.amt -= amt;
    if (d.amt < 0.01) di++;
    if (c.amt < 0.01) ci++;
  }
  return out;
}

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "לא מחובר" }, { status: 401 });

  const me = await prisma.user.findUnique({ where: { id: session.user.id }, select: { email: true } });
  if (me?.email?.toLowerCase() !== process.env.SUPER_ADMIN_EMAIL?.toLowerCase())
    return NextResponse.json({ error: "סופר אדמין בלבד" }, { status: 403 });

  // Prevent duplicate
  const existing = await prisma.group.findFirst({ where: { name: "פוקר חברים" } });
  if (existing) return NextResponse.json({ error: "קבוצת הדמו כבר קיימת", groupId: existing.id }, { status: 409 });

  const hashedPassword = await bcrypt.hash("demo1234", 10);

  const users = await Promise.all(
    PLAYERS.map(p => prisma.user.upsert({
      where:  { email: p.email },
      update: { name: p.name },
      create: { name: p.name, email: p.email, passwordHash: hashedPassword },
    }))
  );

  const group = await prisma.group.create({
    data: {
      name:       "פוקר חברים",
      inviteCode: "FRIENDS24",
      ownerId:    users[0].id,
      members: { create: users.map((u, i) => ({ userId: u.id, role: i === 0 ? "ADMIN" : "MEMBER" })) },
    },
  });

  for (const sd of SESSIONS) {
    const date = new Date(Date.now() - sd.daysAgo * 24 * 60 * 60 * 1000);
    const sess = await prisma.session.create({
      data: { groupId: group.id, date, location: sd.location, status: "CLOSED", createdById: users[0].id },
    });

    const rows = sd.players.map((p, i) => {
      const [buyIn, rebuy, cashOut] = p;
      return { sessionId: sess.id, userId: users[i].id, buyIn, rebuy, cashOut, totalInvested: buyIn + rebuy, profitLoss: cashOut - buyIn - rebuy, finalCashOut: cashOut, isSubmitted: true, submittedAt: date };
    });
    await prisma.sessionParticipantResult.createMany({ data: rows });

    const settlements = computeSettlements(rows.map(r => ({ userId: r.userId, profitLoss: r.profitLoss })));
    if (settlements.length > 0)
      await prisma.settlement.createMany({ data: settlements.map(s => ({ ...s, sessionId: sess.id, isPaid: true, paidAt: date })) });
  }

  return NextResponse.json({ ok: true, groupId: group.id, message: "קבוצת הדמו נוצרה בהצלחה! 15 ערבים, 6 שחקנים." });
}
