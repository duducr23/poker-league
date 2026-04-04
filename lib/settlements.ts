import { prisma } from "./db";

interface ParticipantBalance {
  userId: string;
  name: string;
  balance: number; // positive = owed money, negative = owes money
}

/**
 * Computes the minimal set of transactions to settle all debts in a session.
 * Uses a greedy algorithm: match largest debtor with largest creditor.
 */
export function computeSettlements(
  results: { userId: string; name: string; profitLoss: number }[]
): { fromUserId: string; toUserId: string; amount: number }[] {
  const debtors: ParticipantBalance[] = results
    .filter((r) => r.profitLoss < 0)
    .map((r) => ({ userId: r.userId, name: r.name, balance: -r.profitLoss }))
    .sort((a, b) => b.balance - a.balance);

  const creditors: ParticipantBalance[] = results
    .filter((r) => r.profitLoss > 0)
    .map((r) => ({ userId: r.userId, name: r.name, balance: r.profitLoss }))
    .sort((a, b) => b.balance - a.balance);

  const settlements: { fromUserId: string; toUserId: string; amount: number }[] = [];

  let di = 0;
  let ci = 0;

  while (di < debtors.length && ci < creditors.length) {
    const amount = Math.min(debtors[di].balance, creditors[ci].balance);
    if (amount >= 1) {
      settlements.push({
        fromUserId: debtors[di].userId,
        toUserId: creditors[ci].userId,
        amount: Math.round(amount),
      });
    }
    debtors[di].balance -= amount;
    creditors[ci].balance -= amount;
    if (debtors[di].balance < 0.5) di++;
    if (creditors[ci].balance < 0.5) ci++;
  }

  return settlements;
}

/**
 * Computes and persists settlements for a closed session.
 * Safe to call multiple times — deletes existing settlements first.
 */
export async function computeAndSaveSettlements(sessionId: string): Promise<void> {
  const results = await prisma.sessionParticipantResult.findMany({
    where: { sessionId, isSubmitted: true },
    include: { user: { select: { id: true, name: true } } },
  });

  // Remove old settlements for this session
  await prisma.settlement.deleteMany({ where: { sessionId } });

  const settlements = computeSettlements(
    results.map((r) => ({ userId: r.userId, name: r.user.name, profitLoss: r.profitLoss }))
  );

  if (settlements.length === 0) return;

  await prisma.settlement.createMany({
    data: settlements.map((s) => ({ ...s, sessionId })),
  });
}
