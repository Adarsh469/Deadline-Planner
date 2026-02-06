"use client";

import { useEffect } from "react";
import { logError } from "@/lib/logger";
import { Button } from "@/components/ui/button";

export default function DashboardError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    logError("dashboard.render.failed", { message: error.message });
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">
      <div className="max-w-md rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
        <h2 className="text-lg font-semibold">Dashboard crashed</h2>
        <p className="mt-2 text-sm text-slate-300">We hit an unexpected error. Try again.</p>
        <Button className="mt-4" onClick={reset}>
          Retry
        </Button>
      </div>
    </div>
  );
}
