import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { requireGroupAdmin } from "@/lib/permissions";
import { z } from "zod";

const patchSchema = z.object({
  amount: z.number().positive().optional(),
  status: z.enum(["PENDING", "APPROVED", "DECLINED"]).optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: { groupId: string; sessionId: string; requestId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "לא מחובר" }, { status: 401 });

  try {
    await requireGroupAdmin(params.groupId, session.user.id);

    const body = patchSchema.parse(await req.json());

    const financialRequest = await prisma.sessionFinancialRequest.findUnique({
      where: { id: params.requestId },
    });
    if (!financialRequest || financialRequest.sessionId !== params.sessionId) {
      return NextResponse.json({ error: "בקשה לא נמצאה" }, { status: 404 });
    }

    const updated = await prisma.sessionFinancialRequest.update({
      where: { id: params.requestId },
      data: {
        ...(body.amount !== undefined && { amount: body.amount }),
        ...(body.status !== undefined && { status: body.status }),
      },
      include: {
        user: { select: { id: true, name: true, image: true } },
        createdBy: { select: { id: true, name: true } },
        approvedBy: { select: { id: true, name: true } },
        declinedBy: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (e: unknown) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors[0]?.message ?? "שגיאת ולידציה" }, { status: 400 });
    }
    const msg = e instanceof Error ? e.message : "שגיאה";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
