"use client";

import { useEffect } from "react";
import { useDeadlineStore } from "@/store/deadline-store";
import type { Deadline } from "@prisma/client";

export function useDeadlines() {
  const setDeadlines = useDeadlineStore((state) => state.setDeadlines);

  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      try {
        // 1. Trigger deadline generation so expired pauses auto-resume and new occurrences appear
        await fetch("/api/recurrences/generate-now", { method: "POST", signal: controller.signal });
        // 2. Fetch the up-to-date deadlines and populate the store
        const res = await fetch("/api/deadlines?sort=urgency&includeRecurring=true", {
          signal: controller.signal,
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Failed to load deadlines");
        const json = await res.json();
        setDeadlines((json.data ?? []) as Deadline[]);
      } catch {
        // AbortError or fetch failure — don't wipe existing state
      }
    })();

    return () => controller.abort();
  }, [setDeadlines]);
}
