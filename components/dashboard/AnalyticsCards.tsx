"use client";

import { motion } from "framer-motion";
import {
  LayoutGrid,
  CheckCircle2,
  Zap,
  CalendarCheck2,
  Clock4,
} from "lucide-react";
import type { AnalyticsOverview } from "@/lib/hooks/use-analytics";

// ── Design tokens — synced with app's dark slate aesthetic ──────────
const PALETTE = {
  blue: { bg: "rgba(56,189,248,0.08)", border: "rgba(56,189,248,0.18)", text: "#38bdf8", glow: "rgba(56,189,248,0.15)" },
  violet: { bg: "rgba(139,92,246,0.08)", border: "rgba(139,92,246,0.18)", text: "#a78bfa", glow: "rgba(139,92,246,0.15)" },
  emerald: { bg: "rgba(52,211,153,0.08)", border: "rgba(52,211,153,0.18)", text: "#34d399", glow: "rgba(52,211,153,0.15)" },
  amber: { bg: "rgba(251,191,36,0.08)", border: "rgba(251,191,36,0.18)", text: "#fbbf24", glow: "rgba(251,191,36,0.15)" },
  rose: { bg: "rgba(248,113,113,0.08)", border: "rgba(248,113,113,0.18)", text: "#f87171", glow: "rgba(248,113,113,0.15)" },
};

type PaletteKey = keyof typeof PALETTE;

function RingProgress({ percent, color }: { percent: number; color: string }) {
  const r = 24;
  const circ = 2 * Math.PI * r;
  const dash = (Math.min(100, percent) / 100) * circ;
  return (
    <svg width="64" height="64" className="-rotate-90" aria-hidden>
      <circle cx="32" cy="32" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
      <motion.circle
        cx="32" cy="32" r={r} fill="none"
        stroke={color} strokeWidth="5" strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: circ - dash }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      />
    </svg>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  palette,
  ring,
  delay = 0,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub: string;
  palette: PaletteKey;
  ring?: number;
  delay?: number;
}) {
  const p = PALETTE[palette];
  return (
    <motion.div
      className="rounded-2xl border p-5 flex flex-col gap-4 backdrop-blur-sm"
      style={{ background: p.bg, borderColor: p.border }}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
    >
      <div className="flex items-center justify-between">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={{ background: p.glow }}
        >
          <Icon size={15} style={{ color: p.text }} strokeWidth={1.8} />
        </div>
        {ring !== undefined && (
          <RingProgress percent={ring} color={p.text} />
        )}
      </div>
      <div>
        <p className="text-2xl font-bold tracking-tight text-slate-50" style={{ color: p.text }}>
          {value}
        </p>
        <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
          {label}
        </p>
        <p className="mt-1 text-xs text-slate-500">{sub}</p>
      </div>
    </motion.div>
  );
}

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
          <div key={i} className="h-40 rounded-2xl border border-white/10 bg-white/5 animate-pulse" />
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

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <StatCard
        icon={LayoutGrid}
        label="Total Tasks"
        value={overview.totalCount}
        sub={`${overview.overdueCount} overdue`}
        palette="blue"
        delay={0}
      />
      <StatCard
        icon={CheckCircle2}
        label="Completion Rate"
        value={`${completionPct.toFixed(0)}%`}
        sub={`${overview.completedCount} of ${overview.totalCount} done`}
        palette="emerald"
        ring={completionPct}
        delay={0.06}
      />
      <StatCard
        icon={Zap}
        label="On-Time Rate"
        value={`${overview.onTimePercent.toFixed(0)}%`}
        sub={overview.onTimePercent >= 80 ? "Excellent pace" : overview.onTimePercent >= 50 ? "Keep going" : "Needs attention"}
        palette={overview.onTimePercent >= 70 ? "emerald" : overview.onTimePercent >= 40 ? "amber" : "rose"}
        ring={overview.onTimePercent}
        delay={0.12}
      />
      <StatCard
        icon={CalendarCheck2}
        label="Current Streak"
        value={`${overview.streakDays}d`}
        sub={overview.streakDays === 0 ? "No streak yet" : "days consecutive"}
        palette="violet"
        delay={0.18}
      />
      <StatCard
        icon={Clock4}
        label="Avg Lateness"
        value={overview.avgDaysLate > 0 ? `${overview.avgDaysLate.toFixed(1)}d` : "0d"}
        sub={overview.avgDaysLate === 0 ? "Always on time" : "avg delay"}
        palette={overview.avgDaysLate === 0 ? "emerald" : overview.avgDaysLate < 3 ? "amber" : "rose"}
        delay={0.24}
      />
    </div>
  );
}

// ── Priority breakdown sidebar ──────────────────────────────────────
const PRIORITY_CFG = [
  { key: "CRITICAL", label: "Critical", color: "#f87171" },
  { key: "HIGH", label: "High", color: "#fb923c" },
  { key: "MEDIUM", label: "Medium", color: "#fbbf24" },
  { key: "LOW", label: "Low", color: "#34d399" },
];

export function PriorityBreakdown({ overview }: { overview: AnalyticsOverview | null }) {
  if (!overview || overview.priorityDistribution.length === 0) return null;

  const total = overview.priorityDistribution.reduce((s, x) => s + x.count, 0);
  const ordered = PRIORITY_CFG.map((cfg) => {
    const found = overview.priorityDistribution.find((x) => x.priority === cfg.key);
    return { ...cfg, count: found?.count ?? 0 };
  }).filter((x) => x.count > 0);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <LayoutGrid size={13} className="text-slate-400" strokeWidth={1.8} />
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Priority Mix</p>
      </div>
      {ordered.map((item, i) => {
        const pct = total > 0 ? (item.count / total) * 100 : 0;
        return (
          <div key={item.key} className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300">{item.label}</span>
              <span className="tabular-nums text-slate-500">{item.count}</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-white/8 overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: item.color }}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ delay: i * 0.08, duration: 0.9, ease: "easeOut" }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
