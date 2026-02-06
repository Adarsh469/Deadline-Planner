import { DeadlinePriority } from "@prisma/client";

const PRIORITY_WEIGHTS: Record<DeadlinePriority, number> = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 4,
  CRITICAL: 8,
};

export function calculateUrgencyScore(priority: DeadlinePriority, dueDate: Date): number {
  const now = Date.now();
  const diffMs = Math.max(dueDate.getTime() - now, 1);
  const hoursRemaining = diffMs / (1000 * 60 * 60);
  const weight = PRIORITY_WEIGHTS[priority];
  return Number((weight / hoursRemaining).toFixed(4));
}

export function deriveStatus(dueDate: Date, completedAt?: Date | null): "PENDING" | "OVERDUE" | "COMPLETED" {
  if (completedAt) return "COMPLETED";
  if (dueDate.getTime() < Date.now()) return "OVERDUE";
  return "PENDING";
}
