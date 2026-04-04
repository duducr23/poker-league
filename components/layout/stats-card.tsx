import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: "up" | "down" | "neutral";
  className?: string;
}

export function StatsCard({ title, value, subtitle, icon: Icon, trend, className }: StatsCardProps) {
  return (
    <Card
      className={cn("relative overflow-hidden", className)}
      style={{
        background: "linear-gradient(145deg, #13131f, #0f0f1a)",
        borderTop: "1px solid rgba(212,160,23,0.25)",
        boxShadow: "0 2px 20px rgba(0,0,0,0.4)",
      }}
    >
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{title}</p>
          {Icon && (
            <div
              className="flex h-7 w-7 items-center justify-center rounded-md"
              style={{ background: "rgba(212,160,23,0.1)" }}
            >
              <Icon className="h-3.5 w-3.5" style={{ color: "#d4a017" }} />
            </div>
          )}
        </div>
        <p
          className={cn(
            "text-2xl font-bold tracking-tight",
            trend === "up" && "text-emerald-400",
            trend === "down" && "text-red-400",
            !trend && "text-slate-100",
          )}
        >
          {value}
        </p>
        {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
      </CardContent>
      {/* Subtle corner accent */}
      <div
        className="absolute bottom-0 left-0 h-0.5 w-full opacity-20"
        style={{ background: "linear-gradient(90deg, transparent, #d4a017, transparent)" }}
      />
    </Card>
  );
}
