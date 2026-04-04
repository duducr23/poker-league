import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  inviteCode: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, inviteCode } = schema.parse(body);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "כתובת האימייל כבר קיימת" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { name, email, passwordHash } });

    let groupId: string | undefined;
    if (inviteCode) {
      const group = await prisma.group.findUnique({ where: { inviteCode } });
      if (group) {
        await prisma.groupMember.create({
          data: { groupId: group.id, userId: user.id, role: "MEMBER" },
        });
        groupId = group.id;
      }
    }

    return NextResponse.json({ id: user.id, name: user.name, email: user.email, groupId });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "נתונים לא תקינים" }, { status: 400 });
    }
    return NextResponse.json({ error: "שגיאה בשרת" }, { status: 500 });
  }
}
