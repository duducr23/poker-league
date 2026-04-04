import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

function isSuperAdmin(email?: string | null) {
  return !!email && email === process.env.SUPER_ADMIN_EMAIL;
}

const schema = z.object({ canCreateGroup: z.boolean() });

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

  const user = await prisma.user.update({
    where: { id: params.userId },
    data: { canCreateGroup: body.data.canCreateGroup },
    select: { id: true, name: true, email: true, canCreateGroup: true },
  });

  return NextResponse.json(user);
}
