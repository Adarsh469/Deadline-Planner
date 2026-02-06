"use client";

import { AnalyticsOverview } from "@/lib/hooks/use-analytics";
import { cn } from "@/lib/utils";

const cardBase =
  "rounded-2xl border border-white/10 bg-white/5 p-5 text-slate-100 shadow-sm";

export function AnalyticsCards({ overview, loading }: { overview: AnalyticsOverview | null; loading: boolean }) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={cn(cardBase, "h-28 animate-pulse bg-white/10")} />
        ))}
      </div>
    );
  }

  if (!overview || overview.totalCount === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-slate-300">
        Create your first deadline to unlock analytics.
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <div className={cardBase}>
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Total</p>
        <p className="mt-3 text-2xl font-semibold">{overview.totalCount}</p>
      </div>
      <div className={cardBase}>
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Completed</p>
        <p className="mt-3 text-2xl font-semibold">{overview.completedCount}</p>
      </div>
      <div className={cardBase}>
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Overdue</p>
        <p className="mt-3 text-2xl font-semibold text-red-300">{overview.overdueCount}</p>
      </div>
      <div className={cardBase}>
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">On-time</p>
        <p className="mt-3 text-2xl font-semibold">{overview.onTimePercent.toFixed(1)}%</p>
      </div>
    </div>
  );
}
