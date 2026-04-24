import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { requireGroupMember, isGroupAdmin } from "@/lib/permissions";
import { syncParticipantResult } from "@/lib/financial-requests";
import { z } from "zod";

const patchSchema = z.object({
  finalCashOut: z.number().min(0, "Cash-out חייב להיות 0 או יותר"),
});

export async function PATCH(
  req: Request,
  { params }: { params: { groupId: string; sessionId: string; userId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "לא מחובר" }, { status: 401 });

  try {
    await requireGroupMember(params.groupId, session.user.id);

    const admin = await isGroupAdmin(params.groupId, session.user.id);

    // userId must equal authenticated user OR user must be session admin
    if (params.userId !== session.user.id && !admin) {
      return NextResponse.json({ error: "אין הרשאה לעדכן cash-out של משתמש אחר" }, { status: 403 });
    }

    const gameSession = await prisma.session.findUnique({ where: { id: params.sessionId } });
    if (!gameSession || gameSession.groupId !== params.groupId)
      return NextResponse.json({ error: "סשן לא נמצא" }, { status: 404 });

    if (gameSession.status !== "OPEN") {
      return NextResponse.json({ error: "הסשן אינו פתוח" }, { status: 400 });
    }

    const body = patchSchema.parse(await req.json());

    const participant = await prisma.sessionParticipantResult.findUnique({
      where: { sessionId_userId: { sessionId: params.sessionId, userId: params.userId } },
    });
    if (!participant) {
      return NextResponse.json({ error: "המשתתף לא נמצא בסשן" }, { status: 404 });
    }

    await prisma.sessionParticipantResult.update({
      where: { sessionId_userId: { sessionId: params.sessionId, userId: params.userId } },
      data: { finalCashOut: body.finalCashOut },
    });

    // Sync buyIn / rebuy / totalInvested / profitLoss / isSubmitted
    await syncParticipantResult(params.sessionId, params.userId);

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors[0]?.message ?? "שגיאת ולידציה" }, { status: 400 });
    }
    const msg = e instanceof Error ? e.message : "שגיאה";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
