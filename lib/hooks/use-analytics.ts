"use client";

import { useEffect, useState } from "react";

export type AnalyticsOverview = {
  totalCount: number;
  completedCount: number;
  overdueCount: number;
  onTimePercent: number;
  avgDelayHours: number;
  priorityDistribution: Array<{ priority: string; count: number }>;
};

export type AnalyticsTimeseries = Array<{ week_start: string; completed: number }>;

export function useAnalytics() {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [timeseries, setTimeseries] = useState<AnalyticsTimeseries>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);

    Promise.all([
      fetch("/api/analytics/overview").then((res) => (res.ok ? res.json() : Promise.reject(res.status))),
      fetch("/api/analytics/timeseries").then((res) => (res.ok ? res.json() : Promise.reject(res.status))),
    ])
      .then(([overviewRes, timeseriesRes]) => {
        if (!active) return;
        setOverview(overviewRes.data ?? null);
        setTimeseries(timeseriesRes.data ?? []);
      })
      .catch(() => {
        if (!active) return;
        setOverview(null);
        setTimeseries([]);
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return { overview, timeseries, loading };
}
