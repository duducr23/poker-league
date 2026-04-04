"use client";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, ReferenceLine,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

export function CumulativeProfitChart({ data }: { data: { date: string; cumulative: number }[] }) {
  if (!data.length) return <p className="text-center text-muted-foreground py-8">אין נתונים</p>;
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="date" tick={{ fontSize: 11, fontFamily: "sans-serif" }} />
        <YAxis tickFormatter={(v) => `₪${v}`} tick={{ fontSize: 11 }} />
        <Tooltip formatter={(v: number) => [formatCurrency(v), "רווח מצטבר"]} />
        <ReferenceLine y={0} stroke="#9ca3af" strokeDasharray="3 3" />
        <Line type="monotone" dataKey="cumulative" stroke="#16a34a" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function MonthlyPerformanceChart({ data }: { data: { month: string; profitLoss: number }[] }) {
  if (!data.length) return <p className="text-center text-muted-foreground py-8">אין נתונים</p>;
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
        <YAxis tickFormatter={(v) => `₪${v}`} tick={{ fontSize: 11 }} />
        <Tooltip formatter={(v: number) => [formatCurrency(v), "רווח/הפסד"]} />
        <ReferenceLine y={0} stroke="#9ca3af" />
        <Bar dataKey="profitLoss" fill="#16a34a" radius={[4, 4, 0, 0]}
          label={false}
          // Color each bar by value
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
