import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { requireGroupAdmin } from "@/lib/permissions";

// PATCH — toggle isFrozen for a group member
export async function PATCH(
  _req: Request,
  { params }: { params: { groupId: string; userId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "לא מחובר" }, { status: 401 });

  try {
    await requireGroupAdmin(params.groupId, session.user.id);

    const member = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: params.groupId, userId: params.userId } },
    });
    if (!member) return NextResponse.json({ error: "חבר לא נמצא" }, { status: 404 });

    // Cannot freeze the group owner / another admin
    if (member.role === "ADMIN")
      return NextResponse.json({ error: "לא ניתן להקפיא מנהל" }, { status: 400 });

    const updated = await prisma.groupMember.update({
      where: { groupId_userId: { groupId: params.groupId, userId: params.userId } },
      data: { isFrozen: !member.isFrozen },
    });

    return NextResponse.json({ isFrozen: updated.isFrozen });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "שגיאה";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
