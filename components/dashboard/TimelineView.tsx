"use client";

import { motion } from "framer-motion";
import type { Deadline } from "@prisma/client";
import { DeadlineCard } from "@/components/deadline/DeadlineCard";
import { groupDeadlinesByDay } from "@/lib/dashboard/deadline-queries";

export function TimelineView({ deadlines }: { deadlines: Deadline[] }) {
  const groups = groupDeadlinesByDay(deadlines);

  return (
    <div className="space-y-4">
      <div className="text-sm text-slate-300">Today → Future</div>
      <div className="overflow-x-auto pb-4">
        <div className="flex min-w-[720px] gap-6">
          {groups.map((group) => (
            <div key={group.key} className="min-w-[260px] flex-1">
              <div className="mb-3 text-sm font-semibold text-slate-200">{group.label}</div>
              <div className="space-y-4">
                {group.items.map((deadline, index) => (
                  <motion.div
                    key={deadline.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                  >
                    <DeadlineCard deadline={deadline} />
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
