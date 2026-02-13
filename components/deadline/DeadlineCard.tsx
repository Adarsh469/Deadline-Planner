"use client";

import { motion } from "framer-motion";
import { Deadline, DeadlineStatus } from "@prisma/client";
import { UrgencyIndicator } from "@/components/deadline/UrgencyIndicator";
import { cn } from "@/lib/utils";
import { memo, useTransition } from "react";
import { useDeadlineStore } from "@/store/deadline-store";

const statusStyles: Record<Deadline["status"], string> = {
  PENDING: "border-white/10",
  COMPLETED: "border-emerald-500/40 bg-emerald-500/10",
  OVERDUE: "border-red-500/50 bg-red-500/10",
  BLOCKED: "border-yellow-500/40 bg-yellow-500/10",
};

const statuses: DeadlineStatus[] = ["PENDING", "COMPLETED", "OVERDUE", "BLOCKED"];

function DeadlineCardComponent({ deadline }: { deadline: Deadline }) {
  const isOverdue = deadline.status === "OVERDUE";
  const upsertDeadline = useDeadlineStore((state) => state.upsertDeadline);
  const [isPending, startTransition] = useTransition();

  const updateStatus = (status: DeadlineStatus) => {
    if (status === deadline.status) return;
    startTransition(async () => {
      const res = await fetch(`/api/deadlines/${deadline.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) return;
      const json = await res.json();
      if (json?.data) upsertDeadline(json.data);
    });
  };

  return (
    <motion.div
      className={cn(
        "rounded-2xl border p-5 backdrop-blur",
        "bg-slate-900/60 text-white shadow-lg",
        statusStyles[deadline.status]
      )}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.35 }}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold tracking-tight">{deadline.title}</h3>
          <p className="mt-2 text-sm text-slate-300 line-clamp-2">{deadline.description ?? "No description"}</p>
        </div>
        <UrgencyIndicator score={deadline.urgencyScore} priority={deadline.priority} dueDate={deadline.dueDate} />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-300">
        <span className="rounded-full border border-white/10 px-2 py-1">{deadline.priority}</span>
        <select
          className="rounded-full border border-white/10 bg-transparent px-2 py-1 text-xs text-slate-200"
          value={deadline.status}
          onChange={(e) => updateStatus(e.target.value as DeadlineStatus)}
          disabled={isPending}
        >
          {statuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
        {deadline.category && <span className="rounded-full border border-white/10 px-2 py-1">{deadline.category}</span>}
      </div>

      <motion.div
        className={cn("mt-4 text-sm", isOverdue ? "text-red-300" : "text-slate-300")}
        animate={isOverdue ? { x: [0, -3, 3, -3, 0] } : { x: 0 }}
        transition={{ duration: 0.5, repeat: isOverdue ? Infinity : 0, repeatDelay: 2 }}
      >
        Due {new Date(deadline.dueDate).toLocaleString()}
      </motion.div>
    </motion.div>
  );
}

export const DeadlineCard = memo(DeadlineCardComponent);
