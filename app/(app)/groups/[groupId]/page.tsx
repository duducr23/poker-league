import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatsCard } from "@/components/layout/stats-card";
import { EmptyState } from "@/components/layout/empty-state";
import { getLeaderboard } from "@/lib/leaderboard";
import { isGroupAdmin } from "@/lib/permissions";
import { formatCurrency, formatDate, getStatusLabel, getStatusColor } from "@/lib/utils";
import { Trophy, CalendarDays, Plus, Users, TrendingUp, Medal, ArrowLeft, Settings } from "lucide-react";
import { TopPlayersRoast } from "@/components/dashboard/top-players-roast";

export default async function GroupPage({ params }: { params: { groupId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const [group, totalGames, openSessions] = await Promise.all([
    prisma.group.findUnique({
      where: { id: params.groupId },
      include: {
        members: { include: { user: { select: { id: true, name: true } } } },
        sessions: { orderBy: { date: "desc" }, take: 5, include: { results: true } },
      },
    }),
    prisma.session.count({ where: { groupId: params.groupId, status: "CLOSED" } }),
    prisma.session.count({ where: { groupId: params.groupId, status: "OPEN" } }),
  ]);
  if (!group) notFound();

  const admin = await isGroupAdmin(params.groupId, session.user.id);
  const leaderboard = await getLeaderboard(params.groupId, "all");
  const monthlyLeaderboard = await getLeaderboard(params.groupId, "month");

  const qualified = leaderboard.filter((r) => r.gamesPlayed > 0);
  const top3 = qualified.slice(0, 3);   // ← fixed: was incorrectly set to top2
  const top2 = qualified.slice(0, 2);   // for roast section
  const bottom2 = qualified.length >= 4
    ? qualified.slice(-2).reverse()
    : qualified.length === 3
    ? [qualified[2]]
    : [];
  const bottom2Filtered = bottom2.filter((r) => !top2.find((t) => t.userId === r.userId));

  // Most wins / most losses (among qualified players)
  const mostWins   = [...leaderboard].sort((a, b) => b.profitableNights - a.profitableNights)[0];
  const mostLosses = [...leaderboard].sort((a, b) => b.losingNights    - a.losingNights)[0];

  // Absent from BOTH of the last 2 closed sessions (consecutive absence)
  const last2Closed = group.sessions.filter((s) => s.status === "CLOSED").slice(0, 2);
  const absentPlayers = last2Closed.length >= 2
    ? group.members
        .filter((m) => last2Closed.every((s) => !s.results.some((r) => r.userId === m.userId)))
        .map((m) => ({ userId: m.userId, name: m.user.name }))
    : [];

  // Bottom 3 for "נלחמים בתחתית" (no overlap with top3)
  const top3UserIds = new Set(top3.map((r) => r.userId));
  const bottom3ForCard = qualified
    .filter((r) => !top3UserIds.has(r.userId))
    .slice(-3)
    .reverse();

  const topMonth = monthlyLeaderboard.find((r) => r.gamesPlayed > 0);
  const mostActive = [...leaderboard].sort((a, b) => b.gamesPlayed - a.gamesPlayed)[0];
  const latestClosed = group.sessions.find((s) => s.status === "CLOSED");
  // Rotation seed: changes every 2 days from last session date
  const rotationSeed = latestClosed
    ? Math.floor((Date.now() - new Date(latestClosed.date).getTime()) / (2 * 24 * 60 * 60 * 1000))
    : 0;
  const biggestWinner = latestClosed
    ? latestClosed.results.reduce((best, r) => (!best || r.profitLoss > best.profitLoss ? r : best), null as (typeof latestClosed.results[0]) | null)
    : null;
  const biggestWinnerName = biggestWinner
    ? group.members.find((m) => m.userId === biggestWinner.userId)?.user.name
    : null;

  // totalGames and openSessions come from direct DB count queries above

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">{group.name}</h1>
          <p className="text-muted-foreground">{group.members.length} חברים · {totalGames} ערבים</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {admin && (
            <Link href={`/groups/${params.groupId}/sessions/new`}>
              <Button className="gap-2"><Plus className="h-4 w-4" />ערב חדש</Button>
            </Link>
          )}
          <Link href={`/groups/${params.groupId}/leaderboard`}>
            <Button variant="outline" className="gap-2"><Trophy className="h-4 w-4" />דירוג</Button>
          </Link>
          <Link href={`/groups/${params.groupId}/sessions`}>
            <Button variant="outline" className="gap-2"><CalendarDays className="h-4 w-4" />ערבים</Button>
          </Link>
          {admin && (
            <Link href={`/groups/${params.groupId}/settings`}>
              <Button variant="ghost" size="icon" title="הגדרות וניהול חברים"><Settings className="h-4 w-4" /></Button>
            </Link>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard title="ערבים סגורים" value={totalGames} icon={CalendarDays} />
        <StatsCard title="ערבים פתוחים" value={openSessions} icon={CalendarDays} />
        <StatsCard title="חברים" value={group.members.length} icon={Users} />
        <StatsCard
          title="מוביל כל הזמנים"
          value={top3[0]?.name || "—"}
          subtitle={top3[0] ? formatCurrency(top3[0].totalProfitLoss) : ""}
          icon={Trophy}
          trend={top3[0]?.totalProfitLoss > 0 ? "up" : "neutral"}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Top 3 + Bottom 3 stacked */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base"><Medal className="h-5 w-5 text-yellow-500" />🏆 טופ 3 כל הזמנים</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {top3.length === 0 ? (
                <p className="text-sm text-muted-foreground">אין נתונים עדיין</p>
              ) : (
                <div className="space-y-2">
                  {top3.map((r, i) => {
                    const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉";
                    return (
                      <Link key={r.userId} href={`/groups/${params.groupId}/players/${r.userId}`} className="flex items-center justify-between p-2.5 rounded-lg border hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-2.5">
                          <span className="text-lg">{medal}</span>
                          <div>
                            <p className="font-medium text-sm">{r.name}</p>
                            <p className="text-xs text-muted-foreground">{r.gamesPlayed} משחקים</p>
                          </div>
                        </div>
                        <span className={r.totalProfitLoss >= 0 ? "text-green-500 font-semibold text-sm" : "text-red-500 font-semibold text-sm"}>
                          {r.totalProfitLoss > 0 ? "+" : ""}{formatCurrency(r.totalProfitLoss)}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {bottom3ForCard.length > 0 && (
            <Card style={{ borderColor: "rgba(248,113,113,0.2)", background: "rgba(248,113,113,0.03)" }}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base text-red-400">
                  <span className="text-lg">💀</span> נלחמים בתחתית
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {bottom3ForCard.map((r, i) => {
                    const icon = i === 0 ? "💀" : i === 1 ? "🤡" : "🫠";
                    return (
                      <Link
                        key={r.userId}
                        href={`/groups/${params.groupId}/players/${r.userId}`}
                        className="flex items-center justify-between p-2.5 rounded-lg border hover:bg-muted/50 transition-colors"
                        style={{ borderColor: "rgba(248,113,113,0.15)" }}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-lg">{icon}</span>
                          <div>
                            <p className="font-medium text-sm">{r.name}</p>
                            <p className="text-xs text-muted-foreground">{r.gamesPlayed} משחקים</p>
                          </div>
                        </div>
                        <span className="text-red-400 font-semibold text-sm">
                          {formatCurrency(r.totalProfitLoss)}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Highlights */}
        <div className="space-y-4">
          {topMonth && (
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{background:"rgba(212,160,23,0.12)"}}>
                  <TrendingUp className="h-5 w-5" style={{color:"#d4a017"}} />
                </div>
                <div>
                  <p className="text-xs text-slate-500">שחקן החודש</p>
                  <p className="font-semibold text-slate-100">{topMonth.name}</p>
                  <p className="text-sm text-emerald-400">{formatCurrency(topMonth.totalProfitLoss)} החודש</p>
                </div>
              </CardContent>
            </Card>
          )}

          {mostActive && mostActive.gamesPlayed > 0 && (
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{background:"rgba(59,130,246,0.12)"}}>
                  <Users className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">הכי פעיל</p>
                  <p className="font-semibold text-slate-100">{mostActive.name}</p>
                  <p className="text-sm text-slate-500">{mostActive.gamesPlayed} ערבים</p>
                </div>
              </CardContent>
            </Card>
          )}

          {biggestWinnerName && biggestWinner && (
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{background:"rgba(212,160,23,0.1)"}}>
                  <Trophy className="h-5 w-5 text-yellow-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">מנצח בערב האחרון</p>
                  <p className="font-semibold text-slate-100">{biggestWinnerName}</p>
                  <p className="text-sm text-emerald-400">+{formatCurrency(biggestWinner.profitLoss)}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {mostWins && mostWins.profitableNights > 0 && (
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{background:"rgba(52,211,153,0.12)"}}>
                  <TrendingUp className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">הכי הרבה נצחונות</p>
                  <p className="font-semibold text-slate-100">{mostWins.name}</p>
                  <p className="text-sm text-emerald-400">{mostWins.profitableNights} ערבים מנצחים</p>
                </div>
              </CardContent>
            </Card>
          )}

          {mostLosses && mostLosses.losingNights > 0 && (
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{background:"rgba(248,113,113,0.12)"}}>
                  <ArrowLeft className="h-5 w-5 text-red-400" style={{transform:"rotate(-90deg)"}} />
                </div>
                <div>
                  <p className="text-xs text-slate-500">הכי הרבה הפסדים</p>
                  <p className="font-semibold text-slate-100">{mostLosses.name}</p>
                  <p className="text-sm text-red-400">{mostLosses.losingNights} ערבים מפסידים</p>
                </div>
              </CardContent>
            </Card>
          )}

          {absentPlayers.length > 0 && (
            <Card style={{borderColor:"rgba(251,191,36,0.2)"}}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-base">🪑</span>
                  <p className="text-sm font-semibold text-amber-400">חסר בשולחן</p>
                  <span className="text-xs text-slate-500">(נעדר מ-2+ ערבים אחרונים)</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {absentPlayers.map((p) => (
                    <Link key={p.userId} href={`/groups/${params.groupId}/players/${p.userId}`}>
                      <span
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium hover:opacity-80 transition-opacity"
                        style={{background:"rgba(251,191,36,0.1)", color:"#fbbf24", border:"1px solid rgba(251,191,36,0.25)"}}
                      >
                        {p.name}
                      </span>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="bg-muted/30">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-2">קוד הזמנה לקבוצה</p>
              <code className="text-lg font-bold tracking-widest text-primary">{group.inviteCode}</code>
              <p className="text-xs text-muted-foreground mt-1">שתף עם שחקנים כדי שיצטרפו</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Top/Bottom roast */}
      {(top2.length > 0 || bottom2Filtered.length > 0) && (
        <TopPlayersRoast top2={top2} bottom2={bottom2Filtered} groupId={params.groupId} rotationSeed={rotationSeed} />
      )}

      {/* Recent sessions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2"><CalendarDays className="h-5 w-5" />ערבים אחרונים</CardTitle>
          <Link href={`/groups/${params.groupId}/sessions`}>
            <Button variant="ghost" size="sm" className="gap-1">כל הערבים <ArrowLeft className="h-3 w-3" /></Button>
          </Link>
        </CardHeader>
        <CardContent>
          {group.sessions.length === 0 ? (
            <EmptyState icon={CalendarDays} title="אין ערבים עדיין" description="צור את הערב הראשון של הקבוצה" />
          ) : (
            <div className="space-y-2">
              {group.sessions.map((s) => {
                const submitted = s.results.filter((r) => r.isSubmitted).length;
                return (
                  <Link key={s.id} href={`/groups/${params.groupId}/sessions/${s.id}`} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                    <div>
                      <p className="font-medium">{formatDate(s.date)}{s.location ? ` · ${s.location}` : ""}</p>
                      <p className="text-xs text-muted-foreground">{submitted}/{s.results.length} הגישו</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${getStatusColor(s.status)}`}>
                      {getStatusLabel(s.status)}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
