import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  title: z.string().min(1),
  date: z.string(),
  location: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(req: Request, { params }: { params: { groupId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "לא מחובר" }, { status: 401 });

  const member = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId: params.groupId, userId: session.user.id } },
  });
  if (!member) return NextResponse.json({ error: "אין גישה" }, { status: 403 });

  const invitations = await prisma.eventInvitation.findMany({
    where: { groupId: params.groupId },
    include: {
      createdBy: { select: { id: true, name: true, image: true } },
      responses: {
        include: { user: { select: { id: true, name: true, image: true } } },
      },
    },
    orderBy: { date: "asc" },
  });

  return NextResponse.json(invitations);
}

export async function POST(req: Request, { params }: { params: { groupId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "לא מחובר" }, { status: 401 });

  const member = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId: params.groupId, userId: session.user.id } },
  });
  if (!member) return NextResponse.json({ error: "אין גישה" }, { status: 403 });

  const body = schema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: "נתונים לא תקינים" }, { status: 400 });

  // Create session + invitation atomically
  const invitation = await prisma.$transaction(async (tx) => {
    // Auto-create a linked session for this invitation
    const linkedSession = await tx.session.create({
      data: {
        groupId: params.groupId,
        date: new Date(body.data.date),
        location: body.data.location,
        notes: body.data.notes ? `הזמנה: ${body.data.notes}` : `ערב פוקר — ${body.data.title}`,
        status: "OPEN",
        createdById: session.user.id,
      },
    });

    const inv = await tx.eventInvitation.create({
      data: {
        groupId: params.groupId,
        title: body.data.title,
        date: new Date(body.data.date),
        location: body.data.location,
        notes: body.data.notes,
        createdById: session.user.id,
        sessionId: linkedSession.id,
      },
      include: {
        createdBy: { select: { id: true, name: true } },
        responses: true,
      },
    });

    return inv;
  });

  return NextResponse.json(invitation);
}
