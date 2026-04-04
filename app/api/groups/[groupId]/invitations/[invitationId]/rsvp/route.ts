import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { RSVPStatus } from "@prisma/client";

const schema = z.object({
  status: z.enum(["COMING", "NOT_COMING", "MAYBE"]),
});

export async function POST(
  req: Request,
  { params }: { params: { groupId: string; invitationId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "לא מחובר" }, { status: 401 });

  const member = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId: params.groupId, userId: session.user.id } },
  });
  if (!member) return NextResponse.json({ error: "אין גישה" }, { status: 403 });

  const body = schema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: "נתונים לא תקינים" }, { status: 400 });

  const response = await prisma.invitationResponse.upsert({
    where: {
      invitationId_userId: {
        invitationId: params.invitationId,
        userId: session.user.id,
      },
    },
    update: { status: body.data.status as RSVPStatus, respondedAt: new Date() },
    create: {
      invitationId: params.invitationId,
      userId: session.user.id,
      status: body.data.status as RSVPStatus,
    },
  });

  return NextResponse.json(response);
}
