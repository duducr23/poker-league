import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { requireGroupAdmin } from "@/lib/permissions";
import { z } from "zod";

const schema = z.object({ userId: z.string().min(1) });

// POST — add a participant to an existing session
export async function POST(
  req: Request,
  { params }: { params: { groupId: string; sessionId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "לא מחובר" }, { status: 401 });

  try {
    await requireGroupAdmin(params.groupId, session.user.id);

    const gameSession = await prisma.session.findUnique({ where: { id: params.sessionId } });
    if (!gameSession || gameSession.groupId !== params.groupId)
      return NextResponse.json({ error: "סשן לא נמצא" }, { status: 404 });

    const { userId } = schema.parse(await req.json());

    // Must be a group member
    const member = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: params.groupId, userId } },
    });
    if (!member) return NextResponse.json({ error: "המשתמש אינו חבר בקבוצה" }, { status: 400 });

    // Must not already be in session
    const existing = await prisma.sessionParticipantResult.findUnique({
      where: { sessionId_userId: { sessionId: params.sessionId, userId } },
    });
    if (existing) return NextResponse.json({ error: "השחקן כבר רשום בסשן" }, { status: 400 });

    const result = await prisma.sessionParticipantResult.create({
      data: { sessionId: params.sessionId, userId, isSubmitted: false },
    });

    return NextResponse.json(result);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "שגיאה";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// DELETE — remove a participant (only if not submitted)
export async function DELETE(
  req: Request,
  { params }: { params: { groupId: string; sessionId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "לא מחובר" }, { status: 401 });

  try {
    await requireGroupAdmin(params.groupId, session.user.id);
    const { userId } = schema.parse(await req.json());

    const existing = await prisma.sessionParticipantResult.findUnique({
      where: { sessionId_userId: { sessionId: params.sessionId, userId } },
    });
    if (!existing) return NextResponse.json({ error: "משתתף לא נמצא" }, { status: 404 });

    await prisma.sessionParticipantResult.delete({
      where: { sessionId_userId: { sessionId: params.sessionId, userId } },
    });

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "שגיאה";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
