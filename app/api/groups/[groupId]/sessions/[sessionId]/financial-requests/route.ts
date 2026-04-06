import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { requireGroupMember } from "@/lib/permissions";
import { z } from "zod";
import { sendWebPushToUsers } from "@/lib/push";
import { buildPayload } from "@/lib/push-payloads";

const createSchema = z.object({
  userId: z.string().min(1),
  type: z.enum(["INITIAL_BUYIN", "REBUY"]),
  amount: z.number().positive("הסכום חייב להיות גדול מ-0"),
});

export async function GET(
  _req: Request,
  { params }: { params: { groupId: string; sessionId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "לא מחובר" }, { status: 401 });

  try {
    await requireGroupMember(params.groupId, session.user.id);

    const gameSession = await prisma.session.findUnique({ where: { id: params.sessionId } });
    if (!gameSession || gameSession.groupId !== params.groupId)
      return NextResponse.json({ error: "סשן לא נמצא" }, { status: 404 });

    const requests = await prisma.sessionFinancialRequest.findMany({
      where: { sessionId: params.sessionId },
      include: {
        user: { select: { id: true, name: true, image: true } },
        createdBy: { select: { id: true, name: true } },
        approvedBy: { select: { id: true, name: true } },
        declinedBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(requests);
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
  if (!session?.user?.id) return NextResponse.json({ error: "לא מחובר" }, { status: 401 });

  try {
    await requireGroupMember(params.groupId, session.user.id);

    const body = createSchema.parse(await req.json());

    // userId must equal authenticated user
    if (body.userId !== session.user.id) {
      return NextResponse.json({ error: "ניתן ליצור בקשה רק עבור עצמך" }, { status: 403 });
    }

    const gameSession = await prisma.session.findUnique({ where: { id: params.sessionId } });
    if (!gameSession || gameSession.groupId !== params.groupId)
      return NextResponse.json({ error: "סשן לא נמצא" }, { status: 404 });

    if (gameSession.status !== "OPEN") {
      return NextResponse.json({ error: "הסשן אינו פתוח" }, { status: 400 });
    }

    // User must be a session participant
    const participant = await prisma.sessionParticipantResult.findUnique({
      where: { sessionId_userId: { sessionId: params.sessionId, userId: body.userId } },
    });
    if (!participant) {
      return NextResponse.json({ error: "אינך רשום כמשתתף בסשן זה" }, { status: 400 });
    }

    // For INITIAL_BUYIN: no existing approved INITIAL_BUYIN may exist
    if (body.type === "INITIAL_BUYIN") {
      const existing = await prisma.sessionFinancialRequest.findFirst({
        where: {
          sessionId: params.sessionId,
          userId: body.userId,
          type: "INITIAL_BUYIN",
          status: "APPROVED",
        },
      });
      if (existing) {
        return NextResponse.json({ error: "כבר יש buy-in מאושר עבורך בסשן זה" }, { status: 400 });
      }
    }

    const request = await prisma.sessionFinancialRequest.create({
      data: {
        sessionId: params.sessionId,
        userId: body.userId,
        type: body.type,
        amount: body.amount,
        createdByUserId: session.user.id,
      },
      include: {
        user: { select: { id: true, name: true, image: true } },
        createdBy: { select: { id: true, name: true } },
        approvedBy: { select: { id: true, name: true } },
        declinedBy: { select: { id: true, name: true } },
      },
    });

    // Notify all session participants (fire-and-forget)
    prisma.sessionParticipantResult.findMany({
      where: { sessionId: params.sessionId },
      select: { userId: true },
    }).then((participants) => {
      const recipientIds = participants
        .map((p) => p.userId)
        .filter((id) => id !== session.user.id);
      if (recipientIds.length > 0) {
        sendWebPushToUsers(recipientIds, buildPayload("FINANCIAL_REQUEST_CREATED", {
          requesterName: request.user.name,
          requestType: body.type,
          amount: body.amount,
          groupId: params.groupId,
          sessionId: params.sessionId,
          requestId: request.id,
        })).catch(() => {});
      }
    }).catch(() => {});

    return NextResponse.json(request, { status: 201 });
  } catch (e: unknown) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors[0]?.message ?? "שגיאת ולידציה" }, { status: 400 });
    }
    const msg = e instanceof Error ? e.message : "שגיאה";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
