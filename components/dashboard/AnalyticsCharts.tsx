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
import type { AnalyticsOverview, AnalyticsTimeseries } from "@/lib/hooks/use-analytics";

const TOOLTIP_STYLE = {
  background: "#0f172a",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "10px",
  color: "#e2e8f0",
  fontSize: "12px",
};

const CATEGORY_COLORS = [
  "#38bdf8", "#34d399", "#fbbf24", "#f87171", "#a78bfa",
  "#fb923c", "#e879f9", "#2dd4bf", "#facc15", "#818cf8",
];

function ChartShell({
  title,
  subtitle,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur ${className}`}>
      <div className="mb-4">
        <p className="text-sm font-semibold text-slate-200">{title}</p>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {children}
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
          <div
            key={i}
            className="h-64 rounded-2xl border border-white/10 bg-white/5 animate-pulse"
          />
        ))}
      </div>
    );
  }

  const hasData = overview && overview.totalCount > 0;
  if (!hasData) return null;

  // ── Weekly completions (Area chart) ───────────────────────────────
  const areaData = timeseries.map((row) => ({
    week: new Date(row.week_start).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    }),
    Done: row.completed,
  }));

  // ── Priority bar chart ────────────────────────────────────────────
  const PRIORITY_COLORS: Record<string, string> = {
    CRITICAL: "#f87171",
    HIGH: "#fb923c",
    MEDIUM: "#fbbf24",
    LOW: "#34d399",
  };
  const priorityData = overview.priorityDistribution
    .slice()
    .sort((a, b) => {
      const ORDER = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];
      return ORDER.indexOf(a.priority) - ORDER.indexOf(b.priority);
    })
    .map((item) => ({
      name: item.priority,
      Tasks: item.count,
      fill: PRIORITY_COLORS[item.priority] ?? "#94a3b8",
    }));

  // ── Category pie chart ────────────────────────────────────────────
  const pieData = overview.categoryBreakdown.map((item, i) => ({
    name: item.category,
    value: item.count,
    fill: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
  }));

  // ── On-time vs Late stacked bar ───────────────────────────────────
  const completedCount = overview.completedCount;
  const onTimeCount = Math.round((overview.onTimePercent / 100) * completedCount);
  const lateCount = completedCount - onTimeCount;
  const punctualityData =
    completedCount > 0
      ? [{ name: "Completed", "On Time": onTimeCount, Late: lateCount }]
      : [];

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Weekly Completions */}
      <ChartShell title="Weekly Completions" subtitle="Non-recurring tasks completed per week (last 90 days)">
        <div className="h-52">
          {areaData.length === 0 ? (
            <div className="flex h-full items-center justify-center text-xs text-slate-500">
              No completions in the last 90 days
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={areaData}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="week" stroke="#475569" fontSize={11} tickLine={false} />
                <YAxis stroke="#475569" fontSize={11} allowDecimals={false} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Area
                  type="monotone"
                  dataKey="Done"
                  stroke="#38bdf8"
                  strokeWidth={2}
                  fill="url(#areaGrad)"
                  dot={{ fill: "#38bdf8", r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </ChartShell>

      {/* Priority Distribution */}
      <ChartShell title="Priority Distribution" subtitle="Count of tasks by priority level">
        <div className="h-52">
          {priorityData.length === 0 ? (
            <div className="flex h-full items-center justify-center text-xs text-slate-500">
              No data
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityData} barSize={36}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="#475569" fontSize={11} tickLine={false} />
                <YAxis stroke="#475569" fontSize={11} allowDecimals={false} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="Tasks" radius={[6, 6, 0, 0]}>
                  {priorityData.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </ChartShell>

      {/* Category Breakdown Pie */}
      <ChartShell title="Category Breakdown" subtitle="Distribution across your custom categories">
        <div className="h-52">
          {pieData.length === 0 ? (
            <div className="flex h-full items-center justify-center text-xs text-slate-500">
              No categories set
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={76}
                  paddingAngle={3}
                  strokeWidth={0}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: "11px", color: "#94a3b8" }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </ChartShell>

      {/* On-Time vs Late */}
      <ChartShell title="On-Time vs Late" subtitle="For all completed tasks">
        <div className="h-52">
          {punctualityData.length === 0 || completedCount === 0 ? (
            <div className="flex h-full items-center justify-center text-xs text-slate-500">
              Complete some tasks to see this breakdown
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={punctualityData} layout="vertical" barSize={36}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" stroke="#475569" fontSize={11} tickLine={false} width={70} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: "11px", color: "#94a3b8" }}
                />
                <Bar dataKey="On Time" stackId="a" fill="#34d399" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Late" stackId="a" fill="#f87171" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </ChartShell>
    </div>
  );
}
