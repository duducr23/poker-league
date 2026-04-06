import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { requireGroupMember } from "@/lib/permissions";
import { z } from "zod";
import { sendPushToUsers } from "@/lib/push";

const bodySchema = z.object({
  proofImageUrl: z.string().optional(),
});

export async function POST(
  req: Request,
  {
    params,
  }: {
    params: {
      groupId: string;
      sessionId: string;
      expenseId: string;
      chargeId: string;
    };
  }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "לא מחובר" }, { status: 401 });

  try {
    await requireGroupMember(params.groupId, session.user.id);

    const gameSession = await prisma.session.findUnique({
      where: { id: params.sessionId },
    });
    if (!gameSession || gameSession.groupId !== params.groupId)
      return NextResponse.json({ error: "סשן לא נמצא" }, { status: 404 });

    const charge = await prisma.sessionExpenseCharge.findUnique({
      where: { id: params.chargeId },
      include: { expense: { select: { sessionId: true } } },
    });

    if (
      !charge ||
      charge.expenseId !== params.expenseId ||
      charge.expense.sessionId !== params.sessionId
    )
      return NextResponse.json({ error: "חיוב לא נמצא" }, { status: 404 });

    // Only the payer can upload proof
    if (charge.payerUserId !== session.user.id)
      return NextResponse.json(
        { error: "רק המשלם יכול להעלות הוכחת תשלום" },
        { status: 403 }
      );

    // Status must be PENDING_PAYMENT or DECLINED
    if (
      charge.status !== "PENDING_PAYMENT" &&
      charge.status !== "DECLINED"
    )
      return NextResponse.json(
        { error: "לא ניתן להעלות הוכחה בסטטוס הנוכחי" },
        { status: 400 }
      );

    const body = bodySchema.parse(await req.json());

    const updated = await prisma.sessionExpenseCharge.update({
      where: { id: params.chargeId },
      data: {
        status: "PROOF_UPLOADED",
        proofImageUrl: body.proofImageUrl || null,
        paymentMarkedAt: new Date(),
      },
    });

    // Notify the receiver (fire-and-forget)
    sendPushToUsers([charge.receiverUserId], {
      title: "💸 הוכחת תשלום התקבלה",
      body: "מישהו העלה הוכחת תשלום — כנס לאשר",
      url: `/groups/${params.groupId}/sessions/${params.sessionId}`,
      tag: `expense-proof-${params.chargeId}`,
    }).catch(() => {});

    return NextResponse.json(updated);
  } catch (e: unknown) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { error: e.errors[0]?.message ?? "שגיאת ולידציה" },
        { status: 400 }
      );
    }
    const msg = e instanceof Error ? e.message : "שגיאה";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
