import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { formatDate, formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Trophy, TrendingUp, TrendingDown, Users, MapPin, Spade } from "lucide-react";
import { cn } from "@/lib/utils";
import { SessionRoast } from "@/components/sessions/session-roast";
import { ShareSummaryButton } from "@/components/sessions/share-summary-button";
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
          amount: true,
          createdAt: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!session || session.groupId !== params.groupId || session.status !== "CLOSED") notFound();

  const results = session.results;
  const winner = results[0];
  const totalPot = results.reduce((s, r) => s + r.totalInvested, 0);
  const biggestWin = winner?.profitLoss ?? 0;

  // ── Per-player session stats ──────────────────────────────────────────────
  const playerStats = results.map((r) => {
    const myRequests = session.financialRequests.filter((req) => req.userId === r.userId);
    const rebuyRequests = myRequests.filter((req) => req.type === "REBUY");
    const rebuyCount = rebuyRequests.length;
    const rebuyTotal = rebuyRequests.reduce((s, req) => s + req.amount, 0);
    const buyIn = myRequests.find((req) => req.type === "INITIAL_BUYIN")?.amount ?? r.buyIn;
    return {
      ...r,
      rebuyCount,
      rebuyTotal,
      buyIn,
      roi: r.totalInvested > 0 ? (r.profitLoss / r.totalInvested) * 100 : 0,
    };
  });

  // ── Roast data computation ─────────────────────────────────────────────────
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

  const roastInputs: RoastPlayerInput[] = results.map((r) => {
    const myRequests = session.financialRequests.filter((req) => req.userId === r.userId);
    const myInitialBuyin = myRequests.find((req) => req.type === "INITIAL_BUYIN");
    const myRebuys = myRequests.filter((req) => req.type === "REBUY");
    const rebuyCount = myRebuys.length;

    let fastestRebuyMinutes: number | null = null;
    if (myInitialBuyin && myRebuys.length > 0) {
      const diff = (myRebuys[0].createdAt.getTime() - myInitialBuyin.createdAt.getTime()) / 60000;
      fastestRebuyMinutes = Math.max(0, Math.round(diff));
    }

    const myHistory = historicalResults.filter((h) => h.userId === r.userId);
    const historicalSessions = myHistory.length;
    const historicalWins = myHistory.filter((h) => h.profitLoss > 0).length;
    const historicalLosses = myHistory.filter((h) => h.profitLoss < 0).length;
    const historicalTotalRebuyCount = historicalRequests.filter((req) => req.userId === r.userId).length;

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

  const place = (i: number) => i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Main card */}
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

          {/* WhatsApp share — prominent, above the fold */}
          <div className="p-4 border-b border-slate-700">
            <ShareSummaryButton
              groupName={session.group.name}
              sessionDate={formatDate(session.date)}
              winner={winner?.user.name ?? ""}
              winnerAmount={Math.round(biggestWin)}
            />
          </div>

          {/* Results list */}
          <div className="p-4 space-y-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">דירוג ערב</p>
            {results.map((r, i) => (
              <div
                key={r.userId}
                className={cn(
                  "flex items-center justify-between p-3 rounded-xl",
                  i === 0 ? "bg-yellow-500/10 border border-yellow-500/30" : "bg-slate-700/50"
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="text-slate-400 text-sm w-5 text-center">{place(i)}</span>
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

          {/* Per-player detailed breakdown */}
          <div className="border-t border-slate-700 p-4 space-y-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">פירוט לכל שחקן</p>
            {playerStats.map((p, i) => (
              <div
                key={p.userId}
                className="rounded-xl p-3 space-y-2"
                style={{
                  background: p.profitLoss > 0 ? "rgba(16,185,129,0.05)" : p.profitLoss < 0 ? "rgba(248,113,113,0.05)" : "rgba(255,255,255,0.02)",
                  border: `1px solid ${p.profitLoss > 0 ? "rgba(16,185,129,0.2)" : p.profitLoss < 0 ? "rgba(248,113,113,0.2)" : "rgba(255,255,255,0.06)"}`,
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{place(i)}</span>
                    <span className="text-sm font-semibold text-slate-100">{p.user.name}</span>
                  </div>
                  <span
                    className="text-sm font-bold"
                    style={{ color: p.profitLoss > 0 ? "#10b981" : p.profitLoss < 0 ? "#f87171" : "#64748b" }}
                  >
                    {p.profitLoss > 0 ? "+" : ""}{formatCurrency(p.profitLoss)}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="text-center rounded-lg py-1.5" style={{ background: "rgba(255,255,255,0.04)" }}>
                    <p className="text-slate-500">קנייה</p>
                    <p className="text-slate-200 font-medium mt-0.5">{formatCurrency(p.buyIn)}</p>
                  </div>
                  <div className="text-center rounded-lg py-1.5" style={{ background: "rgba(255,255,255,0.04)" }}>
                    <p className="text-slate-500">
                      ריבאי{p.rebuyCount > 0 ? ` ×${p.rebuyCount}` : ""}
                    </p>
                    <p className="text-slate-200 font-medium mt-0.5">
                      {p.rebuyCount > 0 ? formatCurrency(p.rebuyTotal) : "—"}
                    </p>
                  </div>
                  <div className="text-center rounded-lg py-1.5" style={{ background: "rgba(255,255,255,0.04)" }}>
                    <p className="text-slate-500">יציאה</p>
                    <p className="text-slate-200 font-medium mt-0.5">{formatCurrency(p.cashOut ?? 0)}</p>
                  </div>
                </div>

                {/* ROI bar */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-600 w-6 shrink-0">ROI</span>
                  <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(Math.abs(p.roi), 100)}%`,
                        background: p.roi > 0 ? "#10b981" : "#f87171",
                      }}
                    />
                  </div>
                  <span
                    className="text-xs font-medium w-12 text-right shrink-0"
                    style={{ color: p.roi > 0 ? "#10b981" : p.roi < 0 ? "#f87171" : "#64748b" }}
                  >
                    {p.roi > 0 ? "+" : ""}{p.roi.toFixed(0)}%
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

        {/* Roast / funny analysis — always open */}
        <SessionRoast roast={roast} />

        {/* Navigation */}
        <div className="mt-4 flex gap-3 justify-center">
          <Link href={`/groups/${params.groupId}/sessions/${params.sessionId}`}>
            <Button variant="ghost" className="text-slate-400 hover:text-white gap-2">
              <ArrowRight className="h-4 w-4" />חזרה לערב
            </Button>
          </Link>
          <Link href={`/groups/${params.groupId}`}>
            <Button variant="ghost" className="text-slate-400 hover:text-white gap-2">
              <Trophy className="h-4 w-4" />לדף הקבוצה
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
