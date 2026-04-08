import { formatCurrency, cn } from "@/lib/utils";
import { CheckCircle2, Clock } from "lucide-react";

interface ResultRow {
  userId: string;
  name: string;
  buyIn: number;
  rebuy: number;
  cashOut: number;
  totalInvested: number;
  profitLoss: number;
  isSubmitted: boolean;
}

export function SessionResultsTable({ results }: { results: ResultRow[] }) {
  const total = results.filter((r) => r.isSubmitted).reduce((s, r) => s + r.profitLoss, 0);
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-muted-foreground text-xs">
            <th className="pb-3 text-right font-medium px-2">שחקן</th>
            <th className="pb-3 text-right font-medium px-2">קנייה</th>
            <th className="pb-3 text-right font-medium px-2 hidden md:table-cell">ריבאי</th>
            <th className="pb-3 text-right font-medium px-2">סה"כ קנייה</th>
            <th className="pb-3 text-right font-medium px-2">יציאה</th>
            <th className="pb-3 text-right font-medium px-2">רווח / הפסד</th>
            <th className="pb-3 text-right font-medium px-2">סטטוס</th>
          </tr>
        </thead>
        <tbody>
          {results.map((r) => (
            <tr key={r.userId} className={cn("border-b hover:bg-muted/30", !r.isSubmitted && "opacity-60")}>
              <td className="py-3 px-2 font-medium">{r.name}</td>
              <td className="py-3 px-2">{r.isSubmitted ? formatCurrency(r.buyIn) : "—"}</td>
              <td className="py-3 px-2 hidden md:table-cell">{r.isSubmitted ? formatCurrency(r.rebuy) : "—"}</td>
              <td className="py-3 px-2">{r.isSubmitted ? formatCurrency(r.totalInvested) : "—"}</td>
              <td className="py-3 px-2">{r.isSubmitted ? formatCurrency(r.cashOut) : "—"}</td>
              <td className={cn("py-3 px-2 font-semibold",
                !r.isSubmitted ? "text-muted-foreground" :
                r.profitLoss > 0 ? "text-green-600" : r.profitLoss < 0 ? "text-red-600" : "text-muted-foreground"
              )}>
                {r.isSubmitted ? `${r.profitLoss > 0 ? "+" : ""}${formatCurrency(r.profitLoss)}` : "—"}
              </td>
              <td className="py-3 px-2">
                {r.isSubmitted ? (
                  <span className="flex items-center gap-1 text-green-600 text-xs"><CheckCircle2 className="h-3 w-3" />הוגש</span>
                ) : (
                  <span className="flex items-center gap-1 text-amber-500 text-xs"><Clock className="h-3 w-3" />ממתין</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
        {results.some((r) => r.isSubmitted) && (
          <tfoot>
            <tr className="bg-muted/30 font-semibold">
              <td className="py-2 px-2" colSpan={3}>סה"כ</td>
              <td className="py-2 px-2" colSpan={3}></td>
              <td className={cn("py-2 px-2", total === 0 ? "text-green-600" : "text-red-600")}>
                {total === 0 ? "✓ מאוזן" : `${total > 0 ? "+" : ""}${formatCurrency(total)}`}
              </td>
              <td></td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
