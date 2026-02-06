"use client";

import { DeadlinePriority, DeadlineStatus } from "@prisma/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDeadlineStore } from "@/store/deadline-store";
import type { Filters } from "@/lib/dashboard/deadline-queries";

const STATUS_OPTIONS: Array<{ label: string; value: DeadlineStatus | "all" }> = [
  { label: "All Statuses", value: "all" },
  { label: "Pending", value: "PENDING" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Overdue", value: "OVERDUE" },
  { label: "Blocked", value: "BLOCKED" },
];

const PRIORITY_OPTIONS: Array<{ label: string; value: DeadlinePriority | "all" }> = [
  { label: "All Priorities", value: "all" },
  { label: "Low", value: "LOW" },
  { label: "Medium", value: "MEDIUM" },
  { label: "High", value: "HIGH" },
  { label: "Critical", value: "CRITICAL" },
];

export function DeadlineFilters({ categories }: { categories: string[] }) {
  const filters = useDeadlineStore((state) => state.filters);
  const setFilters = useDeadlineStore((state) => state.setFilters);

  const update = (patch: Partial<Filters>) => setFilters({ ...filters, ...patch });

  return (
    <div className="flex flex-wrap gap-3">
      <Select
        value={filters.status ?? "all"}
        onValueChange={(value) => update({ status: value === "all" ? undefined : (value as DeadlineStatus) })}
      >
        <SelectTrigger className="w-44">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.priority ?? "all"}
        onValueChange={(value) => update({ priority: value === "all" ? undefined : (value as DeadlinePriority) })}
      >
        <SelectTrigger className="w-44">
          <SelectValue placeholder="Priority" />
        </SelectTrigger>
        <SelectContent>
          {PRIORITY_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.category ?? "all"}
        onValueChange={(value) => update({ category: value === "all" ? undefined : value })}
      >
        <SelectTrigger className="w-52">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          {categories.map((category) => (
            <SelectItem key={category} value={category}>
              {category}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
