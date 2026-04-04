import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Period } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS", maximumFractionDigits: 0 }).format(amount);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("he-IL", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(date));
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function getCurrentQuarter(date: Date = new Date()): number {
  return Math.floor(date.getMonth() / 3) + 1;
}

export function getPeriodDateRange(period: Period): { from: Date; to: Date } | null {
  const now = new Date();
  if (period === "all") return null;
  if (period === "month") {
    return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: now };
  }
  if (period === "quarter") {
    const q = getCurrentQuarter(now);
    const startMonth = (q - 1) * 3;
    return { from: new Date(now.getFullYear(), startMonth, 1), to: now };
  }
  if (period === "year") {
    return { from: new Date(now.getFullYear(), 0, 1), to: now };
  }
  return null;
}

export function calculateROI(totalProfit: number, totalInvested: number): number {
  if (totalInvested === 0) return 0;
  return (totalProfit / totalInvested) * 100;
}

export function calculateCurrentStreak(results: { profitLoss: number }[]): number {
  if (!results.length) return 0;
  const sorted = [...results].reverse();
  const first = sorted[0].profitLoss;
  const isWin = first > 0;
  let streak = 0;
  for (const r of sorted) {
    if (isWin && r.profitLoss > 0) streak++;
    else if (!isWin && r.profitLoss < 0) streak++;
    else break;
  }
  return isWin ? streak : -streak;
}

export function calculateLongestStreak(results: { profitLoss: number }[], type: "win" | "loss"): number {
  let max = 0;
  let current = 0;
  for (const r of results) {
    const matches = type === "win" ? r.profitLoss > 0 : r.profitLoss < 0;
    if (matches) {
      current++;
      max = Math.max(max, current);
    } else {
      current = 0;
    }
  }
  return max;
}

export function getPeriodLabel(period: Period): string {
  const labels: Record<Period, string> = {
    all: "כל הזמנים",
    month: "החודש",
    quarter: "הרבעון",
    year: "השנה",
  };
  return labels[period];
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    OPEN: "פתוח",
    CLOSED: "סגור",
    CANCELLED: "בוטל",
  };
  return labels[status] || status;
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    OPEN: "text-emerald-400 bg-emerald-950/50 border-emerald-800/50",
    CLOSED: "text-slate-400 bg-slate-800/50 border-slate-700/50",
    CANCELLED: "text-red-400 bg-red-950/50 border-red-800/50",
  };
  return colors[status] || "";
}
