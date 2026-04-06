import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  notifFinancial: z.boolean().optional(),
  notifFoodPayments: z.boolean().optional(),
  notifSessionEvents: z.boolean().optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "לא מחובר" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      notifFinancial: true,
      notifFoodPayments: true,
      notifSessionEvents: true,
    },
  });

  return NextResponse.json(
    user ?? {
      notifFinancial: true,
      notifFoodPayments: true,
      notifSessionEvents: true,
    }
  );
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "לא מחובר" }, { status: 401 });

  const body = schema.safeParse(await req.json());
  if (!body.success)
    return NextResponse.json({ error: "נתונים לא תקינים" }, { status: 400 });

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: body.data,
    select: {
      notifFinancial: true,
      notifFoodPayments: true,
      notifSessionEvents: true,
    },
  });

  return NextResponse.json(updated);
}
