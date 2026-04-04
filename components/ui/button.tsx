"use client";
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold ring-offset-background transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40 tracking-wide",
  {
    variants: {
      variant: {
        default:
          "text-[#0a0a12] shadow-md active:scale-[0.98]",
        destructive:
          "bg-red-600/90 text-white hover:bg-red-600 shadow-sm",
        outline:
          "border bg-transparent hover:bg-white/5 text-slate-300 hover:text-slate-100 active:scale-[0.98]",
        secondary:
          "bg-white/8 text-slate-200 hover:bg-white/12 shadow-sm",
        ghost:
          "text-slate-400 hover:bg-white/6 hover:text-slate-100",
        link:
          "text-yellow-500 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 rounded-md px-4 text-xs",
        lg: "h-12 rounded-lg px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, style, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    const goldStyle = (!variant || variant === "default") ? {
      background: "linear-gradient(135deg, #c8920f, #f5c842, #c8920f)",
      backgroundSize: "200% 100%",
      boxShadow: "0 0 14px rgba(212,160,23,0.35), 0 2px 6px rgba(0,0,0,0.4)",
      ...style,
    } : style;

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        style={goldStyle}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
