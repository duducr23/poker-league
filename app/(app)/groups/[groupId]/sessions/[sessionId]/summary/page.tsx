import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { formatDate, formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Trophy, TrendingUp, TrendingDown, Users, MapPin, Spade } from "lucide-react";
import { cn } from "@/lib/utils";
import { SessionRoast } from "@/components/sessions/session-roast";
import { computeRoast, type RoastPlayerInput } from "@/lib/compute-roast";

export default async function SessionSummaryPage({
  params,
}: {
  params: { groupId: string; sessionId: string };
}) {
  const session = await prisma.session.findUnique({
    where: { id: params.sessionId },
    include: {
      group: { select: { name: true } },
      results: {
        where: { isSubmitted: true },
        include: { user: { select: { id: true, name: true } } },
        orderBy: { profitLoss: "desc" },
      },
      financialRequests: {
        where: { status: "APPROVED" },
        select: {
          userId: true,
          type: true,
          createdAt: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!session || session.groupId !== params.groupId || session.status !== "CLOSED") notFound();

  const results = session.results;
  const winner = results[0];
  const loser = results[results.length - 1];
  const totalPot = results.reduce((s, r) => s + r.totalInvested, 0);
  const biggestWin = winner?.profitLoss ?? 0;

  // ── Roast data computation ─────────────────────────────────────────────────

  // Fetch historical data per player
  const playerIds = results.map((r) => r.userId);

  const historicalResults = await prisma.sessionParticipantResult.findMany({
    where: {
      userId: { in: playerIds },
      session: { groupId: params.groupId, status: "CLOSED" },
      sessionId: { not: params.sessionId },
      isSubmitted: true,
    },
    select: { userId: true, profitLoss: true, rebuy: true, buyIn: true },
  });

  // Historical rebuy requests (approved) for rebuy count
  const historicalRequests = await prisma.sessionFinancialRequest.findMany({
    where: {
      userId: { in: playerIds },
      session: { groupId: params.groupId },
      sessionId: { not: params.sessionId },
      type: "REBUY",
      status: "APPROVED",
    },
    select: { userId: true },
  });

  // Build per-player roast inputs
  const roastInputs: RoastPlayerInput[] = results.map((r) => {
    // Current session rebuy count
    const myRequests = session.financialRequests.filter((req) => req.userId === r.userId);
    const myInitialBuyin = myRequests.find((req) => req.type === "INITIAL_BUYIN");
    const myRebuys = myRequests.filter((req) => req.type === "REBUY");
    const rebuyCount = myRebuys.length;

    // Fastest rebuy (minutes from initial buyin → first rebuy)
    let fastestRebuyMinutes: number | null = null;
    if (myInitialBuyin && myRebuys.length > 0) {
      const diff =
        (myRebuys[0].createdAt.getTime() - myInitialBuyin.createdAt.getTime()) / 60000;
      fastestRebuyMinutes = Math.max(0, Math.round(diff));
    }

    // Historical stats
    const myHistory = historicalResults.filter((h) => h.userId === r.userId);
    const historicalSessions = myHistory.length;
    const historicalWins = myHistory.filter((h) => h.profitLoss > 0).length;
    const historicalLosses = myHistory.filter((h) => h.profitLoss < 0).length;
    const historicalTotalRebuyCount = historicalRequests.filter(
      (req) => req.userId === r.userId
    ).length;

    return {
      userId: r.userId,
      name: r.user.name,
      profitLoss: r.profitLoss,
      totalInvested: r.totalInvested,
      rebuyCount,
      fastestRebuyMinutes,
      historicalSessions,
      historicalWins,
      historicalLosses,
      historicalTotalRebuyCount,
    };
  });

  const roast = computeRoast(roastInputs);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-slate-800 rounded-2xl overflow-hidden shadow-2xl border border-slate-700">
          {/* Header */}
          <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-b border-slate-700 p-6 text-center">
            <div className="flex justify-center mb-2">
              <Spade className="h-8 w-8 text-yellow-400" />
            </div>
            <h1 className="text-white font-bold text-xl">{session.group.name}</h1>
            <p className="text-slate-400 text-sm mt-1 flex items-center justify-center gap-1">
              <span>{formatDate(session.date)}</span>
              {session.location && (
                <>
                  <span>•</span>
                  <MapPin className="h-3.5 w-3.5" />
                  <span>{session.location}</span>
                </>
              )}
            </p>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 divide-x divide-slate-700 border-b border-slate-700">
            <div className="p-4 text-center">
              <p className="text-yellow-400 font-bold text-lg">{results.length}</p>
              <p className="text-slate-400 text-xs mt-0.5 flex items-center justify-center gap-1">
                <Users className="h-3 w-3" />שחקנים
              </p>
            </div>
            <div className="p-4 text-center">
              <p className="text-white font-bold text-lg">{formatCurrency(totalPot)}</p>
              <p className="text-slate-400 text-xs mt-0.5">סה&quot;כ בקופה</p>
            </div>
            <div className="p-4 text-center">
              <p className="text-green-400 font-bold text-lg">{formatCurrency(biggestWin)}</p>
              <p className="text-slate-400 text-xs mt-0.5">ניצחון גדול</p>
            </div>
          </div>

          {/* Results list */}
          <div className="p-4 space-y-2">
            {results.map((r, i) => (
              <div
                key={r.userId}
                className={cn(
                  "flex items-center justify-between p-3 rounded-xl",
                  i === 0 ? "bg-yellow-500/10 border border-yellow-500/30" : "bg-slate-700/50"
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="text-slate-400 text-sm w-5 text-center">
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`}
                  </span>
                  <span className="text-white font-medium text-sm">{r.user.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  {r.profitLoss > 0 ? (
                    <TrendingUp className="h-3.5 w-3.5 text-green-400" />
                  ) : r.profitLoss < 0 ? (
                    <TrendingDown className="h-3.5 w-3.5 text-red-400" />
                  ) : null}
                  <span className={cn(
                    "font-bold text-sm",
                    r.profitLoss > 0 ? "text-green-400" : r.profitLoss < 0 ? "text-red-400" : "text-slate-400"
                  )}>
                    {r.profitLoss > 0 ? "+" : ""}{formatCurrency(r.profitLoss)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="border-t border-slate-700 p-4 text-center">
            <p className="text-slate-500 text-xs">נוצר ב-Poker League 🃏</p>
          </div>
        </div>

        {/* Funny roast section */}
        <SessionRoast roast={roast} />

        {/* Back button */}
        <div className="mt-4 text-center">
          <Link href={`/groups/${params.groupId}/sessions/${params.sessionId}`}>
            <Button variant="ghost" className="text-slate-400 hover:text-white gap-2">
              <ArrowRight className="h-4 w-4" />חזרה לערב
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
