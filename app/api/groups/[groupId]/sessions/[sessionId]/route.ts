import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { requireGroupMember, isGroupAdmin } from "@/lib/permissions";

export async function GET(_req: Request, { params }: { params: { groupId: string; sessionId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "לא מחובר" }, { status: 401 });

  try {
    await requireGroupMember(params.groupId, session.user.id);
    const s = await prisma.session.findUnique({
      where: { id: params.sessionId },
      include: { results: { include: { user: { select: { id: true, name: true } } } } },
    });
    if (!s || s.groupId !== params.groupId) return NextResponse.json({ error: "לא נמצא" }, { status: 404 });

    const admin = await isGroupAdmin(params.groupId, session.user.id);

    return NextResponse.json({
      id: s.id, groupId: s.groupId, date: s.date, location: s.location,
      notes: s.notes, status: s.status, isAdmin: admin,
      results: s.results.map((r) => ({
        userId: r.userId, userName: r.user.name,
        buyIn: r.buyIn, rebuy: r.rebuy, addons: r.addons, cashOut: r.cashOut,
        totalInvested: r.totalInvested, profitLoss: r.profitLoss,
        finalCashOut: r.finalCashOut, maxDrawdown: r.maxDrawdown,
        isSubmitted: r.isSubmitted, submittedAt: r.submittedAt,
      })),
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "שגיאה";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { groupId: string; sessionId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "לא מחובר" }, { status: 401 });
  try {
    const { requireGroupAdmin } = await import("@/lib/permissions");
    await requireGroupAdmin(params.groupId, session.user.id);
    await prisma.session.delete({ where: { id: params.sessionId } });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "שגיאה";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
