import { SubmissionProgress } from "@/types";
import { CheckCircle2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export function SessionSubmissionProgress({ progress }: { progress: SubmissionProgress }) {
  const pct = progress.total > 0 ? Math.round((progress.submitted / progress.total) * 100) : 0;
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">התקדמות הגשה</span>
        <span className="text-muted-foreground">{progress.submitted} / {progress.total}</span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
        <div className={cn("h-full rounded-full transition-all", pct === 100 ? "bg-green-500" : "bg-primary")} style={{ width: `${pct}%` }} />
      </div>
      {progress.pending.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground font-medium">ממתינים להגשה:</p>
          {progress.pending.map((p) => (
            <div key={p.userId} className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{p.name}</span>
            </div>
          ))}
        </div>
      )}
      {progress.pending.length === 0 && (
        <div className="flex items-center gap-2 text-xs text-green-600">
          <CheckCircle2 className="h-3 w-3" />
          <span>כל המשתתפים הגישו תוצאות</span>
        </div>
      )}
    </div>
  );
}
