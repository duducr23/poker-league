import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { requireGroupAdmin, requireGroupMember } from "@/lib/permissions";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1),
  startDate: z.string(),
});

export async function GET(_req: Request, { params }: { params: { groupId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "לא מחובר" }, { status: 401 });

  try {
    await requireGroupMember(params.groupId, session.user.id);
    const seasons = await prisma.season.findMany({
      where: { groupId: params.groupId },
      orderBy: { startDate: "desc" },
    });
    return NextResponse.json(seasons);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "שגיאה";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: { groupId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "לא מחובר" }, { status: 401 });

  try {
    await requireGroupAdmin(params.groupId, session.user.id);
    const { name, startDate } = createSchema.parse(await req.json());

    // Close any currently active season
    await prisma.season.updateMany({
      where: { groupId: params.groupId, isActive: true },
      data: { isActive: false, endDate: new Date() },
    });

    const season = await prisma.season.create({
      data: {
        groupId: params.groupId,
        name,
        startDate: new Date(startDate),
        isActive: true,
      },
    });
    return NextResponse.json(season);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "שגיאה";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
