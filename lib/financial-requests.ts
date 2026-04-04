import { prisma } from "./db";

export async function getApprovedRequests(sessionId: string, userId: string) {
  return prisma.sessionFinancialRequest.findMany({
    where: { sessionId, userId, status: "APPROVED" },
    orderBy: { createdAt: "asc" },
  });
}

export async function getApprovedInitialBuyIn(sessionId: string, userId: string): Promise<number> {
  const req = await prisma.sessionFinancialRequest.findFirst({
    where: { sessionId, userId, type: "INITIAL_BUYIN", status: "APPROVED" },
  });
  return req?.amount ?? 0;
}

export async function getApprovedRebuyTotal(sessionId: string, userId: string): Promise<number> {
  const reqs = await prisma.sessionFinancialRequest.findMany({
    where: { sessionId, userId, type: "REBUY", status: "APPROVED" },
  });
  return reqs.reduce((sum, r) => sum + r.amount, 0);
}

export async function getParticipantLiveSummary(sessionId: string, userId: string) {
  const [result, requests] = await Promise.all([
    prisma.sessionParticipantResult.findUnique({ where: { sessionId_userId: { sessionId, userId } } }),
    prisma.sessionFinancialRequest.findMany({
      where: { sessionId, userId },
      include: {
        approvedBy: { select: { id: true, name: true } },
        declinedBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const approvedInitialBuyIn = requests.find(r => r.type === "INITIAL_BUYIN" && r.status === "APPROVED")?.amount ?? 0;
  const approvedRebuyTotal = requests.filter(r => r.type === "REBUY" && r.status === "APPROVED").reduce((s, r) => s + r.amount, 0);
  const totalApprovedInvested = approvedInitialBuyIn + approvedRebuyTotal;
  const finalCashOut = result?.finalCashOut ?? 0;
  const profitLoss = finalCashOut - totalApprovedInvested;
  const pendingCount = requests.filter(r => r.status === "PENDING").length;
  const declinedCount = requests.filter(r => r.status === "DECLINED").length;

  return {
    approvedInitialBuyIn,
    approvedRebuyTotal,
    totalApprovedInvested,
    finalCashOut,
    profitLoss,
    pendingCount,
    declinedCount,
    requests,
  };
}

export async function calculateDrawdown(sessionId: string, userId: string): Promise<number> {
  const [result, requests] = await Promise.all([
    prisma.sessionParticipantResult.findUnique({ where: { sessionId_userId: { sessionId, userId } } }),
    prisma.sessionFinancialRequest.findMany({
      where: { sessionId, userId, status: "APPROVED" },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  let cumulative = 0;
  let maxDrawdown = 0;

  for (const req of requests) {
    cumulative -= req.amount;
    if (Math.abs(cumulative) > maxDrawdown) maxDrawdown = Math.abs(cumulative);
  }

  const finalCashOut = result?.finalCashOut ?? 0;
  if (finalCashOut > 0) cumulative += finalCashOut;
  // maxDrawdown is the peak negative position
  return maxDrawdown;
}

export async function calculateSessionSettlements(sessionId: string) {
  const results = await prisma.sessionParticipantResult.findMany({
    where: { sessionId },
    include: { user: { select: { id: true, name: true } } },
  });

  // Use approved requests + finalCashOut
  const summaries = await Promise.all(
    results.map(async (r) => {
      const approvedInitialBuyIn = await getApprovedInitialBuyIn(sessionId, r.userId);
      const approvedRebuyTotal = await getApprovedRebuyTotal(sessionId, r.userId);
      const totalInvested = approvedInitialBuyIn + approvedRebuyTotal;
      const finalCashOut = r.finalCashOut;
      return {
        userId: r.userId,
        name: r.user.name,
        profitLoss: finalCashOut - totalInvested,
      };
    })
  );

  // Minimize transfers
  const losers = summaries.filter(s => s.profitLoss < 0).map(s => ({ ...s, amount: Math.abs(s.profitLoss) }));
  const winners = summaries.filter(s => s.profitLoss > 0).map(s => ({ ...s, amount: s.profitLoss }));

  const settlements: { from: string; fromName: string; to: string; toName: string; amount: number }[] = [];

  let i = 0, j = 0;
  while (i < losers.length && j < winners.length) {
    const transfer = Math.min(losers[i].amount, winners[j].amount);
    if (transfer > 0.01) {
      settlements.push({
        from: losers[i].userId,
        fromName: losers[i].name,
        to: winners[j].userId,
        toName: winners[j].name,
        amount: Math.round(transfer * 100) / 100,
      });
    }
    losers[i].amount -= transfer;
    winners[j].amount -= transfer;
    if (losers[i].amount < 0.01) i++;
    if (winners[j].amount < 0.01) j++;
  }

  return settlements;
}

export async function validateSessionBeforeClose(sessionId: string): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = [];

  // Only run these checks if any financial requests exist for this session
  const requestCount = await prisma.sessionFinancialRequest.count({ where: { sessionId } });
  if (requestCount === 0) {
    // No financial requests — new system not used, skip new-system validation
    return { valid: true, errors: [] };
  }

  const [participants, pendingRequests] = await Promise.all([
    prisma.sessionParticipantResult.findMany({ where: { sessionId } }),
    prisma.sessionFinancialRequest.findMany({ where: { sessionId, status: "PENDING" } }),
  ]);

  if (pendingRequests.length > 0) {
    errors.push(`יש ${pendingRequests.length} בקשות ממתינות לאישור`);
  }

  for (const p of participants) {
    const buyIn = await getApprovedInitialBuyIn(sessionId, p.userId);
    if (buyIn === 0) {
      const user = await prisma.user.findUnique({ where: { id: p.userId }, select: { name: true } });
      errors.push(`${user?.name ?? p.userId} — אין buy-in מאושר`);
    }
  }

  // Validate zero-sum
  let totalPL = 0;
  for (const p of participants) {
    const buyIn = await getApprovedInitialBuyIn(sessionId, p.userId);
    const rebuy = await getApprovedRebuyTotal(sessionId, p.userId);
    totalPL += p.finalCashOut - buyIn - rebuy;
  }

  if (Math.abs(totalPL) > 1) {
    errors.push(`סכום רווח/הפסד אינו מתאזן: ${totalPL.toFixed(2)}₪`);
  }

  return { valid: errors.length === 0, errors };
}
