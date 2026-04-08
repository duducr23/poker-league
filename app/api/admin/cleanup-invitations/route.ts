import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// One-time cleanup: delete all invitations linked to CLOSED sessions
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "לא מחובר" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true },
  });

  const isSuperAdmin =
    user?.email?.toLowerCase() === process.env.SUPER_ADMIN_EMAIL?.toLowerCase();
  if (!isSuperAdmin) return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });

  const result = await prisma.eventInvitation.deleteMany({
    where: {
      session: { status: "CLOSED" },
    },
  });

  return NextResponse.json({ deleted: result.count, message: `נמחקו ${result.count} הזמנות ישנות` });
}
