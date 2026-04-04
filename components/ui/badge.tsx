import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors tracking-wide",
  {
    variants: {
      variant: {
        default:
          "border-transparent text-[#0a0a12]",
        secondary:
          "border-transparent bg-white/8 text-slate-300",
        destructive:
          "border-transparent bg-red-900/60 text-red-300",
        outline:
          "border-white/15 text-slate-300",
        success:
          "border-transparent bg-emerald-900/50 text-emerald-300",
        warning:
          "border-transparent bg-yellow-900/50 text-yellow-300",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, style, ...props }: BadgeProps) {
  const goldStyle = (!variant || variant === "default") ? {
    background: "linear-gradient(135deg, #c8920f, #f5c842)",
    boxShadow: "0 0 8px rgba(212,160,23,0.25)",
    ...style,
  } : style;

  return <div className={cn(badgeVariants({ variant }), className)} style={goldStyle} {...props} />;
}

export { Badge, badgeVariants };
