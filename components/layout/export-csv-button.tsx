"use client";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  href: string;
  label?: string;
}

export function ExportCsvButton({ href, label = "ייצוא CSV" }: Props) {
  return (
    <a href={href} download>
      <Button variant="outline" size="sm" className="gap-2">
        <Download className="h-4 w-4" />
        {label}
      </Button>
    </a>
  );
}
