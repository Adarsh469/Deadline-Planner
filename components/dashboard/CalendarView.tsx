"use client";

import { useMemo, useState } from "react";
import type { Deadline } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DeadlineCard } from "@/components/deadline/DeadlineCard";
import { cn } from "@/lib/utils";
import { formatShortDate, getMonthMatrix, isSameDay } from "@/lib/dashboard/date";

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function CalendarView({ deadlines }: { deadlines: Deadline[] }) {
  const [baseDate, setBaseDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => new Date());

  const matrix = useMemo(() => getMonthMatrix(baseDate), [baseDate]);

  const deadlinesByDay = useMemo(() => {
    const map = new Map<string, Deadline[]>();
    deadlines.forEach((deadline) => {
      const key = new Date(deadline.dueDate).toDateString();
      const list = map.get(key) ?? [];
      list.push(deadline);
      map.set(key, list);
    });
    return map;
  }, [deadlines]);

  const selectedKey = selectedDate.toDateString();
  const selectedDeadlines = deadlinesByDay.get(selectedKey) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">
            {baseDate.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
          </h2>
          <p className="text-sm text-slate-400">Click a day to focus its deadlines.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setBaseDate(new Date(baseDate.getFullYear(), baseDate.getMonth() - 1, 1))}>
            Prev
          </Button>
          <Button variant="outline" size="sm" onClick={() => setBaseDate(new Date())}>
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={() => setBaseDate(new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 1))}>
            Next
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="grid grid-cols-7 gap-2 text-xs text-slate-400">
          {dayNames.map((day) => (
            <div key={day} className="text-center">
              {day}
            </div>
          ))}
        </div>
        <div className="mt-2 grid grid-cols-7 gap-2">
          {matrix.flat().map((day) => {
            const isCurrentMonth = day.getMonth() === baseDate.getMonth();
            const isSelected = isSameDay(day, selectedDate);
            const dayKey = day.toDateString();
            const dayDeadlines = deadlinesByDay.get(dayKey) ?? [];
            return (
              <button
                key={dayKey}
                onClick={() => setSelectedDate(day)}
                className={cn(
                  "min-h-[70px] rounded-xl border border-transparent p-2 text-left transition",
                  isSelected && "border-slate-400/40 bg-white/10",
                  !isCurrentMonth && "opacity-40",
                  "hover:border-white/10"
                )}
              >
                <div className="text-xs text-slate-300">{day.getDate()}</div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {dayDeadlines.slice(0, 3).map((deadline) => (
                    <span
                      key={deadline.id}
                      className={cn(
                        "h-2 w-2 rounded-full",
                        deadline.priority === "CRITICAL" && "bg-red-400",
                        deadline.priority === "HIGH" && "bg-orange-400",
                        deadline.priority === "MEDIUM" && "bg-yellow-400",
                        deadline.priority === "LOW" && "bg-emerald-400"
                      )}
                    />
                  ))}
                  {dayDeadlines.length > 3 && <span className="text-[10px] text-slate-400">+{dayDeadlines.length - 3}</span>}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Badge variant="default">{formatShortDate(selectedDate)}</Badge>
          <span className="text-sm text-slate-300">{selectedDeadlines.length} deadlines</span>
        </div>
        {selectedDeadlines.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-slate-300">
            No deadlines for this day.
          </div>
        )}
        <div className="grid gap-4 md:grid-cols-2">
          {selectedDeadlines.map((deadline) => (
            <DeadlineCard key={deadline.id} deadline={deadline} />
          ))}
        </div>
      </div>
    </div>
  );
}
