import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition",
  {
    variants: {
      variant: {
        default: "border-white/10 bg-white/5 text-slate-200",
        critical: "border-red-500/40 bg-red-500/20 text-red-200",
        overdue: "border-red-500/50 bg-red-500/25 text-red-200",
        high: "border-orange-500/40 bg-orange-500/20 text-orange-200",
        medium: "border-yellow-500/40 bg-yellow-500/20 text-yellow-200",
        low: "border-emerald-500/40 bg-emerald-500/20 text-emerald-200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
