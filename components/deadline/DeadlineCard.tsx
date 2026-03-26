"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Trash2, AlertTriangle, RefreshCw } from "lucide-react";
import { Deadline, DeadlinePriority, DeadlineStatus } from "@prisma/client";
import { UrgencyIndicator } from "@/components/deadline/UrgencyIndicator";
import { cn } from "@/lib/utils";
import { memo, useTransition, useState } from "react";
import { useDeadlineStore } from "@/store/deadline-store";

const statusStyles: Record<Deadline["status"], string> = {
  PENDING: "border-white/10",
  COMPLETED: "border-emerald-500/40 bg-emerald-500/10",
  OVERDUE: "border-red-500/50 bg-red-500/10",
  BLOCKED: "border-yellow-500/40 bg-yellow-500/10",
};

const statuses: DeadlineStatus[] = ["PENDING", "COMPLETED", "OVERDUE", "BLOCKED"];
const priorities: DeadlinePriority[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

const priorityColors: Record<DeadlinePriority, string> = {
  LOW: "text-emerald-400",
  MEDIUM: "text-sky-400",
  HIGH: "text-amber-400",
  CRITICAL: "text-red-400",
};

// ── Tiny reusable modal overlay ────────────────────────────────────────
function ModalOverlay({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        className="w-full max-w-sm rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl"
        initial={{ opacity: 0, scale: 0.94, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 12 }}
        transition={{ duration: 0.2 }}
      >
        {children}
      </motion.div>
    </div>
  );
}

function ConfirmButton({
  onClick,
  variant = "primary",
  disabled,
  children,
}: {
  onClick: () => void;
  variant?: "primary" | "ghost";
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex-1 rounded-xl px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50",
        variant === "primary"
          ? "bg-white/10 text-white hover:bg-white/15"
          : "text-slate-400 hover:text-slate-200"
      )}
    >
      {children}
    </button>
  );
}

