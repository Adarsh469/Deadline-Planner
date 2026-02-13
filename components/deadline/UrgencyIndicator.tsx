"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { calculateUrgencyScore } from "@/lib/urgency";
import type { DeadlinePriority } from "@prisma/client";

const severity = (score: number) => {
  if (score >= 0.04) return "critical";
  if (score >= 0.02) return "high";
  if (score >= 0.01) return "medium";
  return "low";
};

const labelMap: Record<ReturnType<typeof severity>, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
};

export function UrgencyIndicator({
  score,
  priority,
  dueDate,
}: {
  score: number;
  priority?: DeadlinePriority;
  dueDate?: Date | string;
}) {
  const baseScore = Number.isFinite(score) ? score : 0;
  const fallbackScore =
    priority && dueDate ? calculateUrgencyScore(priority, new Date(dueDate)) : baseScore;
  const effectiveScore = baseScore > 0 ? baseScore : fallbackScore;
  const level = severity(effectiveScore);
  const label = labelMap[level];

  return (
    <motion.div
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold",
        level === "critical" && "bg-red-500/20 text-red-300",
        level === "high" && "bg-orange-500/20 text-orange-300",
        level === "medium" && "bg-yellow-500/20 text-yellow-300",
        level === "low" && "bg-emerald-500/20 text-emerald-300"
      )}
      animate={{
        scale: level === "critical" ? [1, 1.05, 1] : 1,
        boxShadow: level === "critical" ? ["0 0 0px rgba(239,68,68,0)", "0 0 16px rgba(239,68,68,0.55)", "0 0 0px rgba(239,68,68,0)"] : "none",
      }}
      transition={{ duration: 1.6, repeat: level === "critical" ? Infinity : 0 }}
    >
      <span className="h-2 w-2 rounded-full bg-current" />
      {label}
    </motion.div>
  );
}
