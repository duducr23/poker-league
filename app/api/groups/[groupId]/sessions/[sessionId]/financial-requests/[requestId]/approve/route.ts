import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { requireGroupMember } from "@/lib/permissions";
import { syncParticipantResult } from "@/lib/financial-requests";

export async function POST(
  _req: Request,
  { params }: { params: { groupId: string; sessionId: string; requestId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "לא מחובר" }, { status: 401 });

  try {
    await requireGroupMember(params.groupId, session.user.id);

    const gameSession = await prisma.session.findUnique({ where: { id: params.sessionId } });
    if (!gameSession || gameSession.groupId !== params.groupId)
      return NextResponse.json({ error: "סשן לא נמצא" }, { status: 404 });

    if (gameSession.status !== "OPEN") {
      return NextResponse.json({ error: "הסשן אינו פתוח" }, { status: 400 });
    }

    // Approver must be a session participant
    const approverParticipant = await prisma.sessionParticipantResult.findUnique({
      where: { sessionId_userId: { sessionId: params.sessionId, userId: session.user.id } },
    });
    if (!approverParticipant) {
      return NextResponse.json({ error: "רק משתתף בסשן יכול לאשר בקשות" }, { status: 403 });
    }

    const financialRequest = await prisma.sessionFinancialRequest.findUnique({
      where: { id: params.requestId },
    });
    if (!financialRequest || financialRequest.sessionId !== params.sessionId) {
      return NextResponse.json({ error: "בקשה לא נמצאה" }, { status: 404 });
    }

    // Approver cannot be the requester
    if (financialRequest.userId === session.user.id) {
      return NextResponse.json({ error: "לא ניתן לאשר את הבקשה שלך" }, { status: 403 });
    }

    if (financialRequest.status !== "PENDING") {
      return NextResponse.json({ error: "הבקשה כבר טופלה" }, { status: 400 });
    }

    // For INITIAL_BUYIN: re-check no other approved INITIAL_BUYIN exists
    if (financialRequest.type === "INITIAL_BUYIN") {
      const existing = await prisma.sessionFinancialRequest.findFirst({
        where: {
          sessionId: params.sessionId,
          userId: financialRequest.userId,
          type: "INITIAL_BUYIN",
          status: "APPROVED",
          id: { not: params.requestId },
        },
      });
      if (existing) {
        return NextResponse.json({ error: "כבר יש buy-in מאושר לשחקן זה" }, { status: 400 });
      }
    }

    const updated = await prisma.sessionFinancialRequest.update({
      where: { id: params.requestId },
      data: {
        status: "APPROVED",
        approvedByUserId: session.user.id,
        approvedAt: new Date(),
      },
      include: {
        user: { select: { id: true, name: true, image: true } },
        createdBy: { select: { id: true, name: true } },
        approvedBy: { select: { id: true, name: true } },
        declinedBy: { select: { id: true, name: true } },
      },
    });

    // Sync SessionParticipantResult so close-session validation passes
    await syncParticipantResult(params.sessionId, financialRequest.userId);

    return NextResponse.json(updated);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "שגיאה";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
