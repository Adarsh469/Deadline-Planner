"use client";

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, BarChart, Bar } from "recharts";
import type { AnalyticsOverview, AnalyticsTimeseries } from "@/lib/hooks/use-analytics";

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
      <div className="grid gap-4 md:grid-cols-2">
        <div className="h-64 rounded-2xl border border-white/10 bg-white/5 animate-pulse" />
        <div className="h-64 rounded-2xl border border-white/10 bg-white/5 animate-pulse" />
      </div>
    );
  }

  if (!overview || overview.totalCount === 0) {
    return null;
  }

  const lineData = timeseries.map((row) => ({
    week: new Date(row.week_start).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    completed: row.completed,
  }));

  const barData = overview.priorityDistribution.map((item) => ({
    priority: item.priority,
    count: item.count,
  }));

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="mb-3 text-sm font-semibold text-slate-200">Weekly completions</div>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={lineData}>
              <XAxis dataKey="week" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  background: "#0f172a",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#e2e8f0",
                }}
              />
              <Line type="monotone" dataKey="completed" stroke="#38bdf8" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="mb-3 text-sm font-semibold text-slate-200">Priority distribution</div>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData}>
              <XAxis dataKey="priority" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  background: "#0f172a",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#e2e8f0",
                }}
              />
              <Bar dataKey="count" fill="#fbbf24" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
