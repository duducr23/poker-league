import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import bcrypt from "bcryptjs";

function isSuperAdmin(email?: string | null) {
  return !!email && email.toLowerCase() === process.env.SUPER_ADMIN_EMAIL?.toLowerCase();
}

const schema = z.object({
  canCreateGroup: z.boolean().optional(),
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: { userId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!isSuperAdmin(session?.user?.email)) {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }

  const body = schema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: "נתונים לא תקינים" }, { status: 400 });

  const data: Record<string, unknown> = {};
  if (body.data.canCreateGroup !== undefined) data.canCreateGroup = body.data.canCreateGroup;
  if (body.data.name) data.name = body.data.name;
  if (body.data.email) data.email = body.data.email;
  if (body.data.password) data.password = await bcrypt.hash(body.data.password, 10);

  if (Object.keys(data).length === 0)
    return NextResponse.json({ error: "אין שינויים" }, { status: 400 });

  try {
    const user = await prisma.user.update({
      where: { id: params.userId },
      data,
      select: { id: true, name: true, email: true, canCreateGroup: true },
    });
    return NextResponse.json(user);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "שגיאה";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
