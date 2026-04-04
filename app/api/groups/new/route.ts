import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { GroupRole } from "@prisma/client";
import { randomBytes } from "crypto";

const schema = z.object({ name: z.string().min(2) });

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "לא מחובר" }, { status: 401 });

  try {
    const { name } = schema.parse(await req.json());
    const inviteCode = randomBytes(4).toString("hex").toUpperCase();

    const group = await prisma.group.create({
      data: {
        name,
        inviteCode,
        ownerId: session.user.id,
        members: {
          create: { userId: session.user.id, role: GroupRole.ADMIN },
        },
      },
    });

    return NextResponse.json(group);
  } catch (e) {
    return NextResponse.json({ error: "שגיאה ביצירת קבוצה" }, { status: 500 });
  }
}
