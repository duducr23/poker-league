import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { requireGroupMember } from "@/lib/permissions";
import { format } from "date-fns";

export async function GET(req: Request, { params }: { params: { groupId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "לא מחובר" }, { status: 401 });

  try {
    await requireGroupMember(params.groupId, session.user.id);

    const { searchParams } = new URL(req.url);
    const playerId = searchParams.get("playerId"); // optional — export for a specific player

    const results = await prisma.sessionParticipantResult.findMany({
      where: {
        isSubmitted: true,
        ...(playerId ? { userId: playerId } : {}),
        session: { groupId: params.groupId, status: "CLOSED" },
      },
      include: {
        session: { select: { date: true, location: true, status: true } },
        user: { select: { name: true } },
      },
      orderBy: { session: { date: "desc" } },
    });

    const headers = ["תאריך", "מיקום", "שם", "קנייה", "ריבאי", "אדאון", "יציאה", "סה\"כ השקעה", "רווח/הפסד"];
    const lines = [
      headers.join(","),
      ...results.map((r) =>
        [
          format(new Date(r.session.date), "dd/MM/yyyy"),
          `"${r.session.location || ""}"`,
          `"${r.user.name}"`,
          r.buyIn,
          r.rebuy,
          r.addons,
          r.cashOut,
          r.totalInvested,
          r.profitLoss,
        ].join(",")
      ),
    ];

    const csv = "\uFEFF" + lines.join("\r\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="sessions.csv"`,
      },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "שגיאה";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
