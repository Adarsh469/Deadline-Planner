import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jsonResponse } from "@/lib/http";
import { logError } from "@/lib/logger";

/** Returns the Monday of the week containing `date`. */
function weekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun
  const diff = (day === 0 ? -6 : 1) - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if (!userId) return jsonResponse({ error: "Unauthorized" }, { status: 401 });

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    // Fetch non-recurring completed deadlines in the last 90 days using Prisma (no raw SQL)
    const completed = await prisma.deadline.findMany({
      where: {
        userId,
        status: "COMPLETED",
        recurrenceId: null,
        completedAt: { gte: ninetyDaysAgo, not: null },
      },
      select: { completedAt: true },
      orderBy: { completedAt: "asc" },
    });

    // Bucket into ISO weeks in JavaScript
    const buckets: Record<string, number> = {};
    for (const d of completed) {
      if (!d.completedAt) continue;
      const key = weekStart(d.completedAt);
      buckets[key] = (buckets[key] ?? 0) + 1;
    }

    const rows = Object.entries(buckets)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([week_start, completed]) => ({ week_start, completed }));

    return jsonResponse({ data: rows }, { cacheControl: "no-store" });
  } catch (error) {
    logError("analytics.timeseries.failed", { error: String(error) });
    return jsonResponse({ error: "Internal server error" }, { status: 500 });
  }
}
