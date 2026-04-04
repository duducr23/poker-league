import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { RSVPStatus } from "@prisma/client";

const schema = z.object({
  status: z.enum(["COMING", "NOT_COMING", "MAYBE"]),
});

export async function POST(
  req: Request,
  { params }: { params: { groupId: string; invitationId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "לא מחובר" }, { status: 401 });

  const member = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId: params.groupId, userId: session.user.id } },
  });
  if (!member) return NextResponse.json({ error: "אין גישה" }, { status: 403 });

  const body = schema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: "נתונים לא תקינים" }, { status: 400 });

  // Get the previous response + invitation's linked session
  const [prevResponse, invitation] = await Promise.all([
    prisma.invitationResponse.findUnique({
      where: { invitationId_userId: { invitationId: params.invitationId, userId: session.user.id } },
    }),
    prisma.eventInvitation.findUnique({
      where: { id: params.invitationId },
      select: { sessionId: true },
    }),
  ]);

  const linkedSessionId = invitation?.sessionId;

  // Upsert the RSVP response
  const response = await prisma.invitationResponse.upsert({
    where: {
      invitationId_userId: {
        invitationId: params.invitationId,
        userId: session.user.id,
      },
    },
    update: { status: body.data.status as RSVPStatus, respondedAt: new Date() },
    create: {
      invitationId: params.invitationId,
      userId: session.user.id,
      status: body.data.status as RSVPStatus,
    },
  });

  // Sync with linked session if present
  if (linkedSessionId) {
    const newStatus = body.data.status;
    const wasComingBefore = prevResponse?.status === "COMING";
    const isComingNow = newStatus === "COMING";

    if (isComingNow && !wasComingBefore) {
      // Add user as participant in the linked session (if session is still OPEN)
      const linkedSession = await prisma.session.findUnique({
        where: { id: linkedSessionId },
        select: { status: true },
      });
      if (linkedSession?.status === "OPEN") {
        await prisma.sessionParticipantResult.upsert({
          where: { sessionId_userId: { sessionId: linkedSessionId, userId: session.user.id } },
          update: {}, // don't overwrite if already exists
          create: {
            sessionId: linkedSessionId,
            userId: session.user.id,
            buyIn: 0,
            rebuy: 0,
            addons: 0,
            cashOut: 0,
            totalInvested: 0,
            profitLoss: 0,
            finalCashOut: 0,
            maxDrawdown: 0,
            isSubmitted: false,
          },
        });
      }
    } else if (!isComingNow && wasComingBefore) {
      // Remove user from the linked session only if they haven't started a buy-in
      const participant = await prisma.sessionParticipantResult.findUnique({
        where: { sessionId_userId: { sessionId: linkedSessionId, userId: session.user.id } },
      });
      if (participant && !participant.isSubmitted && participant.buyIn === 0 && participant.totalInvested === 0) {
        await prisma.sessionParticipantResult.delete({
          where: { sessionId_userId: { sessionId: linkedSessionId, userId: session.user.id } },
        });
      }
    }
  }

  return NextResponse.json(response);
}
