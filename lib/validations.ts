import { prisma } from "./db";
import { SessionValidation, SubmissionProgress } from "@/types";

export async function getSessionValidation(sessionId: string): Promise<SessionValidation> {
  const results = await prisma.sessionParticipantResult.findMany({
    where: { sessionId },
    include: { user: true },
  });

  const errors: string[] = [];
  const missingPlayers = results
    .filter((r) => !r.isSubmitted)
    .map((r) => ({ userId: r.userId, name: r.user.name }));

  const allSubmitted = missingPlayers.length === 0;
  if (!allSubmitted) {
    errors.push(`${missingPlayers.length} שחקנים עדיין לא הגישו תוצאות`);
  }

  const totalProfitLoss = results.reduce((s, r) => s + r.profitLoss, 0);
  if (Math.abs(totalProfitLoss) > 0.01) {
    errors.push(`סכום הרווח/הפסד הכולל אינו מתאזן: ${totalProfitLoss.toFixed(2)} ₪ (חייב להיות 0)`);
  }

  return {
    isValid: errors.length === 0,
    allSubmitted,
    totalProfitLoss,
    missingPlayers,
    errors,
  };
}

export async function getSessionSubmissionProgress(sessionId: string): Promise<SubmissionProgress> {
  const results = await prisma.sessionParticipantResult.findMany({
    where: { sessionId },
    include: { user: true },
  });

  const submitted = results.filter((r) => r.isSubmitted).length;
  const pending = results
    .filter((r) => !r.isSubmitted)
    .map((r) => ({ userId: r.userId, name: r.user.name }));

  return { total: results.length, submitted, pending };
}
