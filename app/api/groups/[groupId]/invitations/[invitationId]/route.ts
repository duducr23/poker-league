import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function DELETE(
  req: Request,
  { params }: { params: { groupId: string; invitationId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "לא מחובר" }, { status: 401 });

  const invitation = await prisma.eventInvitation.findUnique({
    where: { id: params.invitationId },
    include: {
      group: {
        include: { members: { where: { userId: session.user.id } } },
      },
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
