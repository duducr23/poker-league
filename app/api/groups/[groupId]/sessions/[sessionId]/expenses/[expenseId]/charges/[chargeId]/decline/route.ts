import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { requireGroupMember } from "@/lib/permissions";
import { sendPushToUsers } from "@/lib/push";

export async function POST(
  _req: Request,
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

    // Only the receiver (the one who paid originally) can decline
    if (charge.receiverUserId !== session.user.id)
      return NextResponse.json(
        { error: "רק מקבל התשלום יכול לדחות" },
        { status: 403 }
      );

    // Status must be PROOF_UPLOADED
    if (charge.status !== "PROOF_UPLOADED")
      return NextResponse.json(
        { error: "לא ניתן לדחות בסטטוס הנוכחי" },
        { status: 400 }
      );

    const updated = await prisma.sessionExpenseCharge.update({
      where: { id: params.chargeId },
      data: {
        status: "DECLINED",
        declinedAt: new Date(),
        declinedByUserId: session.user.id,
      },
    });

    // Notify the payer (fire-and-forget)
    sendPushToUsers([charge.payerUserId], {
      title: "❌ תשלום נדחה",
      body: "מקבל הכסף דחה את ההוכחה — יש להעלות הוכחה חדשה",
      url: `/groups/${params.groupId}/sessions/${params.sessionId}`,
      tag: `expense-declined-${params.chargeId}`,
    }).catch(() => {});

    return NextResponse.json(updated);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "שגיאה";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
