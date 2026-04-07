import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { requireGroupAdmin } from "@/lib/permissions";
import { computeAndSaveSettlements } from "@/lib/settlements";
import { computeAndSaveAchievements } from "@/lib/achievements";

export async function POST(
  _req: Request,
  { params }: { params: { groupId: string; sessionId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "לא מחובר" }, { status: 401 });

  try {
    await requireGroupAdmin(params.groupId, session.user.id);

    const gameSession = await prisma.session.findUnique({ where: { id: params.sessionId } });
    if (!gameSession || gameSession.groupId !== params.groupId)
      return NextResponse.json({ error: "סשן לא נמצא" }, { status: 404 });

    if (gameSession.status !== "OPEN")
      return NextResponse.json({ error: "הסשן כבר סגור" }, { status: 400 });

    // Step 1: Find all unsubmitted participants
    const unsubmitted = await prisma.sessionParticipantResult.findMany({
      where: { sessionId: params.sessionId, isSubmitted: false },
    });

    // Step 2: Submit each unsubmitted participant with their current values
    if (unsubmitted.length > 0) {
      const now = new Date();
      await Promise.all(
        unsubmitted.map((p) =>
          prisma.sessionParticipantResult.update({
            where: { id: p.id },
            data: {
              isSubmitted: true,
              submittedAt: now,
            },
          })
        )
      );
    }

    // Step 3: Check balance — totalProfitLoss must be 0
    const allResults = await prisma.sessionParticipantResult.findMany({
      where: { sessionId: params.sessionId },
    });

    const totalProfitLoss = allResults.reduce((sum, r) => sum + r.profitLoss, 0);
    if (Math.abs(totalProfitLoss) > 0.01) {
      return NextResponse.json(
        {
          error: `סכום הרווח/הפסד הכולל אינו מתאזן: ${totalProfitLoss.toFixed(2)} ₪ (חייב להיות 0)`,
          totalProfitLoss,
        },
        { status: 400 }
      );
    }

    // Step 4: Close the session
    const updated = await prisma.session.update({
      where: { id: params.sessionId },
      data: { status: "CLOSED" },
    });

    // Compute settlements & achievements after closing (non-blocking errors)
    await Promise.allSettled([
      computeAndSaveSettlements(params.sessionId),
      computeAndSaveAchievements(params.sessionId, params.groupId),
    ]);

    return NextResponse.json(updated);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "שגיאה";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
