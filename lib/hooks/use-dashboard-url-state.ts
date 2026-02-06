"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDeadlineStore } from "@/store/deadline-store";
import type { SortMode } from "@/lib/dashboard/deadline-queries";
import { DeadlinePriority, DeadlineStatus } from "@prisma/client";

export type DashboardView = "list" | "timeline" | "calendar" | "overdue";

const viewValues: DashboardView[] = ["list", "timeline", "calendar", "overdue"];
const sortValues: SortMode[] = ["urgency", "dueDate"];

function isDeadlineStatus(value: string): value is DeadlineStatus {
  return ["PENDING", "COMPLETED", "OVERDUE", "BLOCKED"].includes(value);
}

function isDeadlinePriority(value: string): value is DeadlinePriority {
  return ["LOW", "MEDIUM", "HIGH", "CRITICAL"].includes(value);
}

export function useDashboardUrlState() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filters = useDeadlineStore((state) => state.filters);
  const setFilters = useDeadlineStore((state) => state.setFilters);

  const [view, setView] = useState<DashboardView>("list");
  const [sortMode, setSortMode] = useState<SortMode>("urgency");
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const viewParam = searchParams.get("view");
    const sortParam = searchParams.get("sort");
    const statusParam = searchParams.get("status");
    const priorityParam = searchParams.get("priority");
    const categoryParam = searchParams.get("category");

    if (viewParam && viewValues.includes(viewParam as DashboardView)) {
      setView(viewParam as DashboardView);
    }
    if (sortParam && sortValues.includes(sortParam as SortMode)) {
      setSortMode(sortParam as SortMode);
    }

    setFilters({
      status: statusParam && isDeadlineStatus(statusParam) ? statusParam : undefined,
      priority: priorityParam && isDeadlinePriority(priorityParam) ? priorityParam : undefined,
      category: categoryParam || undefined,
    });
  }, [searchParams, setFilters]);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set("view", view);
    params.set("sort", sortMode);
    if (filters.status) params.set("status", filters.status);
    if (filters.priority) params.set("priority", filters.priority);
    if (filters.category) params.set("category", filters.category);
    return params.toString();
  }, [view, sortMode, filters]);

  useEffect(() => {
    if (!initialized.current) return;
    router.replace(`?${queryString}`, { scroll: false });
  }, [queryString, router]);

  return {
    view,
    setView,
    sortMode,
    setSortMode,
  };
}
