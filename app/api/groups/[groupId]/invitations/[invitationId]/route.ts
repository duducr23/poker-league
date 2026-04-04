import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const editSchema = z.object({
  title: z.string().min(1),
  date: z.string(),
  location: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function PATCH(
  req: Request,
  { params }: { params: { groupId: string; invitationId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "לא מחובר" }, { status: 401 });

  const invitation = await prisma.eventInvitation.findUnique({
    where: { id: params.invitationId },
    include: {
      group: { include: { members: { where: { userId: session.user.id } } } },
    },
  });
  if (!invitation) return NextResponse.json({ error: "לא נמצא" }, { status: 404 });

  const member = invitation.group.members[0];
  const isCreator = invitation.createdById === session.user.id;
  const isAdmin = member?.role === "ADMIN";
  if (!isCreator && !isAdmin) return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });

  const body = editSchema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: "נתונים לא תקינים" }, { status: 400 });

  const newDate = new Date(body.data.date);

  // Update invitation
  const updated = await prisma.eventInvitation.update({
    where: { id: params.invitationId },
    data: {
      title: body.data.title,
      date: newDate,
      location: body.data.location ?? null,
      notes: body.data.notes ?? null,
    },
  });

  // Sync the linked session's date/location/notes too (if it's still OPEN)
  if (invitation.sessionId) {
    const linkedSession = await prisma.session.findUnique({
      where: { id: invitation.sessionId },
      select: { status: true },
    });
    if (linkedSession?.status === "OPEN") {
      await prisma.session.update({
        where: { id: invitation.sessionId },
        data: {
          date: newDate,
          location: body.data.location ?? null,
        },
      });
    }
  }

  return NextResponse.json(updated);
}

export async function DELETE(
  req: Request,
  { params }: { params: { groupId: string; invitationId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "לא מחובר" }, { status: 401 });

  const invitation = await prisma.eventInvitation.findUnique({
    where: { id: params.invitationId },
    include: {
      group: { include: { members: { where: { userId: session.user.id } } } },
    },
  });
  if (!invitation) return NextResponse.json({ error: "לא נמצא" }, { status: 404 });

  const member = invitation.group.members[0];
  const isCreator = invitation.createdById === session.user.id;
  const isAdmin = member?.role === "ADMIN";
  if (!isCreator && !isAdmin) return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });

  const linkedSessionId = invitation.sessionId;

  await prisma.eventInvitation.delete({ where: { id: params.invitationId } });

  // If the invitation had a linked session that is still OPEN and empty — delete it too
  if (linkedSessionId) {
    const linkedSession = await prisma.session.findUnique({
      where: { id: linkedSessionId },
      include: { results: true, financialRequests: true },
    });
    if (
      linkedSession &&
      linkedSession.status === "OPEN" &&
      linkedSession.financialRequests.length === 0 &&
      linkedSession.results.every(r => r.buyIn === 0 && r.totalInvested === 0 && !r.isSubmitted)
    ) {
      await prisma.session.delete({ where: { id: linkedSessionId } });
    }
  }

  return NextResponse.json({ ok: true });
}
