import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsCard } from "@/components/layout/stats-card";
import { PeriodFilterTabs } from "@/components/layout/period-filter-tabs";
import { ExportCsvButton } from "@/components/layout/export-csv-button";
import { CumulativeProfitChart, MonthlyPerformanceChart } from "@/components/charts/performance-charts";
import { getPlayerStats } from "@/lib/stats";
import { Period } from "@/types";
import { formatCurrency, formatPercent, formatDate } from "@/lib/utils";
import { TrendingUp, TrendingDown, Target, Coins, Trophy, Flame, History, Medal } from "lucide-react";
import { cn } from "@/lib/utils";

export default async function PlayerProfilePage({
  params,
  searchParams,
}: {
  params: { groupId: string; playerId: string };
  searchParams: { period?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const period: Period = (["all", "month", "quarter", "year"].includes(searchParams.period || "") ? searchParams.period : "all") as Period;
  const stats = await getPlayerStats(params.groupId, params.playerId, period);
  if (!stats) notFound();

  const achievements = await prisma.achievement.findMany({
    where: { userId: params.playerId, groupId: params.groupId },
    orderBy: { awardedAt: "desc" },
  });

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
            {stats.name.slice(0, 2)}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{stats.name}</h1>
            <p className="text-muted-foreground">{stats.gamesPlayed} משחקים</p>
          </div>
        </div>
        <ExportCsvButton
          href={`/api/groups/${params.groupId}/export/sessions?playerId=${params.playerId}`}
          label="ייצוא היסטוריה"
        />
      </div>

      <Suspense fallback={null}><PeriodFilterTabs currentPeriod={period} /></Suspense>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard
          title="רווח / הפסד כולל"
          value={formatCurrency(stats.totalProfitLoss)}
          trend={stats.totalProfitLoss > 0 ? "up" : stats.totalProfitLoss < 0 ? "down" : "neutral"}
          icon={Coins}
        />
        <StatsCard title="משחקים" value={stats.gamesPlayed} icon={History} />
        <StatsCard title="אחוזי הצלחה" value={formatPercent(stats.successRate)} icon={Target} subtitle={`${stats.profitableNights} מתוך ${stats.gamesPlayed}`} />
        <StatsCard title="תשואה (ROI)" value={formatPercent(stats.roi)} trend={stats.roi > 0 ? "up" : stats.roi < 0 ? "down" : "neutral"} icon={TrendingUp} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard title="ממוצע למשחק" value={formatCurrency(stats.avgProfitPerGame)} trend={stats.avgProfitPerGame > 0 ? "up" : "down"} />
        <StatsCard title="הלילה הטוב ביותר" value={formatCurrency(stats.bestNight)} trend="up" icon={Trophy} />
        <StatsCard title="הלילה הגרוע ביותר" value={formatCurrency(stats.worstNight)} trend="down" icon={TrendingDown} />
        <StatsCard title="רצף נוכחי" value={stats.currentStreak === 0 ? "—" : `${Math.abs(stats.currentStreak)} ${stats.currentStreak > 0 ? "🔥" : "❄️"}`} icon={Flame} />
      </div>

      {/* Streaks */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-green-600">{stats.longestWinStreak}</p>
            <p className="text-xs text-muted-foreground mt-1">רצף ניצחונות ארוך ביותר</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-red-500">{stats.longestLosingStreak}</p>
            <p className="text-xs text-muted-foreground mt-1">רצף הפסדים ארוך ביותר</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold">{stats.breakEvenNights}</p>
            <p className="text-xs text-muted-foreground mt-1">ערבי איזון</p>
          </CardContent>
        </Card>
      </div>

      {/* Achievements */}
      {achievements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Medal className="h-4 w-4 text-yellow-500" />הישגים ({achievements.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {achievements.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium text-yellow-300"
                  style={{background:"rgba(212,160,23,0.1)", border:"1px solid rgba(212,160,23,0.25)"}}
                  title={formatDate(a.awardedAt)}
                >
                  {a.label}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">רווח מצטבר לאורך זמן</CardTitle></CardHeader>
          <CardContent><CumulativeProfitChart data={stats.cumulativeChart} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">ביצועים חודשיים</CardTitle></CardHeader>
          <CardContent><MonthlyPerformanceChart data={stats.monthlyChart} /></CardContent>
        </Card>
      </div>

      {/* Session history */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><History className="h-4 w-4" />היסטוריית ערבים</CardTitle></CardHeader>
        <CardContent>
          {stats.sessionHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">אין היסטוריה</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground text-xs">
                    <th className="pb-2 text-right font-medium px-2">תאריך</th>
                    <th className="pb-2 text-right font-medium px-2 hidden sm:table-cell">מיקום</th>
                    <th className="pb-2 text-right font-medium px-2">קנייה</th>
                    <th className="pb-2 text-right font-medium px-2 hidden md:table-cell">ריבאי</th>
                    <th className="pb-2 text-right font-medium px-2">יציאה</th>
                    <th className="pb-2 text-right font-medium px-2">רווח/הפסד</th>
                  </tr>
                </thead>
                <tbody>
                  {[...stats.sessionHistory].reverse().map((s) => (
                    <tr key={s.sessionId} className="border-b hover:bg-muted/30">
                      <td className="py-2 px-2">{formatDate(s.date)}</td>
                      <td className="py-2 px-2 text-muted-foreground hidden sm:table-cell">{s.location || "—"}</td>
                      <td className="py-2 px-2">{formatCurrency(s.buyIn)}</td>
                      <td className="py-2 px-2 hidden md:table-cell">{formatCurrency(s.rebuy)}</td>
                      <td className="py-2 px-2">{formatCurrency(s.cashOut)}</td>
                      <td className={cn("py-2 px-2 font-semibold",
                        s.profitLoss > 0 ? "text-green-600" : s.profitLoss < 0 ? "text-red-600" : "text-muted-foreground"
                      )}>
                        {s.profitLoss > 0 ? "+" : ""}{formatCurrency(s.profitLoss)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
