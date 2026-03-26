"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { TrendingUp, Target, Tag, CheckCheck } from "lucide-react";
import type { AnalyticsOverview, AnalyticsTimeseries } from "@/lib/hooks/use-analytics";

// ── Unified palette — muted, jewel-tone, harmonious ─────────────────
const CHART_COLORS = [
  "#38bdf8", // sky
  "#818cf8", // indigo
  "#34d399", // emerald
  "#fbbf24", // amber
  "#fb923c", // orange
  "#a78bfa", // violet
  "#f472b6", // pink
  "#2dd4bf", // teal
];

const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: "#f87171",
  HIGH: "#fb923c",
  MEDIUM: "#fbbf24",
  LOW: "#34d399",
};

const TOOLTIP_STYLE = {
  background: "#0c1222",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "12px",
  color: "#cbd5e1",
  fontSize: "12px",
  boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
};

const AXIS_STYLE = { stroke: "#334155", fontSize: 11 };

function ChartShell({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ElementType;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
      <div className="mb-5 flex items-center gap-2.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/8">
          <Icon size={13} className="text-slate-400" strokeWidth={1.8} />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-200">{title}</p>
          {subtitle && <p className="text-[11px] text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

function EmptyChartState({ message }: { message: string }) {
  return (
    <div className="flex h-48 items-center justify-center text-xs text-slate-600">
      {message}
    </div>
  );
}

export function AnalyticsCharts({
  overview,
  timeseries,
  loading,
}: {
  overview: AnalyticsOverview | null;
  timeseries: AnalyticsTimeseries;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-64 rounded-2xl border border-white/10 bg-white/5 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!overview || overview.totalCount === 0) return null;

  // ── Weekly area data ─────────────────────────────────────────────
  const areaData = timeseries.map((row) => ({
    week: new Date(row.week_start).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    Done: row.completed,
  }));

  // ── Priority bar data ────────────────────────────────────────────
  const priorityData = ["CRITICAL", "HIGH", "MEDIUM", "LOW"]
    .map((p) => {
      const found = overview.priorityDistribution.find((x) => x.priority === p);
      return { name: p.charAt(0) + p.slice(1).toLowerCase(), Tasks: found?.count ?? 0, fill: PRIORITY_COLORS[p] };
    })
    .filter((x) => x.Tasks > 0);

  // ── Category pie data ────────────────────────────────────────────
  const pieData = overview.categoryBreakdown.map((item, i) => ({
    name: item.category,
    value: item.count,
    fill: CHART_COLORS[i % CHART_COLORS.length],
  }));

  // ── On-time vs Late ──────────────────────────────────────────────
  const completed = overview.completedCount;
  const onTimeCount = Math.round((overview.onTimePercent / 100) * completed);
  const lateCount = completed - onTimeCount;
  const punctualityData = completed > 0
    ? [{ name: "Tasks", "On Time": onTimeCount, Late: lateCount }]
    : [];

  return (
    <div className="grid gap-4 lg:grid-cols-2">

      {/* Weekly Completions */}
      <ChartShell icon={TrendingUp} title="Weekly Completions" subtitle="Non-recurring tasks · last 90 days">
        <div className="h-48">
          {areaData.length === 0 ? (
            <EmptyChartState message="No completions in the last 90 days" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={areaData}>
                <defs>
                  <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#38bdf8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="week" {...AXIS_STYLE} tickLine={false} axisLine={false} />
                <YAxis {...AXIS_STYLE} allowDecimals={false} tickLine={false} axisLine={false} width={28} />
                <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ stroke: "rgba(255,255,255,0.06)" }} />
                <Area
                  type="monotone" dataKey="Done"
                  stroke="#38bdf8" strokeWidth={2}
                  fill="url(#skyGrad)"
                  dot={{ fill: "#38bdf8", r: 3, strokeWidth: 0 }}
                  activeDot={{ r: 4, fill: "#38bdf8", strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </ChartShell>

      {/* Priority Distribution */}
      <ChartShell icon={Target} title="Priority Distribution" subtitle="Tasks by urgency level">
        <div className="h-48">
          {priorityData.length === 0 ? (
            <EmptyChartState message="No data" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityData} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="name" {...AXIS_STYLE} tickLine={false} axisLine={false} />
                <YAxis {...AXIS_STYLE} allowDecimals={false} tickLine={false} axisLine={false} width={28} />
                <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                <Bar dataKey="Tasks" radius={[5, 5, 0, 0]}>
                  {priorityData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </ChartShell>

      {/* Category Breakdown */}
      <ChartShell icon={Tag} title="Category Breakdown" subtitle="Tasks across your categories">
        <div className="h-48">
          {pieData.length === 0 ? (
            <EmptyChartState message="No categories set" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData} dataKey="value" nameKey="name"
                  cx="50%" cy="50%"
                  innerRadius={44} outerRadius={72}
                  paddingAngle={3} strokeWidth={0}
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} opacity={0.85} />
                  ))}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend
                  iconType="circle" iconSize={7}
                  wrapperStyle={{ fontSize: "11px", color: "#64748b" }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </ChartShell>

      {/* On-Time vs Late */}
      <ChartShell icon={CheckCheck} title="On-Time vs Late" subtitle="Breakdown of completed tasks">
        <div className="h-48">
          {punctualityData.length === 0 || completed === 0 ? (
            <EmptyChartState message="Complete some tasks to see this breakdown" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={punctualityData} layout="vertical" barSize={30}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                <XAxis type="number" {...AXIS_STYLE} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" {...AXIS_STYLE} tickLine={false} width={50} />
                <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                <Legend
                  iconType="circle" iconSize={7}
                  wrapperStyle={{ fontSize: "11px", color: "#64748b" }}
                />
                <Bar dataKey="On Time" stackId="a" fill="#34d399" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Late" stackId="a" fill="#f87171" radius={[0, 5, 5, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </ChartShell>

    </div>
  );
}
