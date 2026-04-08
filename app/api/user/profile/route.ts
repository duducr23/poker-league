import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1, "השם חייב להכיל לפחות תו אחד").max(50),
});

function isSuperAdmin(email?: string | null) {
  return !!email && email.toLowerCase() === process.env.SUPER_ADMIN_EMAIL?.toLowerCase();
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "לא מחובר" }, { status: 401 });

  if (!isSuperAdmin(session.user.email)) {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }

  const body = schema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: body.error.errors[0]?.message ?? "נתונים לא תקינים" }, { status: 400 });

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: { name: body.data.name },
    select: { id: true, name: true },
  });

  return NextResponse.json(updated);
}
