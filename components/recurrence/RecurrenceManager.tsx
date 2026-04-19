"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PauseCircle } from "lucide-react";
import { useDeadlineStore } from "@/store/deadline-store";

type Recurrence = {
    id: string;
    title: string;
    unit: string;
    daysOfWeek: string | null;
    datesOfMonth: string | null;
    startDate: string;
    endDate: string | null;
    pausedUntil: string | null;
};

const DAY_NAMES: Record<string, string> = {
    "0": "Sun", "1": "Mon", "2": "Tue", "3": "Wed",
    "4": "Thu", "5": "Fri", "6": "Sat",
};

function scheduleLabel(r: Recurrence): string {
    if (r.unit === "WEEKLY" && r.daysOfWeek) {
        const days = r.daysOfWeek.split(",").map((d) => DAY_NAMES[d] ?? d).join(", ");
        return `Weekly on ${days}`;
    }
    if (r.unit === "MONTHLY" && r.datesOfMonth) {
        return `Monthly on the ${r.datesOfMonth}`;
    }
    return r.unit.charAt(0) + r.unit.slice(1).toLowerCase();
}

function isPaused(r: Recurrence): boolean {
    if (!r.pausedUntil) return false;
    return new Date(r.pausedUntil) > new Date();
}

export function RecurrenceManager() {
    const [recurrences, setRecurrences] = useState<Recurrence[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [pauseTarget, setPauseTarget] = useState<string | null>(null);
    const [pauseDate, setPauseDate] = useState("");

    const setDeadlines = useDeadlineStore((state) => state.setDeadlines);
    const bumpRecurrenceVersion = useDeadlineStore((state) => state.bumpRecurrenceVersion);
    const recurrenceVersion = useDeadlineStore((state) => state.recurrenceVersion);

    async function doRefreshDeadlineStore() {
        const res = await fetch("/api/deadlines?sort=urgency&includeRecurring=true", { cache: "no-store" });
        if (res.ok) {
            const json = await res.json();
            setDeadlines(json.data ?? []);
        }
    }

    async function load() {
        setLoading(true);
        const res = await fetch("/api/recurrences");
        if (res.ok) {
            const json = await res.json();
            setRecurrences(json.data ?? []);
        }
        setLoading(false);
    }

    useEffect(() => { load(); }, [recurrenceVersion]);

    async function handleDelete(id: string) {
        if (!confirm("Permanently delete this recurrence? All future pending deadlines will also be removed.")) return;
        setActionLoading(id);
        await fetch(`/api/recurrences/${id}`, { method: "DELETE" });
        setRecurrences((prev) => prev.filter((r) => r.id !== id));
        await doRefreshDeadlineStore();
        bumpRecurrenceVersion();
        setActionLoading(null);
    }

    async function handlePause(id: string) {
        if (!pauseDate) return;
        setActionLoading(id);
        await fetch(`/api/recurrences/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ pausedUntil: new Date(pauseDate).toISOString() }),
        });
        setPauseTarget(null);
        setPauseDate("");
        // Refresh deadlines first (removes paused instances from store → timeline/calendar update)
        await doRefreshDeadlineStore();
        // Then reload recurrence list and signal version bump
        await load();
        bumpRecurrenceVersion();
        setActionLoading(null);
    }

    async function handleResume(id: string) {
        setActionLoading(id);
        await fetch(`/api/recurrences/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ pausedUntil: null }),
        });
        // Refresh deadlines (adds regenerated instances back → timeline/calendar update)
        await doRefreshDeadlineStore();
        // Reload recurrence list and signal version bump
        await load();
        bumpRecurrenceVersion();
        setActionLoading(null);
    }

    if (loading) {
        return <div className="text-xs text-slate-500 py-2">Loading recurrences…</div>;
    }

    if (recurrences.length === 0) {
        return (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-slate-500">
                No recurring deadlines yet. Create one above.
            </div>
        );
    }

    return (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-slate-100">Existing Recurrences</h3>
            <div className="space-y-2">
                {recurrences.map((r) => {
                    const paused = isPaused(r);
                    const busy = actionLoading === r.id;
                    return (
                        <motion.div
                            key={r.id}
                            layout
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`rounded-xl border px-4 py-3 flex flex-col gap-2 ${paused ? "border-yellow-500/30 bg-yellow-500/5" : "border-white/10 bg-white/5"
                                }`}
                        >
                            {/* Title + schedule + pause badge */}
                            <div className="flex items-start justify-between gap-2">
                                <div>
                                    <p className="text-sm font-medium text-slate-100">{r.title}</p>
                                    <p className="text-xs text-slate-400">{scheduleLabel(r)}</p>
                                    {paused && r.pausedUntil && (
                                        <span className="inline-flex items-center gap-1 mt-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 px-2 py-0.5 text-[11px] text-yellow-400 font-medium">
                                            <PauseCircle size={10} strokeWidth={2} />
                                            Paused until {new Date(r.pausedUntil).toLocaleDateString()}
                                        </span>
                                    )}
                                </div>

                                {/* Action buttons */}
                                <div className="flex items-center gap-2 shrink-0">
                                    {paused ? (
                                        <button
                                            onClick={() => handleResume(r.id)}
                                            disabled={busy}
                                            className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300 hover:bg-emerald-500/20 disabled:opacity-40 transition"
                                        >
                                            {busy ? "…" : "Cancel Pause"}
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => setPauseTarget(pauseTarget === r.id ? null : r.id)}
                                            disabled={busy}
                                            className="rounded-lg border border-yellow-500/40 bg-yellow-500/10 px-3 py-1 text-xs text-yellow-300 hover:bg-yellow-500/20 disabled:opacity-40 transition"
                                        >
                                            Pause
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleDelete(r.id)}
                                        disabled={busy}
                                        className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-1 text-xs text-red-300 hover:bg-red-500/20 disabled:opacity-40 transition"
                                    >
                                        {busy ? "…" : "Delete"}
                                    </button>
                                </div>
                            </div>

                            {/* Pause date picker — only shown for active (non-paused) recurrences */}
                            <AnimatePresence>
                                {pauseTarget === r.id && !paused && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="flex items-center gap-2 pt-1">
                                            <p className="text-xs text-slate-400 whitespace-nowrap">Pause until:</p>
                                            <input
                                                type="date"
                                                min={new Date().toISOString().split("T")[0]}
                                                value={pauseDate}
                                                onChange={(e) => setPauseDate(e.target.value)}
                                                className="h-8 flex-1 rounded-lg border border-white/10 bg-slate-950/60 px-2 text-xs text-slate-100"
                                            />
                                            <button
                                                onClick={() => handlePause(r.id)}
                                                disabled={!pauseDate || busy}
                                                className="rounded-lg border border-yellow-500/40 bg-yellow-500/20 px-3 py-1 text-xs text-yellow-300 disabled:opacity-40 hover:bg-yellow-500/30 transition"
                                            >
                                                {busy ? "…" : "Confirm"}
                                            </button>
                                            <button
                                                onClick={() => { setPauseTarget(null); setPauseDate(""); }}
                                                className="text-xs text-slate-500 hover:text-slate-300 transition"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
