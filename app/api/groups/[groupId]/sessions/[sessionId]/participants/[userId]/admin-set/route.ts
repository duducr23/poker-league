import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { requireGroupAdmin } from "@/lib/permissions";
import { z } from "zod";

const schema = z.object({
  buyIn: z.number().min(0),
  addRebuyAmount: z.number().min(0).default(0), // adds a new rebuy on top of existing ones
  cashOut: z.number().min(0),
});

export async function PATCH(
  req: Request,
  { params }: { params: { groupId: string; sessionId: string; userId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "לא מחובר" }, { status: 401 });

  try {
    await requireGroupAdmin(params.groupId, session.user.id);

    const gameSession = await prisma.session.findUnique({ where: { id: params.sessionId } });
    if (!gameSession || gameSession.groupId !== params.groupId)
      return NextResponse.json({ error: "סשן לא נמצא" }, { status: 404 });

    if (gameSession.status !== "OPEN")
      return NextResponse.json({ error: "הסשן אינו פתוח" }, { status: 400 });

    const participant = await prisma.sessionParticipantResult.findUnique({
      where: { sessionId_userId: { sessionId: params.sessionId, userId: params.userId } },
    });
    if (!participant)
      return NextResponse.json({ error: "המשתתף לא נמצא בסשן" }, { status: 404 });

    const body = schema.parse(await req.json());

    await prisma.$transaction(async (tx) => {
      // ── Buy-in ────────────────────────────────────────────────────────────
      // Decline any pending buy-in requests
      await tx.sessionFinancialRequest.updateMany({
        where: {
          sessionId: params.sessionId,
          userId: params.userId,
          type: "INITIAL_BUYIN",
          status: "PENDING",
        },
        data: { status: "DECLINED", declinedByUserId: session.user.id, declinedAt: new Date() },
      });

      const approvedBuyIn = await tx.sessionFinancialRequest.findFirst({
        where: {
          sessionId: params.sessionId,
          userId: params.userId,
          type: "INITIAL_BUYIN",
          status: "APPROVED",
        },
      });

      if (body.buyIn > 0) {
        if (approvedBuyIn) {
          // Update existing approved buy-in
          await tx.sessionFinancialRequest.update({
            where: { id: approvedBuyIn.id },
            data: { amount: body.buyIn },
          });
        } else {
          // Create new approved buy-in directly
          await tx.sessionFinancialRequest.create({
            data: {
              sessionId: params.sessionId,
              userId: params.userId,
              type: "INITIAL_BUYIN",
              amount: body.buyIn,
              status: "APPROVED",
              createdByUserId: session.user.id,
              approvedByUserId: session.user.id,
              approvedAt: new Date(),
            },
          });
        }
      } else if (approvedBuyIn) {
        // Buy-in set to 0 — decline it
        await tx.sessionFinancialRequest.update({
          where: { id: approvedBuyIn.id },
          data: { status: "DECLINED", declinedByUserId: session.user.id, declinedAt: new Date() },
        });
      }

      // ── Rebuys ────────────────────────────────────────────────────────────
      // Decline only pending rebuys — keep all approved ones intact
      await tx.sessionFinancialRequest.updateMany({
        where: {
          sessionId: params.sessionId,
          userId: params.userId,
          type: "REBUY",
          status: "PENDING",
        },
        data: { status: "DECLINED", declinedByUserId: session.user.id, declinedAt: new Date() },
      });

      // Add a new approved rebuy record (never replaces existing ones)
      if (body.addRebuyAmount > 0) {
        await tx.sessionFinancialRequest.create({
          data: {
            sessionId: params.sessionId,
            userId: params.userId,
            type: "REBUY",
            amount: body.addRebuyAmount,
            status: "APPROVED",
            createdByUserId: session.user.id,
            approvedByUserId: session.user.id,
            approvedAt: new Date(),
          },
        });
      }

      // ── Cash-out ─────────────────────────────────────────────────────────
      await tx.sessionParticipantResult.update({
        where: { sessionId_userId: { sessionId: params.sessionId, userId: params.userId } },
        data: { finalCashOut: body.cashOut },
      });
    });

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    if (e instanceof z.ZodError)
      return NextResponse.json({ error: e.errors[0]?.message ?? "נתונים לא תקינים" }, { status: 400 });
    const msg = e instanceof Error ? e.message : "שגיאה";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
