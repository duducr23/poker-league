import { prisma } from "./db";
import { Period, PlayerStats, SessionHistoryItem } from "@/types";
import { getPeriodDateRange, calculateROI, calculateCurrentStreak, calculateLongestStreak } from "./utils";
import { format } from "date-fns";

export async function getPlayerStats(groupId: string, playerId: string, period: Period): Promise<PlayerStats | null> {
  const member = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId: playerId } },
    include: { user: true },
  });
  if (!member) return null;

  const range = getPeriodDateRange(period);

  const results = await prisma.sessionParticipantResult.findMany({
    where: {
      userId: playerId,
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
  const profitableNights = results.filter((r) => r.profitLoss > 0).length;
  const losingNights = results.filter((r) => r.profitLoss < 0).length;
  const breakEvenNights = results.filter((r) => r.profitLoss === 0).length;
  const totalInvested = results.reduce((s, r) => s + r.totalInvested, 0);
  const totalCashOut = results.reduce((s, r) => s + r.cashOut, 0);
  const totalProfitLoss = results.reduce((s, r) => s + r.profitLoss, 0);
  const bestNight = results.length ? Math.max(...results.map((r) => r.profitLoss)) : 0;
  const worstNight = results.length ? Math.min(...results.map((r) => r.profitLoss)) : 0;

  const sessionHistory: SessionHistoryItem[] = results.map((r) => ({
    sessionId: r.sessionId,
    date: r.session.date,
    location: r.session.location,
    buyIn: r.buyIn,
    rebuy: r.rebuy,
    cashOut: r.cashOut,
    totalInvested: r.totalInvested,
    profitLoss: r.profitLoss,
  }));

  // Cumulative chart
  let cumulative = 0;
  const cumulativeChart = results.map((r) => {
    cumulative += r.profitLoss;
    return { date: format(new Date(r.session.date), "dd/MM/yy"), cumulative };
  });

  // Monthly performance chart
  const monthlyMap = new Map<string, number>();
  for (const r of results) {
    const key = format(new Date(r.session.date), "MM/yyyy");
    monthlyMap.set(key, (monthlyMap.get(key) || 0) + r.profitLoss);
  }
  const monthlyChart = Array.from(monthlyMap.entries()).map(([month, profitLoss]) => ({ month, profitLoss }));

  return {
    userId: playerId,
    name: member.user.name,
    image: member.user.image,
    gamesPlayed,
    profitableNights,
    losingNights,
    breakEvenNights,
    successRate: gamesPlayed ? (profitableNights / gamesPlayed) * 100 : 0,
    totalInvested,
    totalCashOut,
    totalProfitLoss,
    avgProfitPerGame: gamesPlayed ? totalProfitLoss / gamesPlayed : 0,
    roi: calculateROI(totalProfitLoss, totalInvested),
    bestNight,
    worstNight,
    currentStreak: calculateCurrentStreak(results),
    longestWinStreak: calculateLongestStreak(results, "win"),
    longestLosingStreak: calculateLongestStreak(results, "loss"),
    sessionHistory,
    cumulativeChart,
    monthlyChart,
  };
}
