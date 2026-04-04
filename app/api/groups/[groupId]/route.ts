import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { requireGroupAdmin } from "@/lib/permissions";

// DELETE — delete entire group (admin only)
export async function DELETE(
  _req: Request,
  { params }: { params: { groupId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "לא מחובר" }, { status: 401 });

  try {
    await requireGroupAdmin(params.groupId, session.user.id);

    // Cascade delete: results → sessions → members → group
    await prisma.sessionParticipantResult.deleteMany({
      where: { session: { groupId: params.groupId } },
    });
    await prisma.settlement.deleteMany({
      where: { session: { groupId: params.groupId } },
    });
    await prisma.achievement.deleteMany({ where: { groupId: params.groupId } });
    await prisma.session.deleteMany({ where: { groupId: params.groupId } });
    await prisma.groupMember.deleteMany({ where: { groupId: params.groupId } });
    await prisma.group.delete({ where: { id: params.groupId } });

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "שגיאה";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
