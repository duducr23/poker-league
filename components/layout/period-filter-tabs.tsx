"use client";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Period } from "@/types";

const periods: { value: Period; label: string }[] = [
  { value: "all", label: "כל הזמנים" },
  { value: "month", label: "החודש" },
  { value: "quarter", label: "הרבעון" },
  { value: "year", label: "השנה" },
];

export function PeriodFilterTabs({ currentPeriod }: { currentPeriod: Period }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("period", value);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <Tabs value={currentPeriod} onValueChange={handleChange}>
      <TabsList>
        {periods.map((p) => (
          <TabsTrigger key={p.value} value={p.value}>{p.label}</TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
