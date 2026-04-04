import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const schema = z.object({ inviteCode: z.string().min(1) });

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "לא מחובר" }, { status: 401 });

  try {
    const { inviteCode } = schema.parse(await req.json());
    const group = await prisma.group.findUnique({ where: { inviteCode } });
    if (!group) return NextResponse.json({ error: "קוד הזמנה לא נמצא" }, { status: 404 });

    const existing = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: group.id, userId: session.user.id } },
    });
    if (existing) return NextResponse.json({ error: "כבר חבר בקבוצה" }, { status: 400 });

    await prisma.groupMember.create({
      data: { groupId: group.id, userId: session.user.id },
    });

    return NextResponse.json({ groupId: group.id, name: group.name });
  } catch {
    return NextResponse.json({ error: "שגיאה בהצטרפות" }, { status: 500 });
  }
}
