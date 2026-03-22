import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jsonResponse } from "@/lib/http";
import { logError } from "@/lib/logger";

/** Returns the streak of consecutive days (up to today) that had at least one completion. */
function calcStreak(completedDates: Date[]): number {
  if (completedDates.length === 0) return 0;
  const days = new Set(completedDates.map((d) => d.toISOString().slice(0, 10)));
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    if (days.has(d.toISOString().slice(0, 10))) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if (!userId) return jsonResponse({ error: "Unauthorized" }, { status: 401 });

    // Fetch all non-recurring deadlines
    const [allDeadlines, completedDeadlines, uniqueRecurrenceCount] = await Promise.all([
      prisma.deadline.findMany({
        where: { userId, recurrenceId: null },
        select: { status: true, dueDate: true, completedAt: true, priority: true, category: true },
      }),
      prisma.deadline.findMany({
        where: { userId, status: "COMPLETED", recurrenceId: null, completedAt: { not: null } },
        select: { dueDate: true, completedAt: true },
      }),
      // Count unique recurring schedules as 1 each (not each instance)
      prisma.recurrence.count({ where: { userId } }),
    ]);

    const totalCount = allDeadlines.length + uniqueRecurrenceCount;
    const completedCount = allDeadlines.filter((d) => d.status === "COMPLETED").length;
    const overdueCount = allDeadlines.filter((d) => d.status === "OVERDUE").length;

    // On-time: completedAt <= dueDate
    const onTime = completedDeadlines.filter(
      (d) => d.completedAt && d.completedAt <= d.dueDate
    ).length;
    const onTimePercent = completedDeadlines.length > 0 ? (onTime / completedDeadlines.length) * 100 : 0;

    // Avg days late (only for late completions)
    const lateOnes = completedDeadlines.filter((d) => d.completedAt && d.completedAt > d.dueDate);
    const avgDaysLate =
      lateOnes.length > 0
        ? lateOnes.reduce((sum, d) => {
          const diffMs = d.completedAt!.getTime() - d.dueDate.getTime();
          return sum + diffMs / (1000 * 60 * 60 * 24);
        }, 0) / lateOnes.length
        : 0;

    // Streak — include all completed deadlines (recurring + non-recurring)
    const allCompletedDates = await prisma.deadline.findMany({
      where: { userId, status: "COMPLETED", completedAt: { not: null } },
      select: { completedAt: true },
    });
    const streakDays = calcStreak(allCompletedDates.map((d) => d.completedAt!));

    // Priority distribution (non-recurring only)
    const priorityMap: Record<string, number> = {};
    for (const d of allDeadlines) {
      priorityMap[d.priority] = (priorityMap[d.priority] ?? 0) + 1;
    }
    const priorityDistribution = Object.entries(priorityMap).map(([priority, count]) => ({
      priority,
      count,
    }));

    // Category breakdown (non-recurring only)
    const categoryMap: Record<string, number> = {};
    for (const d of allDeadlines) {
      const cat = d.category ?? "Uncategorized";
      categoryMap[cat] = (categoryMap[cat] ?? 0) + 1;
    }
    const categoryBreakdown = Object.entries(categoryMap).map(([category, count]) => ({
      category,
      count,
    }));

    return jsonResponse(
      {
        data: {
          totalCount,
          completedCount,
          overdueCount,
          onTimePercent,
          avgDaysLate,
          streakDays,
          priorityDistribution,
          categoryBreakdown,
        },
      },
      { cacheControl: "no-store" }
    );
  } catch (error) {
    logError("analytics.overview.failed", { error: String(error) });
    return jsonResponse({ error: "Internal server error" }, { status: 500 });
  }
}
