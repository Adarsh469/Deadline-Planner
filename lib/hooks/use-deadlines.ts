"use client";

import { useEffect } from "react";
import { useDeadlineStore } from "@/store/deadline-store";

export function useDeadlines() {
  const setDeadlines = useDeadlineStore((state) => state.setDeadlines);

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/deadlines?sort=urgency", { signal: controller.signal, cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load deadlines");
        const json = await res.json();
        setDeadlines(json.data ?? []);
      })
      .catch(() => {
        setDeadlines([]);
      });

    return () => controller.abort();
  }, [setDeadlines]);
}
