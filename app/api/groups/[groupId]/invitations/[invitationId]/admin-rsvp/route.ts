import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { requireGroupAdmin } from "@/lib/permissions";
import { z } from "zod";
import { RSVPStatus } from "@prisma/client";

const schema = z.object({
  userId: z.string(),
  status: z.enum(["COMING", "NOT_COMING", "MAYBE"]),
});

// Admin RSVP on behalf of any group member
export async function POST(
  req: Request,
  { params }: { params: { groupId: string; invitationId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "לא מחובר" }, { status: 401 });

  await requireGroupAdmin(params.groupId, session.user.id);

  const body = schema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: "נתונים לא תקינים" }, { status: 400 });

  const { userId, status } = body.data;

  // Verify target user is a group member
  const member = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId: params.groupId, userId } },
  });
  if (!member) return NextResponse.json({ error: "המשתמש אינו חבר בקבוצה" }, { status: 404 });

  const [prevResponse, invitation] = await Promise.all([
    prisma.invitationResponse.findUnique({
      where: { invitationId_userId: { invitationId: params.invitationId, userId } },
    }),
    prisma.eventInvitation.findUnique({
      where: { id: params.invitationId },
      select: { sessionId: true },
    }),
  ]);

  const response = await prisma.invitationResponse.upsert({
    where: { invitationId_userId: { invitationId: params.invitationId, userId } },
    update: { status: status as RSVPStatus, respondedAt: new Date() },
    create: { invitationId: params.invitationId, userId, status: status as RSVPStatus },
  });

  // Sync with linked session (same logic as regular RSVP)
  const linkedSessionId = invitation?.sessionId;
  if (linkedSessionId) {
    const wasComingBefore = prevResponse?.status === "COMING";
    const isComingNow = status === "COMING";

    if (isComingNow && !wasComingBefore) {
      const linkedSession = await prisma.session.findUnique({ where: { id: linkedSessionId }, select: { status: true } });
      if (linkedSession?.status === "OPEN") {
        await prisma.sessionParticipantResult.upsert({
          where: { sessionId_userId: { sessionId: linkedSessionId, userId } },
          update: {},
          create: { sessionId: linkedSessionId, userId, buyIn: 0, rebuy: 0, cashOut: 0, totalInvested: 0, profitLoss: 0, finalCashOut: 0, maxDrawdown: 0, isSubmitted: false },
        });
      }
    } else if (!isComingNow && wasComingBefore) {
      const participant = await prisma.sessionParticipantResult.findUnique({
        where: { sessionId_userId: { sessionId: linkedSessionId, userId } },
      });
      if (participant && !participant.isSubmitted && participant.buyIn === 0) {
        await prisma.sessionParticipantResult.delete({ where: { sessionId_userId: { sessionId: linkedSessionId, userId } } });
      }
    }
  }

  return NextResponse.json(response);
}
