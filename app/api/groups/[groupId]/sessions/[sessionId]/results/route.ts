import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isGroupAdmin } from "@/lib/permissions";
import { z } from "zod";

const schema = z.object({
  userId: z.string().optional(), // admin can pass a userId to edit someone else
  buyIn: z.number().min(0),
  rebuy: z.number().min(0),
  cashOut: z.number().min(0),
});

export async function PUT(
  req: Request,
  { params }: { params: { groupId: string; sessionId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "לא מחובר" }, { status: 401 });

  try {
    const body = schema.parse(await req.json());
    const gameSession = await prisma.session.findUnique({ where: { id: params.sessionId } });
    if (!gameSession || gameSession.groupId !== params.groupId)
      return NextResponse.json({ error: "סשן לא נמצא" }, { status: 404 });

    const admin = await isGroupAdmin(params.groupId, session.user.id);
    const targetUserId = (admin && body.userId) ? body.userId : session.user.id;

    if (!admin && gameSession.status !== "OPEN") {
      return NextResponse.json({ error: "הסשן סגור" }, { status: 403 });
    }

    const existing = await prisma.sessionParticipantResult.findUnique({
      where: { sessionId_userId: { sessionId: params.sessionId, userId: targetUserId } },
    });
    if (!existing) return NextResponse.json({ error: "לא רשום כמשתתף" }, { status: 403 });

    if (!admin && existing.userId !== session.user.id) {
      return NextResponse.json({ error: "אין הרשאה לערוך תוצאה של משתמש אחר" }, { status: 403 });
    }

    const totalInvested = body.buyIn + body.rebuy;
    const profitLoss = body.cashOut - totalInvested;

    const updated = await prisma.sessionParticipantResult.update({
      where: { sessionId_userId: { sessionId: params.sessionId, userId: targetUserId } },
      data: {
        buyIn: body.buyIn,
        rebuy: body.rebuy,
        cashOut: body.cashOut,
        totalInvested,
        profitLoss,
        isSubmitted: true,
        submittedAt: existing.isSubmitted ? existing.submittedAt : new Date(),
      },
    });

    return NextResponse.json(updated);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "שגיאה";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
