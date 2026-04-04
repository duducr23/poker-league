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
    const members = await prisma.groupMember.findMany({
      where: { groupId: params.groupId },
      include: { user: { select: { id: true, name: true } } },
    });
    return NextResponse.json(members.map((m) => ({ id: m.userId, name: m.user.name, role: m.role, isFrozen: m.isFrozen })));
  } catch {
    return NextResponse.json({ error: "שגיאה" }, { status: 500 });
  }
}
