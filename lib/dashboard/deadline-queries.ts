import type { Deadline, DeadlinePriority, DeadlineStatus } from "@prisma/client";
import { daysBetween, formatFullDate, startOfDay } from "@/lib/dashboard/date";

export type SortMode = "urgency" | "dueDate";

export type Filters = {
  status?: DeadlineStatus;
  priority?: DeadlinePriority;
  category?: string;
};

export function applyFilters(deadlines: Deadline[], filters: Filters) {
  return deadlines.filter((deadline) => {
    if (filters.status && deadline.status !== filters.status) return false;
    if (filters.priority && deadline.priority !== filters.priority) return false;
    if (filters.category && deadline.category !== filters.category) return false;
    return true;
  });
}

export function sortDeadlines(deadlines: Deadline[], mode: SortMode) {
  if (mode === "dueDate") {
    return [...deadlines].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }
  return [...deadlines].sort((a, b) => b.urgencyScore - a.urgencyScore);
}

export function groupDeadlinesByDay(deadlines: Deadline[]) {
  const groups = new Map<string, Deadline[]>();
  deadlines.forEach((deadline) => {
    const dayKey = startOfDay(new Date(deadline.dueDate)).toISOString();
    const list = groups.get(dayKey) ?? [];
    list.push(deadline);
    groups.set(dayKey, list);
  });
  return Array.from(groups.entries())
    .map(([key, items]) => ({
      key,
      label: formatFullDate(new Date(key)),
      date: new Date(key),
      items: items.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()),
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

export function getOverdueDeadlines(deadlines: Deadline[]) {
  const now = new Date();
  return deadlines
    .filter((deadline) => deadline.status === "OVERDUE" || new Date(deadline.dueDate) < now)
    .map((deadline) => ({
      deadline,
      daysLate: daysBetween(now, new Date(deadline.dueDate)),
    }))
    .sort((a, b) => b.daysLate - a.daysLate);
}

export function getCategoryOptions(deadlines: Deadline[]) {
  const set = new Set<string>();
  deadlines.forEach((deadline) => {
    if (deadline.category) set.add(deadline.category);
  });
  return Array.from(set).sort();
}
