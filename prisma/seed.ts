import { PrismaClient, GroupRole, SessionStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  await prisma.sessionParticipantResult.deleteMany();
  await prisma.session.deleteMany();
  await prisma.groupMember.deleteMany();
  await prisma.group.deleteMany();
  await prisma.user.deleteMany();

  const hash = await bcrypt.hash("password123", 10);

  const admin = await prisma.user.create({ data: { name: "ישראל ישראלי", email: "admin@poker.com", passwordHash: hash } });
  const players = await Promise.all([
    prisma.user.create({ data: { name: "משה כהן",    email: "moshe@poker.com",  passwordHash: hash } }),
    prisma.user.create({ data: { name: "דוד לוי",    email: "david@poker.com",  passwordHash: hash } }),
    prisma.user.create({ data: { name: "יוסי אברהם", email: "yossi@poker.com",  passwordHash: hash } }),
    prisma.user.create({ data: { name: "אלי מזרחי",  email: "eli@poker.com",    passwordHash: hash } }),
    prisma.user.create({ data: { name: "רוני גולן",  email: "roni@poker.com",   passwordHash: hash } }),
  ]);
  const allUsers = [admin, ...players];

  const group = await prisma.group.create({
    data: { name: "ג'נטלמנס פוקר", inviteCode: "POKER2024", ownerId: admin.id },
  });

  await prisma.groupMember.create({ data: { groupId: group.id, userId: admin.id, role: GroupRole.ADMIN } });
  for (const p of players) {
    await prisma.groupMember.create({ data: { groupId: group.id, userId: p.id, role: GroupRole.MEMBER } });
  }

  type PlayerResult = { userId: string; buyIn: number; rebuy: number; cashOut: number };

  async function createClosedSession(date: Date, location: string, results: PlayerResult[]) {
    const totalIn  = results.reduce((s, r) => s + r.buyIn + r.rebuy, 0);
    const totalOut = results.reduce((s, r) => s + r.cashOut, 0);
    if (Math.abs(totalOut - totalIn) > 0.01) {
      throw new Error(`Session unbalanced: in=${totalIn} out=${totalOut} diff=${totalOut-totalIn}`);
    }
    const session = await prisma.session.create({
      data: { groupId: group.id, date, location, status: SessionStatus.CLOSED, createdById: admin.id },
    });
    for (const r of results) {
      const totalInvested = r.buyIn + r.rebuy;
      const profitLoss    = r.cashOut - totalInvested;
      await prisma.sessionParticipantResult.create({
        data: {
          sessionId: session.id, userId: r.userId,
          buyIn: r.buyIn, rebuy: r.rebuy, cashOut: r.cashOut,
          totalInvested, profitLoss, isSubmitted: true, submittedAt: date,
        },
      });
    }
    return session;
  }

  const [p1, p2, p3, p4, p5] = players;
  const now = new Date();
  const mo  = (offset: number) => new Date(now.getFullYear(), now.getMonth() - offset, 10 + offset);

  await createClosedSession(mo(11), "בית ישראל",   [
    { userId: admin.id, buyIn:200, rebuy:0,   cashOut:750 },
    { userId: p1.id,    buyIn:200, rebuy:100, cashOut:50  },
    { userId: p2.id,    buyIn:200, rebuy:0,   cashOut:100 },
    { userId: p3.id,    buyIn:200, rebuy:0,   cashOut:200 },
    { userId: p4.id,    buyIn:200, rebuy:100, cashOut:300 },
    { userId: p5.id,    buyIn:200, rebuy:0,   cashOut:0   },
  ]);
  await createClosedSession(mo(10), "בית משה",     [
    { userId: admin.id, buyIn:200, rebuy:0,   cashOut:350 },
    { userId: p1.id,    buyIn:200, rebuy:0,   cashOut:400 },
    { userId: p2.id,    buyIn:200, rebuy:100, cashOut:100 },
    { userId: p3.id,    buyIn:200, rebuy:0,   cashOut:150 },
    { userId: p4.id,    buyIn:200, rebuy:0,   cashOut:0   },
    { userId: p5.id,    buyIn:200, rebuy:0,   cashOut:300 },
  ]);
  await createClosedSession(mo(9),  "קלאב 8",      [
    { userId: admin.id, buyIn:300, rebuy:100, cashOut:1200 },
    { userId: p1.id,    buyIn:300, rebuy:0,   cashOut:100  },
    { userId: p2.id,    buyIn:300, rebuy:0,   cashOut:300  },
    { userId: p3.id,    buyIn:300, rebuy:100, cashOut:0    },
    { userId: p4.id,    buyIn:300, rebuy:0,   cashOut:400  },
    { userId: p5.id,    buyIn:300, rebuy:0,   cashOut:0    },
  ]);
  await createClosedSession(mo(8),  "בית דוד",     [
    { userId: admin.id, buyIn:200, rebuy:0,   cashOut:300 },
    { userId: p1.id,    buyIn:200, rebuy:0,   cashOut:250 },
    { userId: p2.id,    buyIn:200, rebuy:100, cashOut:500 },
    { userId: p3.id,    buyIn:200, rebuy:0,   cashOut:50  },
    { userId: p4.id,    buyIn:200, rebuy:0,   cashOut:200 },
    { userId: p5.id,    buyIn:200, rebuy:0,   cashOut:0   },
  ]);
  await createClosedSession(mo(7),  "בית יוסי",    [
    { userId: admin.id, buyIn:200, rebuy:100, cashOut:500 },
    { userId: p1.id,    buyIn:200, rebuy:0,   cashOut:200 },
    { userId: p2.id,    buyIn:200, rebuy:0,   cashOut:0   },
    { userId: p3.id,    buyIn:200, rebuy:0,   cashOut:400 },
    { userId: p4.id,    buyIn:200, rebuy:100, cashOut:0   },
    { userId: p5.id,    buyIn:200, rebuy:0,   cashOut:300 },
  ]);
  await createClosedSession(mo(6),  "בית אלי",     [
    { userId: admin.id, buyIn:200, rebuy:0,   cashOut:700 },
    { userId: p1.id,    buyIn:200, rebuy:0,   cashOut:200 },
    { userId: p2.id,    buyIn:200, rebuy:0,   cashOut:100 },
    { userId: p3.id,    buyIn:200, rebuy:100, cashOut:0   },
    { userId: p4.id,    buyIn:200, rebuy:0,   cashOut:200 },
    { userId: p5.id,    buyIn:200, rebuy:0,   cashOut:100 },
  ]);
  await createClosedSession(mo(5),  "פינגווין",    [
    { userId: admin.id, buyIn:300, rebuy:0,   cashOut:650 },
    { userId: p1.id,    buyIn:300, rebuy:0,   cashOut:600 },
    { userId: p2.id,    buyIn:300, rebuy:100, cashOut:0   },
    { userId: p3.id,    buyIn:300, rebuy:0,   cashOut:300 },
    { userId: p4.id,    buyIn:300, rebuy:0,   cashOut:0   },
    { userId: p5.id,    buyIn:300, rebuy:0,   cashOut:350 },
  ]);
  await createClosedSession(mo(4),  "בית רוני",    [
    { userId: admin.id, buyIn:200, rebuy:0,   cashOut:800 },
    { userId: p1.id,    buyIn:200, rebuy:100, cashOut:0   },
    { userId: p2.id,    buyIn:200, rebuy:0,   cashOut:200 },
    { userId: p3.id,    buyIn:200, rebuy:0,   cashOut:100 },
    { userId: p4.id,    buyIn:200, rebuy:100, cashOut:300 },
    { userId: p5.id,    buyIn:200, rebuy:0,   cashOut:0   },
  ]);
  await createClosedSession(mo(3),  "קזינו רמת גן",[
    { userId: admin.id, buyIn:500, rebuy:0,   cashOut:1200 },
    { userId: p1.id,    buyIn:500, rebuy:0,   cashOut:800  },
    { userId: p2.id,    buyIn:500, rebuy:0,   cashOut:500  },
    { userId: p3.id,    buyIn:500, rebuy:0,   cashOut:0    },
    { userId: p4.id,    buyIn:500, rebuy:0,   cashOut:0    },
    { userId: p5.id,    buyIn:500, rebuy:0,   cashOut:500  },
  ]);
  await createClosedSession(mo(2),  "בית ישראל 2", [
    { userId: admin.id, buyIn:200, rebuy:100, cashOut:800 },
    { userId: p1.id,    buyIn:200, rebuy:0,   cashOut:0   },
    { userId: p2.id,    buyIn:200, rebuy:0,   cashOut:200 },
    { userId: p3.id,    buyIn:200, rebuy:0,   cashOut:0   },
    { userId: p4.id,    buyIn:200, rebuy:100, cashOut:400 },
    { userId: p5.id,    buyIn:200, rebuy:0,   cashOut:0   },
  ]);
  await createClosedSession(mo(1),  "בית משה 2",   [
    { userId: admin.id, buyIn:200, rebuy:0,   cashOut:500 },
    { userId: p1.id,    buyIn:200, rebuy:0,   cashOut:300 },
    { userId: p2.id,    buyIn:200, rebuy:0,   cashOut:200 },
    { userId: p3.id,    buyIn:200, rebuy:100, cashOut:300 },
    { userId: p4.id,    buyIn:200, rebuy:0,   cashOut:0   },
    { userId: p5.id,    buyIn:200, rebuy:0,   cashOut:0   },
  ]);
  await createClosedSession(
    new Date(now.getFullYear(), now.getMonth(), 5),
    "ערב שישי",
    [
      { userId: admin.id, buyIn:300, rebuy:0,   cashOut:1100 },
      { userId: p1.id,    buyIn:300, rebuy:0,   cashOut:0    },
      { userId: p2.id,    buyIn:300, rebuy:100, cashOut:400  },
      { userId: p3.id,    buyIn:300, rebuy:0,   cashOut:200  },
      { userId: p4.id,    buyIn:300, rebuy:0,   cashOut:200  },
      { userId: p5.id,    buyIn:300, rebuy:0,   cashOut:0    },
    ]
  );

  // One OPEN session — admin and p1 submitted, rest pending
  const openSession = await prisma.session.create({
    data: { groupId: group.id, date: new Date(), location: "בית דוד — ערב פתוח", status: SessionStatus.OPEN, createdById: admin.id },
  });
  for (const u of allUsers) {
    await prisma.sessionParticipantResult.create({ data: { sessionId: openSession.id, userId: u.id, isSubmitted: false } });
  }
  await prisma.sessionParticipantResult.update({
    where: { sessionId_userId: { sessionId: openSession.id, userId: admin.id } },
    data: { buyIn:200, rebuy:0, cashOut:0, totalInvested:200, profitLoss:-200, isSubmitted:true, submittedAt:new Date() },
  });
  await prisma.sessionParticipantResult.update({
    where: { sessionId_userId: { sessionId: openSession.id, userId: p1.id } },
    data: { buyIn:200, rebuy:100, cashOut:300, totalInvested:300, profitLoss:0, isSubmitted:true, submittedAt:new Date() },
  });

  console.log("Seed complete!");
  console.log("Admin:   admin@poker.com / password123");
  console.log("Players: moshe@poker.com, david@poker.com, yossi@poker.com, eli@poker.com, roni@poker.com / password123");
  console.log("Group invite code: POKER2024");
}

main().catch(console.error).finally(() => prisma.$disconnect());
