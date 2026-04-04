import { prisma } from "./db";
import { Period, LeaderboardRow } from "@/types";
import { getPeriodDateRange, calculateROI, calculateCurrentStreak } from "./utils";

export const LEADERBOARD_MIN_GAMES = 2;

export async function getLeaderboard(groupId: string, period: Period): Promise<LeaderboardRow[]> {
  const range = getPeriodDateRange(period);

  const members = await prisma.groupMember.findMany({
    where: { groupId, isFrozen: false }, // exclude frozen players
    include: { user: true },
  });

  const rows: LeaderboardRow[] = [];

  for (const member of members) {
    const results = await prisma.sessionParticipantResult.findMany({
      where: {
        userId: member.userId,
        isSubmitted: true,
        session: {
          groupId,
          status: "CLOSED",
          ...(range ? { date: { gte: range.from, lte: range.to } } : {}),
        },
      },
      include: { session: true },
      orderBy: { session: { date: "asc" } },
    });

    const gamesPlayed = results.length;

    // Skip players below minimum games threshold
    if (gamesPlayed < LEADERBOARD_MIN_GAMES) continue;

    const profitableNights = results.filter((r) => r.profitLoss > 0).length;
    const losingNights = results.filter((r) => r.profitLoss < 0).length;
    const breakEvenNights = results.filter((r) => r.profitLoss === 0).length;
    const totalInvested = results.reduce((s, r) => s + r.totalInvested, 0);
    const totalCashOut = results.reduce((s, r) => s + r.cashOut, 0);
    const totalProfitLoss = results.reduce((s, r) => s + r.profitLoss, 0);

    rows.push({
      rank: 0,
      userId: member.userId,
      name: member.user.name,
      image: member.user.image,
      gamesPlayed,
      profitableNights,
      losingNights,
      breakEvenNights,
      successRate: (profitableNights / gamesPlayed) * 100,
      totalInvested,
      totalCashOut,
      totalProfitLoss,
      avgProfitPerGame: totalProfitLoss / gamesPlayed,
      roi: calculateROI(totalProfitLoss, totalInvested),
      currentStreak: calculateCurrentStreak(results),
    });
  }

  rows.sort((a, b) => b.totalProfitLoss - a.totalProfitLoss);
  rows.forEach((r, i) => (r.rank = i + 1));

  return rows;
}
