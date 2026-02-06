"use client";

import { useDeadlineStore } from "@/store/deadline-store";
import { useDeadlines } from "@/lib/hooks/use-deadlines";
import { ListView } from "@/components/dashboard/ListView";
import { TimelineView } from "@/components/dashboard/TimelineView";
import { CalendarView } from "@/components/dashboard/CalendarView";
import { OverdueView } from "@/components/dashboard/OverdueView";
import { ViewSwitcher } from "@/components/dashboard/ViewSwitcher";
import { AnalyticsCards } from "@/components/dashboard/AnalyticsCards";
import { AnalyticsCharts } from "@/components/dashboard/AnalyticsCharts";
import { useAnalytics } from "@/lib/hooks/use-analytics";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { RecurrenceForm } from "@/components/recurrence/RecurrenceForm";
import { useDashboardUrlState } from "@/lib/hooks/use-dashboard-url-state";

export default function DashboardPage() {
  useDeadlines();
  const deadlines = useDeadlineStore((state) => state.deadlines);
  const { view, setView, sortMode, setSortMode } = useDashboardUrlState();
  const { overview, timeseries, loading } = useAnalytics();

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
            <p className="text-sm text-slate-400">
              Urgency-focused views for everything time-critical.
            </p>
          </div>
          <ViewSwitcher value={view} onChange={setView} />
        </header>

        <NotificationCenter />

        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Analytics</h2>
            <p className="text-sm text-slate-400">Completion performance and distribution.</p>
          </div>
          <AnalyticsCards overview={overview} loading={loading} />
          <AnalyticsCharts overview={overview} timeseries={timeseries} loading={loading} />
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Recurring Deadlines</h2>
            <p className="text-sm text-slate-400">Create automated schedules.</p>
          </div>
          <RecurrenceForm />
        </section>

        {view === "list" && <ListView deadlines={deadlines} sortMode={sortMode} onSortChange={setSortMode} />}
        {view === "timeline" && <TimelineView deadlines={deadlines} />}
        {view === "calendar" && <CalendarView deadlines={deadlines} />}
        {view === "overdue" && <OverdueView deadlines={deadlines} />}
      </div>
    </div>
  );
}
