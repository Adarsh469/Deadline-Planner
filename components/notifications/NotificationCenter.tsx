"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type Notification = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  seenAt: string | null;
};

export function NotificationCenter() {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);

    fetch("/api/notifications")
      .then((res) => res.json())
      .then((data) => {
        if (!active) return;
        setItems(data.data ?? []);
      })
      .catch(() => {
        if (!active) return;
        setItems([]);
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const unread = items.filter((item) => !item.seenAt);

  const markAllRead = async () => {
    if (unread.length === 0) return;
    const now = new Date().toISOString();
    setItems((prev) => prev.map((item) => ({ ...item, seenAt: item.seenAt ?? now })));
    const res = await fetch("/api/notifications/ack", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: unread.map((item) => item.id) }),
    });
    if (!res.ok) {
      // revert on failure
      setItems((prev) =>
        prev.map((item) => (unread.some((u) => u.id === item.id) ? { ...item, seenAt: null } : item))
      );
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-slate-100">Notifications</h3>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-xs",
              unread.length > 0 ? "bg-red-500/20 text-red-200" : "bg-white/10 text-slate-300"
            )}
          >
            {unread.length} unread
          </span>
        </div>
        <Button variant="outline" size="sm" onClick={markAllRead} disabled={unread.length === 0}>
          Mark all read
        </Button>
      </div>

      <div className="mt-4 space-y-3">
        {loading && <div className="h-16 rounded-xl bg-white/10 animate-pulse" />}
        {!loading && items.length === 0 && (
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
            No notifications yet.
          </div>
        )}
        {items.map((item) => (
          <div
            key={item.id}
            className={cn(
              "rounded-xl border border-white/10 p-3 text-sm text-slate-200",
              !item.seenAt && "bg-white/10"
            )}
          >
            <div className="flex items-center justify-between">
              <div className="font-semibold">{item.title}</div>
              <div className="text-xs text-slate-400">
                {new Date(item.createdAt).toLocaleString()}
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-300">{item.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
