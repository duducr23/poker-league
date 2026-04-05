import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { requireGroupMember } from "@/lib/permissions";
import { z } from "zod";

const createSchema = z.object({
  title: z.string().min(1, "כותרת נדרשת"),
  description: z.string().optional(),
  totalAmount: z.number().positive("הסכום חייב להיות גדול מ-0"),
  paidByUserId: z.string().min(1, "חובה לציין מי שילם"),
  splitMethod: z.enum(["EQUAL", "MANUAL"]),
  participants: z
    .array(
      z.object({
        userId: z.string().min(1),
        amount: z.number().optional(),
      })
    )
    .min(1, "חובה לבחור לפחות משתתף אחד"),
});

export async function GET(
  _req: Request,
  { params }: { params: { groupId: string; sessionId: string } }
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

    const expenses = await prisma.sessionExpense.findMany({
      where: { sessionId: params.sessionId },
      include: {
        paidBy: { select: { id: true, name: true, image: true } },
        createdBy: { select: { id: true, name: true } },
        charges: {
          include: {
            payer: { select: { id: true, name: true, image: true } },
            receiver: { select: { id: true, name: true, image: true } },
            approvedBy: { select: { id: true, name: true } },
            declinedBy: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(expenses);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "שגיאה";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: { groupId: string; sessionId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "לא מחובר" }, { status: 401 });

  try {
    await requireGroupMember(params.groupId, session.user.id);

    const body = createSchema.parse(await req.json());

    const gameSession = await prisma.session.findUnique({
      where: { id: params.sessionId },
    });
    if (!gameSession || gameSession.groupId !== params.groupId)
      return NextResponse.json({ error: "סשן לא נמצא" }, { status: 404 });

    if (gameSession.status !== "OPEN")
      return NextResponse.json({ error: "הסשן אינו פתוח" }, { status: 400 });

    // Fetch all session participant user IDs
    const sessionParticipants = await prisma.sessionParticipantResult.findMany({
      where: { sessionId: params.sessionId },
      select: { userId: true },
    });
    const participantUserIds = new Set(sessionParticipants.map((p) => p.userId));

    // Validate paidByUserId is a session participant
    if (!participantUserIds.has(body.paidByUserId))
      return NextResponse.json(
        { error: "המשלם אינו משתתף בסשן זה" },
        { status: 400 }
      );

    // Validate all participants are session participants
    for (const p of body.participants) {
      if (!participantUserIds.has(p.userId))
        return NextResponse.json(
          { error: `משתתף ${p.userId} אינו רשום בסשן זה` },
          { status: 400 }
        );
    }

    // Build charge data
    const chargeData: Array<{
      payerUserId: string;
      receiverUserId: string;
      amount: number;
    }> = [];

    if (body.splitMethod === "EQUAL") {
      const count = body.participants.length;
      const baseAmount = Math.round((body.totalAmount / count) * 100) / 100;
      let distributed = 0;

      for (let i = 0; i < body.participants.length; i++) {
        const p = body.participants[i];
        // Skip paidByUserId — they already paid
        if (p.userId === body.paidByUserId) {
          // Still include them in division, but don't create a charge row
          distributed += baseAmount;
          continue;
        }

        let amount: number;
        if (i === body.participants.length - 1) {
          // Last participant gets the remainder to fix rounding
          amount =
            Math.round(
              (body.totalAmount - distributed - (p.userId === body.paidByUserId ? 0 : 0)) *
                100
            ) / 100;
        } else {
          amount = baseAmount;
        }
        distributed += amount;
        chargeData.push({
          payerUserId: p.userId,
          receiverUserId: body.paidByUserId,
          amount,
        });
      }

      // Fix rounding: last non-payer charge should make the total correct
      if (chargeData.length > 0) {
        const totalCharged = chargeData.reduce((s, c) => s + c.amount, 0);
        const paidByShare = body.totalAmount - totalCharged;
        // Adjust last charge to ensure totalCharged = totalAmount - paidByShare (i.e. all non-payer shares)
        // Recalculate: divide totalAmount among all participants, paidBy already paid their share
        const perPerson = body.totalAmount / count;
        const paidByAmount = Math.round(perPerson * 100) / 100;
        let remaining = Math.round((body.totalAmount - paidByAmount) * 100) / 100;
        for (let i = 0; i < chargeData.length; i++) {
          if (i === chargeData.length - 1) {
            chargeData[i].amount = Math.round(remaining * 100) / 100;
          } else {
            const amt = Math.round(perPerson * 100) / 100;
            chargeData[i].amount = amt;
            remaining = Math.round((remaining - amt) * 100) / 100;
          }
        }
      }
    } else {
      // MANUAL
      const sum = body.participants.reduce((s, p) => s + (p.amount ?? 0), 0);
      const roundedSum = Math.round(sum * 100) / 100;
      const roundedTotal = Math.round(body.totalAmount * 100) / 100;
      if (Math.abs(roundedSum - roundedTotal) > 0.01)
        return NextResponse.json(
          { error: "סכום המשתתפים אינו שווה לסכום הכולל" },
          { status: 400 }
        );

      for (const p of body.participants) {
        if (p.userId === body.paidByUserId) continue; // payer doesn't owe themselves
        if (!p.amount || p.amount <= 0) continue;
        chargeData.push({
          payerUserId: p.userId,
          receiverUserId: body.paidByUserId,
          amount: Math.round(p.amount * 100) / 100,
        });
      }
    }

    // Create expense + charges atomically
    const expense = await prisma.$transaction(async (tx) => {
      const newExpense = await tx.sessionExpense.create({
        data: {
          sessionId: params.sessionId,
          title: body.title,
          description: body.description,
          totalAmount: body.totalAmount,
          paidByUserId: body.paidByUserId,
          splitMethod: body.splitMethod,
          createdByUserId: session.user.id,
        },
      });

      if (chargeData.length > 0) {
        await tx.sessionExpenseCharge.createMany({
          data: chargeData.map((c) => ({
            expenseId: newExpense.id,
            payerUserId: c.payerUserId,
            receiverUserId: c.receiverUserId,
            amount: c.amount,
          })),
        });
      }

      return newExpense;
    });

    // Fetch full expense with includes
    const fullExpense = await prisma.sessionExpense.findUnique({
      where: { id: expense.id },
      include: {
        paidBy: { select: { id: true, name: true, image: true } },
        createdBy: { select: { id: true, name: true } },
        charges: {
          include: {
            payer: { select: { id: true, name: true, image: true } },
            receiver: { select: { id: true, name: true, image: true } },
            approvedBy: { select: { id: true, name: true } },
            declinedBy: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    return NextResponse.json(fullExpense, { status: 201 });
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
