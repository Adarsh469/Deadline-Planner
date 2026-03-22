"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { DeadlinePriority, RecurrenceUnit } from "@prisma/client";
import { useDeadlineStore } from "@/store/deadline-store";

// ── Types ────────────────────────────────────────────────────────────
type Step = "freq" | "detail" | "time" | "meta";
type Freq = "DAILY" | "WEEKLY" | "MONTHLY";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_VALUES = ["1", "2", "3", "4", "5", "6", "0"]; // JS getDay() style (0=Sun)

const inputCls =
  "h-10 w-full rounded-lg border border-white/10 bg-slate-950/60 px-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500";
const labelCls = "block text-xs font-medium text-slate-400 mb-1";

// ── Main Component ───────────────────────────────────────────────────
export function RecurrenceForm() {
  const [step, setStep] = useState<Step>("freq");
  const [freq, setFreq] = useState<Freq>("WEEKLY");

  // Weekly
  const [weekDays, setWeekDays] = useState<string[]>([]);
  // Monthly
  const [monthDates, setMonthDates] = useState<string>(""); // e.g. "1,15"
  // Time
  const [time, setTime] = useState("09:00");
  // Start/end
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  // Meta
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<DeadlinePriority>("MEDIUM");

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleDay(val: string) {
    setWeekDays((prev) =>
      prev.includes(val) ? prev.filter((d) => d !== val) : [...prev, val]
    );
  }

  function buildStartDate(): string {
    // Combine startDate (date part) + time into a datetime-local string
    if (!startDate) return "";
    return `${startDate}T${time}`;
  }

  function buildInterval(): number {
    // For weekly: number of selected days per week → interval = 1 (every week, on those days)
    // For monthly: we just use interval = 1 (every month on those dates)
    // For daily: interval = 1
    return 1;
  }

  const setDeadlines = useDeadlineStore((state) => state.setDeadlines);
  const bumpRecurrenceVersion = useDeadlineStore((state) => state.bumpRecurrenceVersion);

  async function submit() {
    if (!title || !startDate) return;
    setLoading(true);
    setError(null);

    const payload = {
      title,
      priority,
      unit: freq as RecurrenceUnit,
      interval: buildInterval(),
      startDate: buildStartDate(),
      endDate: endDate ? `${endDate}T${time}` : null,
      // Schedule details
      daysOfWeek: freq === "WEEKLY" && weekDays.length > 0 ? weekDays.join(",") : null,
      datesOfMonth: freq === "MONTHLY" && monthDates.trim() ? monthDates.trim() : null,
    };

    // 1. Save the recurrence config
    const res = await fetch("/api/recurrences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      setError("Failed to create recurrence. Please try again.");
      setLoading(false);
      return;
    }

    // 2. Immediately generate deadlines from the new recurrence
    await fetch("/api/recurrences/generate-now", { method: "POST" });

    // 3. Refresh the deadline store so new items appear instantly
    const dlRes = await fetch("/api/deadlines?sort=urgency&includeRecurring=true", { cache: "no-store" });
    if (dlRes.ok) {
      const json = await dlRes.json();
      setDeadlines(json.data ?? []);
    }

    setLoading(false);
    setSuccess(true);
    bumpRecurrenceVersion(); // signal RecurrenceManager to reload
    // Reset
    setTimeout(() => {
      setSuccess(false);
      setStep("freq");
      setTitle("");
      setStartDate("");
      setEndDate("");
      setWeekDays([]);
      setMonthDates("");
      setTime("09:00");
      setPriority("MEDIUM");
    }, 2000);
  }

  const canProceedFreq = true;
  const canProceedDetail =
    freq === "DAILY" ||
    (freq === "WEEKLY" && weekDays.length > 0) ||
    (freq === "MONTHLY" && monthDates.trim().length > 0);
  const canProceedTime = time.length > 0;
  const canSubmit = title.trim().length > 0 && startDate.length > 0;

  const stepLabel: Record<Step, string> = {
    freq: "1. Frequency",
    detail: freq === "DAILY" ? "2. Schedule" : "2. Details",
    time: "3. Time",
    meta: "4. Name & Priority",
  };
  const steps: Step[] = ["freq", "detail", "time", "meta"];
  const stepIndex = steps.indexOf(step);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      {/* Header */}
      <div className="mb-5">
        <h3 className="text-sm font-semibold text-slate-100">Create Recurring Deadline</h3>
        <p className="text-xs text-slate-400">Generates deadlines automatically on your schedule.</p>
      </div>

      {/* Step progress */}
      <div className="mb-6 flex gap-2">
        {steps.map((s, i) => (
          <div key={s} className="flex-1">
            <div
              className={`h-1 rounded-full transition-colors duration-300 ${i <= stepIndex ? "bg-sky-500" : "bg-white/10"
                }`}
            />
            <p className={`mt-1 text-[10px] ${i === stepIndex ? "text-sky-400" : "text-slate-500"}`}>
              {stepLabel[s]}
            </p>
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ── Step 1: Frequency ──────────────────────────────────── */}
        {step === "freq" && (
          <motion.div key="freq" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <p className="mb-3 text-sm text-slate-300">How often should this repeat?</p>
            <div className="grid grid-cols-3 gap-3">
              {(["DAILY", "WEEKLY", "MONTHLY"] as Freq[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFreq(f)}
                  className={`rounded-xl border py-4 text-sm font-semibold transition ${freq === f
                    ? "border-sky-500 bg-sky-500/20 text-sky-300"
                    : "border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:text-slate-200"
                    }`}
                >
                  {f === "DAILY" ? "📅 Daily" : f === "WEEKLY" ? "📆 Weekly" : "🗓 Monthly"}
                </button>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <Button onClick={() => setStep("detail")} disabled={!canProceedFreq}>
                Next →
              </Button>
            </div>
          </motion.div>
        )}

        {/* ── Step 2: Details based on frequency ────────────────── */}
        {step === "detail" && (
          <motion.div key="detail" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            {freq === "DAILY" && (
              <p className="text-sm text-slate-300">
                This will generate a deadline every day. Configure the time in the next step.
              </p>
            )}

            {freq === "WEEKLY" && (
              <>
                <p className="mb-3 text-sm text-slate-300">Which days of the week?</p>
                <div className="flex flex-wrap gap-2">
                  {DAYS.map((day, i) => {
                    const val = DAY_VALUES[i];
                    const active = weekDays.includes(val);
                    return (
                      <button
                        key={day}
                        onClick={() => toggleDay(val)}
                        className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${active
                          ? "border-sky-500 bg-sky-500/20 text-sky-300"
                          : "border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:text-slate-200"
                          }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
                {weekDays.length === 0 && (
                  <p className="mt-2 text-xs text-amber-400">Select at least one day</p>
                )}
              </>
            )}

            {freq === "MONTHLY" && (
              <>
                <p className="mb-3 text-sm text-slate-300">On which date(s) of the month?</p>
                <label className={labelCls}>Date(s) — comma separated (e.g. 1, 15, 28)</label>
                <input
                  className={inputCls}
                  placeholder="e.g. 1, 15"
                  value={monthDates}
                  onChange={(e) => setMonthDates(e.target.value)}
                />
                <p className="mt-1 text-xs text-slate-500">Enter one or more day numbers between 1–28</p>
              </>
            )}

            <div className="mt-4 flex justify-between">
              <Button variant="outline" onClick={() => setStep("freq")}>← Back</Button>
              <Button onClick={() => setStep("time")} disabled={!canProceedDetail}>Next →</Button>
            </div>
          </motion.div>
        )}

        {/* ── Step 3: Time ──────────────────────────────────────── */}
        {step === "time" && (
          <motion.div key="time" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <p className="mb-3 text-sm text-slate-300">What time should the deadline be due?</p>
            <label className={labelCls}>Time</label>
            <input
              type="time"
              className={inputCls}
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Start date (first occurrence)</label>
                <input
                  type="date"
                  className={inputCls}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <label className={labelCls}>End date (optional)</label>
                <input
                  type="date"
                  className={inputCls}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="mt-4 flex justify-between">
              <Button variant="outline" onClick={() => setStep("detail")}>← Back</Button>
              <Button onClick={() => setStep("meta")} disabled={!canProceedTime || !startDate}>Next →</Button>
            </div>
          </motion.div>
        )}

        {/* ── Step 4: Name & Priority ───────────────────────────── */}
        {step === "meta" && (
          <motion.div key="meta" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <p className="mb-3 text-sm text-slate-300">Give this recurrence a name and priority.</p>

            <div className="space-y-3">
              <div>
                <label className={labelCls}>Title</label>
                <input
                  className={inputCls}
                  placeholder="e.g. Weekly report"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div>
                <label className={labelCls}>Priority</label>
                <div className="grid grid-cols-4 gap-2">
                  {(["LOW", "MEDIUM", "HIGH", "CRITICAL"] as DeadlinePriority[]).map((p) => {
                    const colours: Record<string, string> = {
                      LOW: "border-emerald-500 bg-emerald-500/20 text-emerald-300",
                      MEDIUM: "border-yellow-500 bg-yellow-500/20 text-yellow-300",
                      HIGH: "border-orange-500 bg-orange-500/20 text-orange-300",
                      CRITICAL: "border-red-500 bg-red-500/20 text-red-300",
                    };
                    return (
                      <button
                        key={p}
                        onClick={() => setPriority(p)}
                        className={`rounded-lg border py-2 text-xs font-semibold transition ${priority === p
                          ? colours[p]
                          : "border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:text-slate-200"
                          }`}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="mt-4 rounded-lg border border-white/10 bg-white/5 p-3 text-xs text-slate-400 space-y-1">
              <p>
                <span className="text-slate-300 font-medium">Frequency: </span>
                {freq === "DAILY" ? "Every day" : freq === "WEEKLY" ? `Every week on ${weekDays.map((v) => DAYS[DAY_VALUES.indexOf(v)]).join(", ")}` : `Monthly on the ${monthDates}`}
              </p>
              <p><span className="text-slate-300 font-medium">Time: </span>{time}</p>
              <p><span className="text-slate-300 font-medium">From: </span>{startDate || "—"}{endDate ? ` → ${endDate}` : ""}</p>
            </div>

            {error && <p className="mt-2 text-xs text-red-400">{error}</p>}

            {success && (
              <p className="mt-2 text-xs text-emerald-400">✓ Recurrence created!</p>
            )}

            <div className="mt-4 flex justify-between">
              <Button variant="outline" onClick={() => setStep("time")}>← Back</Button>
              <Button onClick={submit} disabled={loading || !canSubmit}>
                {loading ? "Creating…" : "Create Recurrence"}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
