import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { requireGroupAdmin } from "@/lib/permissions";
import { z } from "zod";

const schema = z.object({ name: z.string().min(2, "שם חייב להכיל לפחות 2 תווים") });

// POST — admin creates a new player and adds them to the group
export async function POST(
  req: Request,
  { params }: { params: { groupId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "לא מחובר" }, { status: 401 });

  try {
    await requireGroupAdmin(params.groupId, session.user.id);

    const { name } = schema.parse(await req.json());

    // Create a placeholder user (no password — can't log in)
    const email = `player_${Date.now()}_${Math.random().toString(36).slice(2)}@poker.internal`;
    const user = await prisma.user.create({
      data: { name, email, passwordHash: "" },
    });

    // Add to group
    await prisma.groupMember.create({
      data: { groupId: params.groupId, userId: user.id, role: "MEMBER" },
    });

    return NextResponse.json({ id: user.id, name: user.name });
  } catch (e: unknown) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.errors[0].message }, { status: 400 });
    const msg = e instanceof Error ? e.message : "שגיאה";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
