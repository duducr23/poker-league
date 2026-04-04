import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { requireGroupMember } from "@/lib/permissions";

// PATCH /api/groups/[groupId]/settlements/[settlementId] — toggle isPaid
export async function PATCH(
  _req: Request,
  { params }: { params: { groupId: string; settlementId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "לא מחובר" }, { status: 401 });

  try {
    await requireGroupMember(params.groupId, session.user.id);

    const settlement = await prisma.settlement.findUnique({
      where: { id: params.settlementId },
      include: { session: { select: { groupId: true } } },
    });

    if (!settlement || settlement.session.groupId !== params.groupId)
      return NextResponse.json({ error: "פשרה לא נמצאה" }, { status: 404 });

    // Only the payer or an admin can mark as paid
    const isInvolved =
      settlement.fromUserId === session.user.id ||
      settlement.toUserId === session.user.id;

    const member = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: params.groupId, userId: session.user.id } },
    });
    const isAdmin = member?.role === "ADMIN";

    if (!isInvolved && !isAdmin)
      return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });

    const updated = await prisma.settlement.update({
      where: { id: params.settlementId },
      data: { isPaid: !settlement.isPaid, paidAt: !settlement.isPaid ? new Date() : null },
    });

    return NextResponse.json(updated);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "שגיאה";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
