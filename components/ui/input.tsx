import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-lg border px-3 py-2 text-sm placeholder:text-slate-600 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
        className
      )}
      style={{
        background: "#0c0c18",
        borderColor: "rgba(212,160,23,0.18)",
        color: "#e8eaed",
      }}
      onFocus={e => { (e.currentTarget as HTMLInputElement).style.borderColor = "rgba(212,160,23,0.55)"; }}
      onBlur={e => { (e.currentTarget as HTMLInputElement).style.borderColor = "rgba(212,160,23,0.18)"; }}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = "Input";

export { Input };
