import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

function isSuperAdmin(email?: string | null) {
  return !!email && email.toLowerCase() === process.env.SUPER_ADMIN_EMAIL?.toLowerCase();
}

// POST — assign a user to a specific group as MEMBER
export async function POST(
  req: Request,
  { params }: { params: { userId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!isSuperAdmin(session?.user?.email))
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });

  const { groupId } = z.object({ groupId: z.string().min(1) }).parse(await req.json());

  try {
    const existing = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: params.userId } },
    });
    if (existing)
      return NextResponse.json({ error: "המשתמש כבר חבר בקבוצה זו" }, { status: 400 });

    const member = await prisma.groupMember.create({
      data: { groupId, userId: params.userId, role: "MEMBER" },
    });
    return NextResponse.json(member);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "שגיאה";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
