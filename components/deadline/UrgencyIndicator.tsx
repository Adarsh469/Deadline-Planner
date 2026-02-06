"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const severity = (score: number) => {
  if (score >= 1) return "critical";
  if (score >= 0.4) return "high";
  if (score >= 0.1) return "medium";
  return "low";
};

export function UrgencyIndicator({ score }: { score: number }) {
  const level = severity(score);

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
      Urgency {score.toFixed(2)}
    </motion.div>
  );
}
