/**
 * seed-demo-group.ts
 * Creates "פוקר חברים" demo group with 6 players and 15 closed sessions
 * Run: npx tsx scripts/seed-demo-group.ts
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// ── Players ───────────────────────────────────────────────────────────────────

const PLAYERS = [
  { name: "דוד כהן",      email: "david.cohen@demo.com"   },
  { name: "יוסי לוי",     email: "yossi.levi@demo.com"    },
  { name: "מיכל אברהם",   email: "michal.avraham@demo.com"},
  { name: "רועי בן-דוד",  email: "roi.bendavid@demo.com"  },
  { name: "נועה שפירא",   email: "noa.shapira@demo.com"   },
  { name: "אמיר גולן",    email: "amir.golan@demo.com"    },
];

// ── Session data ──────────────────────────────────────────────────────────────
// Each row: [buyIn, rebuy, cashOut] per player (P0..P5)
// profitLoss = cashOut - buyIn - rebuy   |   sum per session must = 0

type PlayerResult = [number, number, number]; // [buyIn, rebuy, cashOut]
type SessionData  = { daysAgo: number; location: string; players: PlayerResult[] };

const SESSIONS: SessionData[] = [
  {
    daysAgo: 180, location: "בית דוד",
    players: [
      [100,   0, 400],  // P0 +300
      [100, 100, 250],  // P1  +50
      [100,   0,  80],  // P2  -20
      [100,   0,  30],  // P3  -70
      [100, 100,  40],  // P4 -160
      [100, 100, 100],  // P5 -100
    ],
  },
  {
    daysAgo: 168, location: "בית יוסי",
    players: [
      [100,   0,  50],  // P0  -50
      [100,   0, 320],  // P1 +220
      [100, 100, 190],  // P2  -10
      [100, 100, 180],  // P3  -20
      [100,   0,  10],  // P4  -90
      [100, 100, 150],  // P5  -50
    ],
  },
  {
    daysAgo: 154, location: "בית דוד",
    players: [
      [100, 100, 500],  // P0 +300
      [100,   0, 100],  // P1    0
      [100,   0, 120],  // P2  +20
      [100, 100, 100],  // P3 -100
      [100, 100,  80],  // P4 -120
      [100,   0,   0],  // P5 -100
    ],
  },
  {
    daysAgo: 140, location: "בית מיכל",
    players: [
      [100,   0, 280],  // P0 +180
      [100,   0, 220],  // P1 +120
      [100, 100, 200],  // P2    0
      [100,   0,  50],  // P3  -50
      [100, 100,  50],  // P4 -150
      [100, 100, 100],  // P5 -100
    ],
  },
  {
    daysAgo: 126, location: "בית יוסי",
    players: [
      [100,   0, 400],  // P0 +300
      [100, 100, 100],  // P1 -100
      [100,   0, 150],  // P2  +50
      [100, 100,  90],  // P3 -110
      [100,   0,  60],  // P4  -40
      [100, 100, 100],  // P5 -100
    ],
  },
  {
    daysAgo: 112, location: "בית רועי",
    players: [
      [100, 100,   0],  // P0 -200
      [100,   0,  50],  // P1  -50
      [100, 100, 100],  // P2 -100
      [100, 100,  30],  // P3 -170
      [100,   0,  70],  // P4  -30
      [100,   0, 650],  // P5 +550
    ],
  },
  {
    daysAgo: 98, location: "בית דוד",
    players: [
      [100,   0, 450],  // P0 +350
      [100, 100, 250],  // P1  +50
      [100,   0, 150],  // P2  +50
      [100, 100,  50],  // P3 -150
      [100, 100,  50],  // P4 -150
      [100, 100,  50],  // P5 -150
    ],
  },
  {
    daysAgo: 84, location: "בית נועה",
    players: [
      [100,   0, 200],  // P0 +100
      [100,   0, 300],  // P1 +200
      [100, 100, 200],  // P2    0
      [100,   0, 100],  // P3    0
      [100, 100,  50],  // P4 -150
      [100, 100,  50],  // P5 -150
    ],
  },
  {
    daysAgo: 70, location: "בית יוסי",
    players: [
      [100, 100, 100],  // P0 -100
      [100,   0, 400],  // P1 +300
      [100,   0, 200],  // P2 +100
      [100, 100, 100],  // P3 -100
      [100, 100, 100],  // P4 -100
      [100, 100, 100],  // P5 -100
    ],
  },
  {
    daysAgo: 56, location: "בית מיכל",
    players: [
      [100,   0, 300],  // P0 +200
      [100, 100, 200],  // P1    0
      [100, 100, 250],  // P2  +50
      [100,   0, 100],  // P3    0
      [100,   0,   0],  // P4 -100
      [100, 100,  50],  // P5 -150
    ],
  },
  {
    daysAgo: 49, location: "בית דוד",
    players: [
      [100, 100, 150],  // P0  -50
      [100,   0, 250],  // P1 +150
      [100, 100, 200],  // P2    0
      [100,   0, 200],  // P3 +100
      [100, 100, 100],  // P4 -100
      [100,   0,   0],  // P5 -100
    ],
  },
  {
    daysAgo: 42, location: "בית רועי",
    players: [
      [100,   0, 350],  // P0 +250
      [100,   0, 100],  // P1    0
      [100,   0, 150],  // P2  +50
      [100, 100, 100],  // P3 -100
      [100, 100, 100],  // P4 -100
      [100, 100, 100],  // P5 -100
    ],
  },
  {
    daysAgo: 28, location: "בית אמיר",
    players: [
      [100,   0, 200],  // P0 +100
      [100, 100, 300],  // P1 +100
      [100,   0, 200],  // P2 +100
      [100,   0, 200],  // P3 +100
      [100, 100,   0],  // P4 -200
      [100, 100,   0],  // P5 -200
    ],
  },
  {
    daysAgo: 14, location: "בית יוסי",
    players: [
      [100, 100,  50],  // P0 -150
      [100,   0, 300],  // P1 +200
      [100, 100, 100],  // P2 -100
      [100,   0, 250],  // P3 +150
      [100,   0, 100],  // P4    0
      [100, 100, 100],  // P5 -100
    ],
  },
  {
    daysAgo: 7, location: "בית דוד",
    players: [
      [100,   0, 500],  // P0 +400
      [100,   0, 200],  // P1 +100
      [100, 100, 100],  // P2 -100
      [100, 100, 100],  // P3 -100
      [100, 100,  50],  // P4 -150
      [100, 100,  50],  // P5 -150
    ],
  },
];

// ── Settlements helper ────────────────────────────────────────────────────────

function computeSettlements(
  results: { userId: string; profitLoss: number }[]
): { fromUserId: string; toUserId: string; amount: number }[] {
  const debtors  = results.filter(r => r.profitLoss < 0).map(r => ({ ...r, amount: -r.profitLoss }));
  const creditors = results.filter(r => r.profitLoss > 0).map(r => ({ ...r, amount: r.profitLoss }));
  const settlements: { fromUserId: string; toUserId: string; amount: number }[] = [];

  let di = 0, ci = 0;
  while (di < debtors.length && ci < creditors.length) {
    const d = debtors[di];
    const c = creditors[ci];
    const amt = Math.min(d.amount, c.amount);
    if (amt > 0.01) settlements.push({ fromUserId: d.userId, toUserId: c.userId, amount: Math.round(amt * 100) / 100 });
    d.amount -= amt;
    c.amount -= amt;
    if (d.amount < 0.01) di++;
    if (c.amount < 0.01) ci++;
  }
  return settlements;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🃏  Seeding demo group...\n");

  const hashedPassword = await bcrypt.hash("demo1234", 10);

  // 1. Create / upsert users
  const users = await Promise.all(
    PLAYERS.map((p) =>
      prisma.user.upsert({
        where:  { email: p.email },
        update: { name: p.name },
        create: { name: p.name, email: p.email, passwordHash: hashedPassword },
      })
    )
  );
  console.log(`✅  ${users.length} users created/found`);

  // 2. Create group (P0 is admin/owner)
  const group = await prisma.group.create({
    data: {
      name:      "פוקר חברים",
      inviteCode: "FRIENDS24",
      ownerId:    users[0].id,
      members: {
        create: users.map((u, i) => ({
          userId: u.id,
          role:   i === 0 ? "ADMIN" : "MEMBER",
        })),
      },
    },
  });
  console.log(`✅  Group "${group.name}" created  (id: ${group.id})`);

  // 3. Create sessions
  let sessionCount = 0;
  for (const sd of SESSIONS) {
    const date = new Date(Date.now() - sd.daysAgo * 24 * 60 * 60 * 1000);

    const session = await prisma.session.create({
      data: {
        groupId:     group.id,
        date,
        location:    sd.location,
        status:      "CLOSED",
        createdById: users[0].id,
      },
    });

    // Build result rows
    const resultRows = sd.players.map((p, i) => {
      const [buyIn, rebuy, cashOut] = p;
      const profitLoss  = cashOut - buyIn - rebuy;
      const totalInvested = buyIn + rebuy;
      return {
        sessionId:    session.id,
        userId:       users[i].id,
        buyIn,
        rebuy,
        cashOut,
        totalInvested,
        profitLoss,
        finalCashOut:  cashOut,
        isSubmitted:   true,
        submittedAt:   date,
      };
    });

    await prisma.sessionParticipantResult.createMany({ data: resultRows });

    // Compute & save settlements
    const settlementData = computeSettlements(
      resultRows.map((r) => ({ userId: r.userId, profitLoss: r.profitLoss }))
    );
    if (settlementData.length > 0) {
      await prisma.settlement.createMany({
        data: settlementData.map((s) => ({
          sessionId:  session.id,
          fromUserId: s.fromUserId,
          toUserId:   s.toUserId,
          amount:     s.amount,
          isPaid:     true,
          paidAt:     date,
        })),
      });
    }

    sessionCount++;
    const profitLine = resultRows.map(r => (r.profitLoss >= 0 ? "+" : "") + r.profitLoss).join(" | ");
    console.log(`   S${String(sessionCount).padStart(2,"0")}  ${sd.location.padEnd(12)}  [${profitLine}]`);
  }

  console.log(`\n✅  ${sessionCount} sessions created`);

  // 4. Print summary
  console.log("\n📊  Player totals:");
  for (let i = 0; i < users.length; i++) {
    const total = SESSIONS.reduce((sum, s) => {
      const [b, r, c] = s.players[i];
      return sum + (c - b - r);
    }, 0);
    console.log(`   ${PLAYERS[i].name.padEnd(14)}  ${total >= 0 ? "+" : ""}${total} ₪`);
  }

  console.log(`\n🎉  Done!  Group invite code: FRIENDS24`);
  console.log(`   Login with any player: password = demo1234`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
