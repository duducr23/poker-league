import Link from "next/link";
import { LeaderboardRow } from "@/types";
import { formatCurrency, formatPercent, cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus, Medal } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface LeaderboardTableProps {
  rows: LeaderboardRow[];
  groupId: string;
}

export function LeaderboardTable({ rows, groupId }: LeaderboardTableProps) {
  if (!rows.length) return <p className="text-center text-muted-foreground py-8">אין נתונים לתקופה זו</p>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-muted-foreground text-xs">
            <th className="pb-3 text-right font-medium px-2">#</th>
            <th className="pb-3 text-right font-medium px-2">שחקן</th>
            <th className="pb-3 text-right font-medium px-2">משחקים</th>
            <th className="pb-3 text-right font-medium px-2 hidden md:table-cell">רווחיים</th>
            <th className="pb-3 text-right font-medium px-2 hidden md:table-cell">הפסד</th>
            <th className="pb-3 text-right font-medium px-2">% הצלחה</th>
            <th className="pb-3 text-right font-medium px-2 hidden lg:table-cell">סה"כ השקעה</th>
            <th className="pb-3 text-right font-medium px-2">רווח / הפסד</th>
            <th className="pb-3 text-right font-medium px-2 hidden lg:table-cell">ממוצע</th>
            <th className="pb-3 text-right font-medium px-2 hidden md:table-cell">תשואה</th>
            <th className="pb-3 text-right font-medium px-2">רצף</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.userId} className="border-b hover:bg-muted/30 transition-colors">
              <td className="py-3 px-2">
                {row.rank <= 3 ? (
                  <Medal className={cn("h-5 w-5",
                    row.rank === 1 && "text-yellow-500",
                    row.rank === 2 && "text-gray-400",
                    row.rank === 3 && "text-amber-600"
                  )} />
                ) : (
                  <span className="text-muted-foreground font-mono">{row.rank}</span>
                )}
              </td>
              <td className="py-3 px-2 font-medium">
                <Link href={`/groups/${groupId}/players/${row.userId}`} className="hover:text-primary hover:underline">
                  {row.name}
                </Link>
              </td>
              <td className="py-3 px-2 text-slate-400">{row.gamesPlayed}</td>
              <td className="py-3 px-2 text-emerald-400 hidden md:table-cell">{row.profitableNights}</td>
              <td className="py-3 px-2 text-red-400 hidden md:table-cell">{row.losingNights}</td>
              <td className="py-3 px-2">
                <Badge variant={row.successRate >= 50 ? "success" : "outline"}>
                  {formatPercent(row.successRate)}
                </Badge>
              </td>
              <td className="py-3 px-2 text-muted-foreground hidden lg:table-cell">{formatCurrency(row.totalInvested)}</td>
              <td className={cn("py-3 px-2 font-semibold",
                row.totalProfitLoss > 0 ? "text-emerald-400" : row.totalProfitLoss < 0 ? "text-red-400" : "text-muted-foreground"
              )}>
                {row.totalProfitLoss > 0 ? "+" : ""}{formatCurrency(row.totalProfitLoss)}
              </td>
              <td className={cn("py-3 px-2 hidden lg:table-cell",
                row.avgProfitPerGame > 0 ? "text-emerald-400" : row.avgProfitPerGame < 0 ? "text-red-400" : "text-muted-foreground"
              )}>
                {row.avgProfitPerGame > 0 ? "+" : ""}{formatCurrency(row.avgProfitPerGame)}
              </td>
              <td className={cn("py-3 px-2 hidden md:table-cell",
                row.roi > 0 ? "text-emerald-400" : row.roi < 0 ? "text-red-400" : "text-muted-foreground"
              )}>
                {formatPercent(row.roi)}
              </td>
              <td className="py-3 px-2">
                {row.currentStreak > 0 ? (
                  <span className="flex items-center gap-1 text-emerald-400">
                    <TrendingUp className="h-3 w-3" />{row.currentStreak}
                  </span>
                ) : row.currentStreak < 0 ? (
                  <span className="flex items-center gap-1 text-red-500">
                    <TrendingDown className="h-3 w-3" />{Math.abs(row.currentStreak)}
                  </span>
                ) : (
                  <span className="text-muted-foreground"><Minus className="h-3 w-3" /></span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
