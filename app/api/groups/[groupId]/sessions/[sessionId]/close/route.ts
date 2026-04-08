import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { requireGroupAdmin } from "@/lib/permissions";
import { getSessionValidation } from "@/lib/validations";
import { computeAndSaveSettlements } from "@/lib/settlements";
import { computeAndSaveAchievements } from "@/lib/achievements";
import { validateSessionBeforeClose } from "@/lib/financial-requests";
import { sendWebPushToUsers } from "@/lib/push";
import { buildPayload } from "@/lib/push-payloads";

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

    const validation = await getSessionValidation(params.sessionId);
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.errors.join(", "), validation }, { status: 400 });
    }

    // Additional validation for sessions using the financial-requests system
    const financialValidation = await validateSessionBeforeClose(params.sessionId);
    if (!financialValidation.valid) {
      return NextResponse.json(
        { error: financialValidation.errors.join(", "), validation: { ...validation, errors: [...validation.errors, ...financialValidation.errors], isValid: false } },
        { status: 400 }
      );
    }

    const updated = await prisma.session.update({
      where: { id: params.sessionId },
      data: { status: "CLOSED" },
    });

    // Delete linked invitation (if exists) so it won't appear on invitations page
    await prisma.eventInvitation.deleteMany({ where: { sessionId: params.sessionId } });

    // Compute settlements & achievements after closing (non-blocking errors)
    await Promise.allSettled([
      computeAndSaveSettlements(params.sessionId),
      computeAndSaveAchievements(params.sessionId, params.groupId),
    ]);

    // Notify all participants (fire-and-forget)
    prisma.sessionParticipantResult.findMany({
      where: { sessionId: params.sessionId },
      select: { userId: true },
    }).then((participants) => {
      const participantIds = participants
        .map((p) => p.userId)
        .filter((id) => id !== session.user.id);
      if (participantIds.length > 0) {
        sendWebPushToUsers(participantIds, buildPayload("SESSION_CLOSED", {
          groupId: params.groupId,
          sessionId: params.sessionId,
        })).catch(() => {});
      }
    }).catch(() => {});

    return NextResponse.json(updated);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "שגיאה";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
