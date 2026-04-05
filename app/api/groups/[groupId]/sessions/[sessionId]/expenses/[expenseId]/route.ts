import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { requireGroupMember } from "@/lib/permissions";

export async function DELETE(
  _req: Request,
  {
    params,
  }: { params: { groupId: string; sessionId: string; expenseId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "לא מחובר" }, { status: 401 });

  try {
    await requireGroupMember(params.groupId, session.user.id);

    const gameSession = await prisma.session.findUnique({
      where: { id: params.sessionId },
    });
    if (!gameSession || gameSession.groupId !== params.groupId)
      return NextResponse.json({ error: "סשן לא נמצא" }, { status: 404 });

    const expense = await prisma.sessionExpense.findUnique({
      where: { id: params.expenseId },
      include: { charges: { select: { status: true } } },
    });
    if (!expense || expense.sessionId !== params.sessionId)
      return NextResponse.json({ error: "הוצאה לא נמצאה" }, { status: 404 });

    // Check permission: only creator or group admin may delete
    const isCreator = expense.createdByUserId === session.user.id;
    const member = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: { groupId: params.groupId, userId: session.user.id },
      },
    });
    const isAdmin = member?.role === "ADMIN";

    if (!isCreator && !isAdmin)
      return NextResponse.json(
        { error: "אין הרשאה למחוק הוצאה זו" },
        { status: 403 }
      );

    // Disallow deletion if any charge is APPROVED
    const hasApproved = expense.charges.some((c) => c.status === "APPROVED");
    if (hasApproved)
      return NextResponse.json(
        { error: "יש תשלומים מאושרים" },
        { status: 400 }
      );

    // Cascade delete handled by Prisma schema (onDelete: Cascade on charges)
    await prisma.sessionExpense.delete({ where: { id: params.expenseId } });

    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "שגיאה";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
