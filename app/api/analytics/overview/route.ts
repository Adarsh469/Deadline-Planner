import { getAuthUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jsonResponse } from "@/lib/http";
import { logError } from "@/lib/logger";

export async function GET() {
  try {
    const userId = await getAuthUserId();
    if (!userId) return jsonResponse({ error: "Unauthorized" }, { status: 401 });

    const [totalCount, completedCount, overdueCount, priorityDistribution, completionStats] = await Promise.all([
      prisma.deadline.count({ where: { userId } }),
      prisma.deadline.count({ where: { userId, status: "COMPLETED" } }),
      prisma.deadline.count({ where: { userId, status: "OVERDUE" } }),
      prisma.deadline.groupBy({
        by: ["priority"],
        where: { userId },
        _count: { _all: true },
      }),
      prisma.$queryRaw<
        Array<{
          on_time: number;
          total_completed: number;
          avg_delay_seconds: number | null;
        }>
      >`
        SELECT
          COUNT(*) FILTER (WHERE "completedAt" <= "dueDate")::int AS on_time,
          COUNT(*)::int AS total_completed,
          AVG(EXTRACT(EPOCH FROM ("completedAt" - "dueDate"))) AS avg_delay_seconds
        FROM "Deadline"
        WHERE "userId" = ${userId} AND "status" = 'COMPLETED'
      `,
    ]);

    const stats = completionStats[0] ?? { on_time: 0, total_completed: 0, avg_delay_seconds: null };
    const onTimePercent = stats.total_completed > 0 ? (stats.on_time / stats.total_completed) * 100 : 0;
    const avgDelayHours = stats.avg_delay_seconds ? stats.avg_delay_seconds / 3600 : 0;

    const distribution = priorityDistribution.map((item) => ({
      priority: item.priority,
      count: item._count._all,
    }));

    return jsonResponse(
      {
        data: {
          totalCount,
          completedCount,
          overdueCount,
          onTimePercent,
          avgDelayHours,
          priorityDistribution: distribution,
        },
      },
      { cacheControl: "private, max-age=60, stale-while-revalidate=120" }
    );
  } catch (error) {
    logError("analytics.overview.failed", { error: String(error) });
    return jsonResponse({ error: "Internal server error" }, { status: 500 });
  }
}