function DeadlineCardComponent({ deadline }: { deadline: Deadline }) {
  const isOverdue = deadline.status === "OVERDUE";
  const upsertDeadline = useDeadlineStore((s) => s.upsertDeadline);
  const removeDeadline = useDeadlineStore((s) => s.removeDeadline);
  const setDeadlines = useDeadlineStore((s) => s.setDeadlines);
  const deadlines = useDeadlineStore((s) => s.deadlines);
  const [isPending, startTransition] = useTransition();

  // Two-stage priority confirm flow
  const [pendingPriority, setPendingPriority] = useState<DeadlinePriority | null>(null);
  const [showScopeModal, setShowScopeModal] = useState(false);

  // ── Status change ──────────────────────────────────────────────────
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

  // ── Delete ────────────────────────────────────────────────────────
  const deleteDeadline = () => {
    startTransition(async () => {
      const res = await fetch(`/api/deadlines/${deadline.id}`, { method: "DELETE" });
      if (!res.ok) return;
      removeDeadline(deadline.id);
    });
  };

  // ── Priority change — stage 1: select ────────────────────────────
  const onPrioritySelect = (p: DeadlinePriority) => {
    if (p === deadline.priority) return;
    setPendingPriority(p);
  };

  // ── Priority change — stage 2a: confirm, apply to just this one ──
  const applyPriorityToOne = () => {
    if (!pendingPriority) return;
    const p = pendingPriority;
    setPendingPriority(null);
    setShowScopeModal(false);
    startTransition(async () => {
      const res = await fetch(`/api/deadlines/${deadline.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priority: p }),
      });
      if (!res.ok) return;
      const json = await res.json();
      if (json?.data) upsertDeadline(json.data);
    });
  };

  // ── Priority change — stage 2b: confirm, apply to all recurring ──
  const applyPriorityToAll = () => {
    if (!pendingPriority || !deadline.recurrenceId) return;
    const p = pendingPriority;
    const rid = deadline.recurrenceId;
    setPendingPriority(null);
    setShowScopeModal(false);
    startTransition(async () => {
      const res = await fetch(`/api/deadlines/bulk-priority`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recurrenceId: rid, priority: p }),
      });
      if (!res.ok) return;
      // Patch store for all matching deadlines
      const updated = deadlines.map((d) =>
        d.recurrenceId === rid && d.id !== deadline.id
          ? { ...d, priority: p }
          : d.id === deadline.id
            ? { ...d, priority: p }
            : d
      );
      setDeadlines(updated as Deadline[]);
    });
  };

  // After first confirm → decide whether to show scope modal or just apply
  const onFirstConfirm = () => {
    if (deadline.recurrenceId) {
      setShowScopeModal(true);
    } else {
      applyPriorityToOne();
    }
  };

  return (
    <>
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
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold tracking-tight">{deadline.title}</h3>
            <p className="mt-2 text-sm text-slate-300 line-clamp-2">
              {deadline.description ?? "No description"}
            </p>
          </div>
          <div className="flex items-start gap-2 shrink-0">
            <UrgencyIndicator
              score={deadline.urgencyScore}
              priority={deadline.priority}
              dueDate={deadline.dueDate}
            />
            <button
              onClick={deleteDeadline}
              disabled={isPending}
              className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 text-slate-500 transition-colors hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400 disabled:opacity-40"
              title="Delete deadline"
            >
              <Trash2 size={13} strokeWidth={1.8} />
            </button>
          </div>
        </div>

        {/* Controls row */}
        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-300">
          {/* Priority dropdown */}
          <select
            className={cn(
              "rounded-full border border-white/10 bg-transparent px-2 py-1 text-xs font-medium transition-colors",
              priorityColors[deadline.priority]
            )}
            value={deadline.priority}
            onChange={(e) => onPrioritySelect(e.target.value as DeadlinePriority)}
            disabled={isPending}
          >
            {priorities.map((p) => (
              <option key={p} value={p} className="bg-slate-900 text-slate-200">
                {p}
              </option>
            ))}
          </select>

          {/* Status dropdown */}
          <select
            className="rounded-full border border-white/10 bg-transparent px-2 py-1 text-xs text-slate-200"
            value={deadline.status}
            onChange={(e) => updateStatus(e.target.value as DeadlineStatus)}
            disabled={isPending}
          >
            {statuses.map((s) => (
              <option key={s} value={s} className="bg-slate-900">
                {s}
              </option>
            ))}
          </select>

          {deadline.category && (
            <span className="rounded-full border border-white/10 px-2 py-1">
              {deadline.category}
            </span>
          )}
        </div>

        {/* Due date */}
        <motion.div
          className={cn("mt-4 text-sm", isOverdue ? "text-red-300" : "text-slate-300")}
          animate={isOverdue ? { x: [0, -3, 3, -3, 0] } : { x: 0 }}
          transition={{ duration: 0.5, repeat: isOverdue ? Infinity : 0, repeatDelay: 2 }}
        >
          Due {new Date(deadline.dueDate).toLocaleString()}
        </motion.div>
      </motion.div>

      {/* ── Stage 1: Confirm priority change ───────────────────────── */}
      <AnimatePresence>
        {pendingPriority && !showScopeModal && (
          <ModalOverlay>
            <div className="flex items-start gap-3 mb-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/10">
                <AlertTriangle size={16} className="text-amber-400" strokeWidth={1.8} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-100">Change priority?</p>
                <p className="mt-1 text-xs text-slate-400">
                  Changing from{" "}
                  <span className={cn("font-medium", priorityColors[deadline.priority])}>
                    {deadline.priority}
                  </span>{" "}
                  to{" "}
                  <span className={cn("font-medium", priorityColors[pendingPriority])}>
                    {pendingPriority}
                  </span>{" "}
                  for &ldquo;{deadline.title}&rdquo;
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <ConfirmButton variant="ghost" onClick={() => setPendingPriority(null)}>
                Cancel
              </ConfirmButton>
              <ConfirmButton onClick={onFirstConfirm} disabled={isPending}>
                Confirm
              </ConfirmButton>
            </div>
          </ModalOverlay>
        )}

        {/* ── Stage 2: Recurring scope picker ──────────────────────── */}
        {showScopeModal && pendingPriority && (
          <ModalOverlay>
            <div className="flex items-start gap-3 mb-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-500/10">
                <RefreshCw size={15} className="text-sky-400" strokeWidth={1.8} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-100">Recurring deadline</p>
                <p className="mt-1 text-xs text-slate-400">
                  This is part of a recurring series. Apply{" "}
                  <span className={cn("font-medium", priorityColors[pendingPriority])}>
                    {pendingPriority}
                  </span>{" "}
                  to…
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={applyPriorityToOne}
                disabled={isPending}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm text-slate-200 hover:bg-white/10 transition-colors disabled:opacity-50"
              >
                <span className="font-medium">Just this one</span>
                <p className="text-xs text-slate-500 mt-0.5">Only this instance is updated</p>
              </button>
              <button
                onClick={applyPriorityToAll}
                disabled={isPending}
                className="w-full rounded-xl border border-sky-500/20 bg-sky-500/8 px-4 py-3 text-left text-sm text-sky-300 hover:bg-sky-500/12 transition-colors disabled:opacity-50"
              >
                <span className="font-medium">All future instances</span>
                <p className="text-xs text-sky-500/70 mt-0.5">Updates all pending recurring deadlines in this series</p>
              </button>
              <button
                onClick={() => { setShowScopeModal(false); setPendingPriority(null); }}
                className="text-xs text-slate-500 hover:text-slate-400 pt-1 text-center transition-colors"
              >
                Cancel
              </button>
            </div>
          </ModalOverlay>
        )}
      </AnimatePresence>
    </>
  );
}

export const DeadlineCard = memo(DeadlineCardComponent);
