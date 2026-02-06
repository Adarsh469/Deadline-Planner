"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DeadlinePriority, RecurrenceUnit } from "@prisma/client";

export function RecurrenceForm() {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<DeadlinePriority>("MEDIUM");
  const [unit, setUnit] = useState<RecurrenceUnit>("WEEKLY");
  const [interval, setInterval] = useState(1);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!title || !startDate) return;
    setLoading(true);
    await fetch("/api/recurrences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        priority,
        unit,
        interval,
        startDate,
        endDate: endDate || null,
      }),
    });
    setLoading(false);
    setTitle("");
    setInterval(1);
    setStartDate("");
    setEndDate("");
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-slate-100">Create Recurrence</h3>
        <p className="text-xs text-slate-400">Generate future deadlines automatically.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <input
          className="h-9 rounded-md border border-white/10 bg-slate-950/60 px-3 text-sm text-slate-100"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <Select value={priority} onValueChange={(v) => setPriority(v as DeadlinePriority)}>
          <SelectTrigger>
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="LOW">Low</SelectItem>
            <SelectItem value="MEDIUM">Medium</SelectItem>
            <SelectItem value="HIGH">High</SelectItem>
            <SelectItem value="CRITICAL">Critical</SelectItem>
          </SelectContent>
        </Select>

        <Select value={unit} onValueChange={(v) => setUnit(v as RecurrenceUnit)}>
          <SelectTrigger>
            <SelectValue placeholder="Frequency" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="DAILY">Daily</SelectItem>
            <SelectItem value="WEEKLY">Weekly</SelectItem>
            <SelectItem value="MONTHLY">Monthly</SelectItem>
          </SelectContent>
        </Select>

        <input
          type="number"
          min={1}
          className="h-9 rounded-md border border-white/10 bg-slate-950/60 px-3 text-sm text-slate-100"
          value={interval}
          onChange={(e) => setInterval(Number(e.target.value))}
          placeholder="Interval"
        />

        <input
          type="datetime-local"
          className="h-9 rounded-md border border-white/10 bg-slate-950/60 px-3 text-sm text-slate-100"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />

        <input
          type="datetime-local"
          className="h-9 rounded-md border border-white/10 bg-slate-950/60 px-3 text-sm text-slate-100"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
      </div>

      <div className="mt-4">
        <Button onClick={submit} disabled={loading || !title || !startDate}>
          {loading ? "Creating..." : "Create Recurrence"}
        </Button>
      </div>
    </div>
  );
}
