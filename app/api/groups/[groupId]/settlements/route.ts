import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { requireGroupMember } from "@/lib/permissions";

export async function GET(_req: Request, { params }: { params: { groupId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "לא מחובר" }, { status: 401 });

  try {
    await requireGroupMember(params.groupId, session.user.id);

    const settlements = await prisma.settlement.findMany({
      where: { session: { groupId: params.groupId } },
      include: {
        fromUser: { select: { id: true, name: true } },
        toUser: { select: { id: true, name: true } },
        session: { select: { id: true, date: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(
      settlements.map((s) => ({
        id: s.id,
        sessionId: s.sessionId,
        sessionDate: s.session.date,
        fromUserId: s.fromUserId,
        fromUserName: s.fromUser.name,
        toUserId: s.toUserId,
        toUserName: s.toUser.name,
        amount: s.amount,
        isPaid: s.isPaid,
        paidAt: s.paidAt,
      }))
    );
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "שגיאה";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
