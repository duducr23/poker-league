import { prisma } from "./db";
import { calculateCurrentStreak } from "./utils";

interface AchievementDef {
  type: string;
  label: string;
  value?: number;
}

/**
 * Awards new achievements for a player after a session is closed.
 * Skips already-awarded achievements to prevent duplicates.
 */
export async function computeAndSaveAchievements(
  sessionId: string,
  groupId: string
): Promise<void> {
  const results = await prisma.sessionParticipantResult.findMany({
    where: { sessionId, isSubmitted: true },
    include: { user: { select: { id: true, name: true } } },
  });

  for (const result of results) {
    const userId = result.userId;
    const toAward: AchievementDef[] = [];

    // Fetch all closed results for this player in this group (chronological)
    const allResults = await prisma.sessionParticipantResult.findMany({
      where: {
        userId,
        isSubmitted: true,
        session: { groupId, status: "CLOSED" },
      },
      include: { session: true },
      orderBy: { session: { date: "asc" } },
    });

    const gamesPlayed = allResults.length;
    const currentStreak = calculateCurrentStreak(allResults);

    // Fetch already awarded achievements for this player+group
    const existing = await prisma.achievement.findMany({
      where: { userId, groupId },
      select: { type: true },
    });
    const existingTypes = new Set(existing.map((a) => a.type));

    // FIRST_WIN
    if (result.profitLoss > 0 && !existingTypes.has("FIRST_WIN")) {
      const prevWins = allResults.filter(
        (r) => r.sessionId !== sessionId && r.profitLoss > 0
      ).length;
      if (prevWins === 0) {
        toAward.push({ type: "FIRST_WIN", label: "ניצחון ראשון 🏆" });
      }
    }

    // WIN_STREAK_3
    if (currentStreak >= 3 && !existingTypes.has("WIN_STREAK_3")) {
      toAward.push({ type: "WIN_STREAK_3", label: "רצף של 3 ניצחונות 🔥" });
    }

    // WIN_STREAK_5
    if (currentStreak >= 5 && !existingTypes.has("WIN_STREAK_5")) {
      toAward.push({ type: "WIN_STREAK_5", label: "רצף של 5 ניצחונות 🔥🔥" });
    }

    // WIN_STREAK_10
    if (currentStreak >= 10 && !existingTypes.has("WIN_STREAK_10")) {
      toAward.push({ type: "WIN_STREAK_10", label: "רצף של 10 ניצחונות 👑" });
    }

    // GAMES milestones
    for (const milestone of [10, 25, 50, 100]) {
      const type = `GAMES_${milestone}`;
      if (gamesPlayed >= milestone && !existingTypes.has(type)) {
        toAward.push({ type, label: `${milestone} משחקים 🎯`, value: milestone });
      }
    }

    // COMEBACK_KING — won after 3+ consecutive losses
    if (result.profitLoss > 0 && !existingTypes.has("COMEBACK_KING")) {
      const prevResults = allResults.filter((r) => r.sessionId !== sessionId);
      if (prevResults.length >= 3) {
        const lastThree = prevResults.slice(-3);
        if (lastThree.every((r) => r.profitLoss < 0)) {
          toAward.push({
            type: "COMEBACK_KING",
            label: "קאמבאק קינג 💪",
            value: result.profitLoss,
          });
        }
      }
    }

    // BIG_WIN — single session profit >= 500
    if (result.profitLoss >= 500) {
      const type = "BIG_WIN";
      // Allow multiple, but only one per session
      const alreadyThisSession = await prisma.achievement.findFirst({
        where: { userId, groupId, sessionId, type },
      });
      if (!alreadyThisSession) {
        toAward.push({ type, label: `ניצחון גדול (+₪${Math.round(result.profitLoss)}) 💰`, value: result.profitLoss });
      }
    }

    if (toAward.length === 0) continue;

    await prisma.achievement.createMany({
      data: toAward.map((a) => ({
        userId,
        groupId,
        sessionId,
        type: a.type,
        label: a.label,
        value: a.value ?? null,
      })),
    });
  }
}
