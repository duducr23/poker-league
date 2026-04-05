import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

function isSuperAdmin(email?: string | null) {
  return !!email && email.toLowerCase() === process.env.SUPER_ADMIN_EMAIL?.toLowerCase();
}

// PATCH — rename group
export async function PATCH(
  req: Request,
  { params }: { params: { groupId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!isSuperAdmin(session?.user?.email))
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });

  try {
    const { name } = z.object({ name: z.string().min(1) }).parse(await req.json());
    const group = await prisma.group.update({ where: { id: params.groupId }, data: { name } });
    return NextResponse.json(group);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "שגיאה";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// POST — join group as a regular player
export async function POST(
  _req: Request,
  { params }: { params: { groupId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!isSuperAdmin(session?.user?.email))
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  if (!session?.user?.id)
    return NextResponse.json({ error: "לא מחובר" }, { status: 401 });

  try {
    const existing = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: params.groupId, userId: session.user.id } },
    });
    if (existing) return NextResponse.json({ error: "כבר חבר בקבוצה" }, { status: 400 });

    const member = await prisma.groupMember.create({
      data: { groupId: params.groupId, userId: session.user.id, role: "MEMBER" },
    });
    return NextResponse.json(member);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "שגיאה";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
