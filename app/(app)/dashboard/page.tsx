"use client";

import { Suspense } from "react";
import { useDeadlineStore } from "@/store/deadline-store";
import { useDeadlines } from "@/lib/hooks/use-deadlines";
import { ListView } from "@/components/dashboard/ListView";
import { TimelineView } from "@/components/dashboard/TimelineView";
import { CalendarView } from "@/components/dashboard/CalendarView";
import { OverdueView } from "@/components/dashboard/OverdueView";
import { ViewSwitcher } from "@/components/dashboard/ViewSwitcher";
import { AnalyticsCards, PriorityBreakdown } from "@/components/dashboard/AnalyticsCards";
import { AnalyticsCharts } from "@/components/dashboard/AnalyticsCharts";
import { useAnalytics } from "@/lib/hooks/use-analytics";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { RecurrenceForm } from "@/components/recurrence/RecurrenceForm";
import { useDashboardUrlState } from "@/lib/hooks/use-dashboard-url-state";
import { DeadlineCreate } from "@/components/dashboard/DeadlineCreate";
import { RecurrenceManager } from "@/components/recurrence/RecurrenceManager";

function DashboardContent() {
  useDeadlines();
  const deadlines = useDeadlineStore((state) => state.deadlines);
  const { view, setView, sortMode, setSortMode } = useDashboardUrlState();
  const { overview, timeseries, loading } = useAnalytics();

  // Non-recurring: for list and overdue views (recurring instances only in timeline/calendar)
  const nonRecurring = deadlines.filter((d) => !d.recurrenceId);

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

        {view === "list" && <ListView deadlines={nonRecurring} sortMode={sortMode} onSortChange={setSortMode} />}
        {view === "timeline" && <TimelineView deadlines={deadlines} />}
        {view === "calendar" && <CalendarView deadlines={deadlines} />}
        {view === "overdue" && <OverdueView deadlines={nonRecurring} />}

        <NotificationCenter />

        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Create</h2>
            <p className="text-sm text-slate-400">Add a deadline to test the flow.</p>
          </div>
          <DeadlineCreate />
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Analytics</h2>
            <p className="text-sm text-slate-400">Your deadline performance at a glance.</p>
          </div>
          <AnalyticsCards overview={overview} loading={loading} />
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <AnalyticsCharts overview={overview} timeseries={timeseries} loading={loading} />
            </div>
            <PriorityBreakdown overview={overview} />
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Recurring Deadlines</h2>
            <p className="text-sm text-slate-400">Create automated schedules.</p>
          </div>
          <RecurrenceForm />
          <RecurrenceManager />
        </section>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950" />}>
      <DashboardContent />
    </Suspense>
  );
}
