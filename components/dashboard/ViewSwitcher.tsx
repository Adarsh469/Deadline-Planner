"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type DashboardView = "list" | "timeline" | "calendar" | "overdue";

export function ViewSwitcher({ value, onChange }: { value: DashboardView; onChange: (v: DashboardView) => void }) {
  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as DashboardView)}>
      <TabsList className="bg-slate-900/70">
        <TabsTrigger value="list">List</TabsTrigger>
        <TabsTrigger value="timeline">Timeline</TabsTrigger>
        <TabsTrigger value="calendar">Calendar</TabsTrigger>
        <TabsTrigger value="overdue">Overdue</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
