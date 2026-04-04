import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireGroupMember } from "@/lib/permissions";
import { getLeaderboard } from "@/lib/leaderboard";
import { Period } from "@/types";

export async function GET(req: Request, { params }: { params: { groupId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "לא מחובר" }, { status: 401 });

  try {
    await requireGroupMember(params.groupId, session.user.id);

    const { searchParams } = new URL(req.url);
    const period = (["all", "month", "quarter", "year"].includes(searchParams.get("period") || "")
      ? searchParams.get("period")
      : "all") as Period;

    const rows = await getLeaderboard(params.groupId, period);

    const headers = ["מקום", "שם", "משחקים", "רווח/הפסד", "ממוצע למשחק", "ROI%", "אחוז הצלחה", "רצף נוכחי"];
    const lines = [
      headers.join(","),
      ...rows.map((r) =>
        [
          r.rank,
          `"${r.name}"`,
          r.gamesPlayed,
          r.totalProfitLoss,
          r.avgProfitPerGame.toFixed(0),
          r.roi.toFixed(1),
          r.successRate.toFixed(1),
          r.currentStreak,
        ].join(",")
      ),
    ];

    const csv = "\uFEFF" + lines.join("\r\n"); // BOM for Excel Hebrew support

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="leaderboard.csv"`,
      },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "שגיאה";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
