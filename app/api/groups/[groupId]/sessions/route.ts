import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { requireGroupAdmin } from "@/lib/permissions";
import { z } from "zod";

const schema = z.object({
  date: z.string(),
  location: z.string().optional(),
  notes: z.string().optional(),
  participantIds: z.array(z.string()).min(2),
  seasonId: z.string().optional(),
});

export async function POST(req: Request, { params }: { params: { groupId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "לא מחובר" }, { status: 401 });

  try {
    await requireGroupAdmin(params.groupId, session.user.id);
    const { date, location, notes, participantIds, seasonId } = schema.parse(await req.json());

    const gameSession = await prisma.session.create({
      data: {
        groupId: params.groupId,
        date: new Date(date),
        location,
        notes,
        createdById: session.user.id,
        ...(seasonId ? { seasonId } : {}),
        results: {
          create: participantIds.map((userId) => ({ userId, isSubmitted: false })),
        },
      },
    });

    return NextResponse.json(gameSession);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "שגיאה";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
