"use client";

import { useState } from "react";
import { DeadlinePriority } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { useDeadlineStore } from "@/store/deadline-store";

const priorities: DeadlinePriority[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

export function DeadlineCreate() {
  const upsertDeadline = useDeadlineStore((state) => state.upsertDeadline);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<DeadlinePriority>("MEDIUM");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!title || !dueDate) return;
    setLoading(true);
    setError(null);
    const res = await fetch("/api/deadlines", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        dueDate: new Date(dueDate).toISOString(),
        priority,
      }),
    });

    if (!res.ok) {
      setError("Failed to create deadline.");
      setLoading(false);
      return;
    }

    const json = await res.json();
    if (json?.data) {
      upsertDeadline(json.data);
    }

    setTitle("");
    setDueDate("");
    setPriority("MEDIUM");
    setLoading(false);
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-slate-100">Create Deadline</h3>
        <p className="text-xs text-slate-400">Quickly add a deadline to test the flow.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <input
          className="h-9 rounded-md border border-white/10 bg-slate-950/60 px-3 text-sm text-slate-100"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          type="datetime-local"
          className="h-9 rounded-md border border-white/10 bg-slate-950/60 px-3 text-sm text-slate-100"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
        <select
          className="h-9 rounded-md border border-white/10 bg-slate-950/60 px-3 text-sm text-slate-100"
          value={priority}
          onChange={(e) => setPriority(e.target.value as DeadlinePriority)}
        >
          {priorities.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <Button onClick={submit} disabled={loading || !title || !dueDate}>
          {loading ? "Creating..." : "Create Deadline"}
        </Button>
        {error && <span className="text-xs text-red-300">{error}</span>}
      </div>
    </div>
  );
}
