"use client";

import { motion } from "framer-motion";
import type { AnalyticsOverview } from "@/lib/hooks/use-analytics";
import { cn } from "@/lib/utils";

const PRIORITY_ORDER = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];

function RingProgress({ percent, color }: { percent: number; color: string }) {
  const r = 26;
  const circ = 2 * Math.PI * r;
  const dash = (Math.min(100, percent) / 100) * circ;
  return (
    <svg width="72" height="72" className="rotate-[-90deg]">
      <circle cx="36" cy="36" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="6" />
      <motion.circle
        cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: circ - dash }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      />
    </svg>
  );
}

const skeletonCard = "h-36 rounded-2xl border border-white/10 bg-white/10 animate-pulse";

export function AnalyticsCards({
  overview,
  loading,
}: {
  overview: AnalyticsOverview | null;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className={skeletonCard} />
        ))}
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-slate-400 text-center">
        No data yet — create some deadlines to see analytics.
      </div>
    );
  }

  const completionPct =
    overview.totalCount > 0 ? (overview.completedCount / overview.totalCount) * 100 : 0;

  const cards = [
    {
      label: "Total Tasks",
      value: overview.totalCount,
      sub: `${overview.overdueCount} overdue`,
      color: "#38bdf8",
      ring: false,
    },
    {
      label: "Completion Rate",
      value: `${completionPct.toFixed(0)}%`,
      sub: `${overview.completedCount} done`,
      color: "#34d399",
      ring: true,
      pct: completionPct,
    },
    {
      label: "On-Time Rate",
      value: `${overview.onTimePercent.toFixed(0)}%`,
      sub: overview.onTimePercent >= 80 ? "Great work!" : "Keep improving",
      color: overview.onTimePercent >= 70 ? "#34d399" : overview.onTimePercent >= 40 ? "#fbbf24" : "#f87171",
      ring: true,
      pct: overview.onTimePercent,
    },
    {
      label: "Current Streak",
      value: `${overview.streakDays}`,
      sub: overview.streakDays === 1 ? "day" : "days",
      icon: "🔥",
      color: "#fb923c",
      ring: false,
    },
    {
      label: "Avg Lateness",
      value: overview.avgDaysLate > 0 ? `${overview.avgDaysLate.toFixed(1)}d` : "0d",
      sub: overview.avgDaysLate === 0 ? "Always on time!" : "avg delay",
      color: overview.avgDaysLate === 0 ? "#34d399" : overview.avgDaysLate < 3 ? "#fbbf24" : "#f87171",
      ring: false,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {cards.map((card, i) => (
        <motion.div
          key={card.label}
          className="rounded-2xl border border-white/10 bg-white/5 p-5 flex flex-col justify-between gap-3 backdrop-blur"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}
          whileHover={{ scale: 1.02, borderColor: card.color + "50" }}
          style={{ borderColor: undefined }}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            {card.label}
          </p>
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-3xl font-bold tracking-tight text-slate-100" style={{ color: card.color }}>
                {card.icon ? `${card.icon} ${card.value}` : card.value}
              </p>
              <p className="mt-1 text-xs text-slate-500">{card.sub}</p>
            </div>
            {card.ring && (
              <div className="relative shrink-0">
                <RingProgress percent={card.pct!} color={card.color} />
              </div>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export function PriorityBreakdown({
  overview,
}: {
  overview: AnalyticsOverview | null;
}) {
  if (!overview || overview.priorityDistribution.length === 0) return null;

  const colors: Record<string, string> = {
    CRITICAL: "#f87171",
    HIGH: "#fb923c",
    MEDIUM: "#fbbf24",
    LOW: "#34d399",
  };

  const ordered = PRIORITY_ORDER.map((p) => {
    const found = overview.priorityDistribution.find((x) => x.priority === p);
    return { priority: p, count: found?.count ?? 0 };
  }).filter((x) => x.count > 0);

  const total = ordered.reduce((s, x) => s + x.count, 0);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-3">
      <p className="text-sm font-semibold text-slate-200">Priority Breakdown</p>
      {ordered.map((item, i) => {
        const pct = total > 0 ? (item.count / total) * 100 : 0;
        return (
          <div key={item.priority} className="space-y-1">
            <div className="flex justify-between text-xs text-slate-400">
              <span>{item.priority}</span>
              <span>{item.count}</span>
            </div>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: colors[item.priority] ?? "#94a3b8" }}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ delay: i * 0.1, duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
