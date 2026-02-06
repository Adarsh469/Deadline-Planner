"use client";

import type { Deadline } from "@prisma/client";
import { motion } from "framer-motion";
import { DeadlineCard } from "@/components/deadline/DeadlineCard";
import { getOverdueDeadlines } from "@/lib/dashboard/deadline-queries";

export function OverdueView({ deadlines }: { deadlines: Deadline[] }) {
  const overdue = getOverdueDeadlines(deadlines);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-100">
        Overdue items are sorted by how late they are. Immediate attention recommended.
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {overdue.map(({ deadline, daysLate }, index) => (
          <motion.div
            key={deadline.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: index * 0.04 }}
            className="relative"
          >
            <div className="absolute -top-3 right-4 rounded-full bg-red-500 px-3 py-1 text-xs font-semibold text-white shadow">
              {daysLate}d late
            </div>
            <div className="animate-pulse">
              <DeadlineCard deadline={deadline} />
            </div>
          </motion.div>
        ))}
      </div>

      {overdue.length === 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-sm text-slate-300">
          No overdue deadlines.
        </div>
      )}
    </div>
  );
}
