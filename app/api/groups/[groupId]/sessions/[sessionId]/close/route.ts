import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { requireGroupAdmin } from "@/lib/permissions";
import { getSessionValidation } from "@/lib/validations";
import { computeAndSaveSettlements } from "@/lib/settlements";
import { computeAndSaveAchievements } from "@/lib/achievements";

export async function POST(
  _req: Request,
  { params }: { params: { groupId: string; sessionId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "לא מחובר" }, { status: 401 });

  try {
    await requireGroupAdmin(params.groupId, session.user.id);
    const gameSession = await prisma.session.findUnique({ where: { id: params.sessionId } });
    if (!gameSession || gameSession.groupId !== params.groupId)
      return NextResponse.json({ error: "סשן לא נמצא" }, { status: 404 });

    const validation = await getSessionValidation(params.sessionId);
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.errors.join(", "), validation }, { status: 400 });
    }

    const updated = await prisma.session.update({
      where: { id: params.sessionId },
      data: { status: "CLOSED" },
    });

    // Compute settlements & achievements after closing (non-blocking errors)
    await Promise.allSettled([
      computeAndSaveSettlements(params.sessionId),
      computeAndSaveAchievements(params.sessionId, params.groupId),
    ]);

    return NextResponse.json(updated);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "שגיאה";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
