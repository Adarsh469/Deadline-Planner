"use client";

import { useMemo } from "react";
import type { Deadline } from "@prisma/client";
import { DeadlineCard } from "@/components/deadline/DeadlineCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DeadlineFilters } from "@/components/dashboard/DeadlineFilters";
import { useDeadlineStore } from "@/store/deadline-store";
import { applyFilters, getCategoryOptions, sortDeadlines, type SortMode } from "@/lib/dashboard/deadline-queries";
import { cn } from "@/lib/utils";
import { VirtualizedGrid } from "@/components/dashboard/VirtualizedGrid";

export function ListView({
  deadlines,
  sortMode,
  onSortChange,
}: {
  deadlines: Deadline[];
  sortMode: SortMode;
  onSortChange: (mode: SortMode) => void;
}) {
  const filters = useDeadlineStore((state) => state.filters);

  const categories = useMemo(() => getCategoryOptions(deadlines), [deadlines]);
  const filtered = useMemo(() => applyFilters(deadlines, filters), [deadlines, filters]);
  const sorted = useMemo(() => sortDeadlines(filtered, sortMode), [filtered, sortMode]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <DeadlineFilters categories={categories} />
        <div className="flex items-center gap-2">
          <Button
            variant={sortMode === "urgency" ? "secondary" : "outline"}
            size="sm"
            onClick={() => onSortChange("urgency")}
          >
            Sort by urgency
          </Button>
          <Button
            variant={sortMode === "dueDate" ? "secondary" : "outline"}
            size="sm"
            onClick={() => onSortChange("dueDate")}
          >
            Sort by due date
          </Button>
        </div>
      </div>

      {sorted.length > 200 ? (
        <VirtualizedGrid
          items={sorted}
          columns={2}
          rowHeight={260}
          renderRow={(row, rowIndex) => (
            <div key={`row-${rowIndex}`} className="grid gap-4 md:grid-cols-2">
              {row.map((deadline) => (
                <div
                  key={deadline.id}
                  className={cn(
                    "relative",
                    deadline.priority === "CRITICAL" && "ring-1 ring-red-500/40",
                    deadline.status === "OVERDUE" && "shadow-[0_0_20px_rgba(239,68,68,0.25)]"
                  )}
                >
                  {(deadline.priority === "CRITICAL" || deadline.status === "OVERDUE") && (
                    <div className="absolute -top-3 right-4">
                      <Badge variant={deadline.status === "OVERDUE" ? "overdue" : "critical"}>
                        {deadline.status === "OVERDUE" ? "OVERDUE" : "CRITICAL"}
                      </Badge>
                    </div>
                  )}
                  <DeadlineCard deadline={deadline} />
                </div>
              ))}
            </div>
          )}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {sorted.map((deadline) => (
            <div
              key={deadline.id}
              className={cn(
                "relative",
                deadline.priority === "CRITICAL" && "ring-1 ring-red-500/40",
                deadline.status === "OVERDUE" && "shadow-[0_0_20px_rgba(239,68,68,0.25)]"
              )}
            >
              {(deadline.priority === "CRITICAL" || deadline.status === "OVERDUE") && (
                <div className="absolute -top-3 right-4">
                  <Badge variant={deadline.status === "OVERDUE" ? "overdue" : "critical"}>
                    {deadline.status === "OVERDUE" ? "OVERDUE" : "CRITICAL"}
                  </Badge>
                </div>
              )}
              <DeadlineCard deadline={deadline} />
            </div>
          ))}
        </div>
      )}

      {sorted.length === 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-sm text-slate-300">
          No deadlines match these filters.
        </div>
      )}
    </div>
  );
}
