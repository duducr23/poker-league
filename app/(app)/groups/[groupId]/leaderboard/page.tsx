import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LeaderboardTable } from "@/components/leaderboard/leaderboard-table";
import { PeriodFilterTabs } from "@/components/layout/period-filter-tabs";
import { ExportCsvButton } from "@/components/layout/export-csv-button";
import { getLeaderboard, LEADERBOARD_MIN_GAMES } from "@/lib/leaderboard";
import { Period } from "@/types";
import { Trophy, Loader2, Info } from "lucide-react";

export default async function LeaderboardPage({
  params,
  searchParams,
}: {
  params: { groupId: string };
  searchParams: { period?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const group = await prisma.group.findUnique({ where: { id: params.groupId }, select: { name: true } });
  if (!group) notFound();

  const period: Period = (["all", "month", "quarter", "year"].includes(searchParams.period || "") ? searchParams.period : "all") as Period;

  const rows = await getLeaderboard(params.groupId, period);

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Trophy className="h-7 w-7 text-yellow-500" />
          <div>
            <h1 className="text-2xl font-bold">טבלת דירוג</h1>
            <p className="text-muted-foreground">{group.name}</p>
          </div>
        </div>
        <ExportCsvButton
          href={`/api/groups/${params.groupId}/export/leaderboard?period=${period}`}
          label="ייצוא CSV"
        />
      </div>

      <Suspense fallback={<Loader2 className="h-5 w-5 animate-spin" />}>
        <PeriodFilterTabs currentPeriod={period} />
      </Suspense>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {period === "all" ? "כל הזמנים" : period === "month" ? "החודש" : period === "quarter" ? "הרבעון" : "השנה"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-800/40 border border-slate-700/40 rounded-lg px-3 py-2">
            <Info className="h-3.5 w-3.5 shrink-0" />
            שחקנים עם פחות מ-{LEADERBOARD_MIN_GAMES} משחקים אינם מוצגים בטבלה (אורחים ייכנסו לדירוג לאחר {LEADERBOARD_MIN_GAMES} משחקים)
          </div>
          <LeaderboardTable rows={rows} groupId={params.groupId} />
        </CardContent>
      </Card>
    </div>
  );
}
