import { prisma } from "./db";
import { GroupInsights } from "@/types";
import { calculateCurrentStreak } from "./utils";

export async function getGroupInsights(groupId: string): Promise<GroupInsights> {
  const members = await prisma.groupMember.findMany({
    where: { groupId },
    include: { user: { select: { id: true, name: true } } },
  });

  let hottest: GroupInsights["hottest"] = null;
  let coldest: GroupInsights["coldest"] = null;
  let mostImproved: GroupInsights["mostImproved"] = null;
  let biggestComeback: GroupInsights["biggestComeback"] = null;

  for (const member of members) {
    const results = await prisma.sessionParticipantResult.findMany({
      where: {
        userId: member.userId,
        isSubmitted: true,
        session: { groupId, status: "CLOSED" },
      },
      include: { session: { select: { date: true } } },
      orderBy: { session: { date: "asc" } },
    });

    if (results.length < 2) continue;

    const streak = calculateCurrentStreak(results);

    // Hottest streak
    if (streak > 0) {
      if (!hottest || streak > hottest.streak) {
        hottest = { userId: member.userId, name: member.user.name, streak };
      }
    }

    // Coldest streak
    if (streak < 0) {
      const absStreak = Math.abs(streak);
      if (!coldest || absStreak > coldest.streak) {
        coldest = { userId: member.userId, name: member.user.name, streak: absStreak };
      }
    }

    // Most improved — compare avg P/L of last 3 vs previous 3
    if (results.length >= 6) {
      const last3 = results.slice(-3);
      const prev3 = results.slice(-6, -3);
      const avgLast = last3.reduce((s, r) => s + r.profitLoss, 0) / 3;
      const avgPrev = prev3.reduce((s, r) => s + r.profitLoss, 0) / 3;
      const improvement = avgLast - avgPrev;
      if (!mostImproved || improvement > mostImproved.improvement) {
        mostImproved = { userId: member.userId, name: member.user.name, improvement };
      }
    }

    // Biggest comeback — largest recovery from cumulative low point
    let cumulative = 0;
    let minCumulative = 0;
    let maxRecovery = 0;
    let recoveryDate: Date = results[0].session.date;

    for (const r of results) {
      cumulative += r.profitLoss;
      if (cumulative < minCumulative) {
        minCumulative = cumulative;
      }
      const recovery = cumulative - minCumulative;
      if (recovery > maxRecovery) {
        maxRecovery = recovery;
        recoveryDate = r.session.date;
      }
    }

    if (maxRecovery > 0) {
      if (!biggestComeback || maxRecovery > biggestComeback.amount) {
        biggestComeback = {
          userId: member.userId,
          name: member.user.name,
          amount: maxRecovery,
          date: recoveryDate,
        };
      }
    }
  }

  return { hottest, coldest, mostImproved, biggestComeback };
}
