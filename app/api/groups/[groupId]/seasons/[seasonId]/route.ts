import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { requireGroupAdmin } from "@/lib/permissions";

export async function PATCH(
  _req: Request,
  { params }: { params: { groupId: string; seasonId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "לא מחובר" }, { status: 401 });

  try {
    await requireGroupAdmin(params.groupId, session.user.id);
    const season = await prisma.season.findUnique({ where: { id: params.seasonId } });
    if (!season || season.groupId !== params.groupId)
      return NextResponse.json({ error: "עונה לא נמצאה" }, { status: 404 });

    const updated = await prisma.season.update({
      where: { id: params.seasonId },
      data: { isActive: false, endDate: new Date() },
    });
    return NextResponse.json(updated);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "שגיאה";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { groupId: string; seasonId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "לא מחובר" }, { status: 401 });

  try {
    await requireGroupAdmin(params.groupId, session.user.id);
    const season = await prisma.season.findUnique({ where: { id: params.seasonId } });
    if (!season || season.groupId !== params.groupId)
      return NextResponse.json({ error: "עונה לא נמצאה" }, { status: 404 });

    // Unlink sessions from this season before deleting
    await prisma.session.updateMany({
      where: { seasonId: params.seasonId },
      data: { seasonId: null },
    });

    await prisma.season.delete({ where: { id: params.seasonId } });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "שגיאה";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
