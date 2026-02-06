import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jsonResponse } from "@/lib/http";
import { logError } from "@/lib/logger";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if (!userId) return jsonResponse({ error: "Unauthorized" }, { status: 401 });

    const rows = await prisma.$queryRaw<Array<{ week_start: string; completed: number }>>`
      SELECT
        DATE_TRUNC('week', "completedAt")::date AS week_start,
        COUNT(*)::int AS completed
      FROM "Deadline"
      WHERE "userId" = ${userId} AND "status" = 'COMPLETED'
      GROUP BY week_start
      ORDER BY week_start ASC
    `;

    return jsonResponse({ data: rows }, { cacheControl: "private, max-age=120, stale-while-revalidate=240" });
  } catch (error) {
    logError("analytics.timeseries.failed", { error: String(error) });
    return jsonResponse({ error: "Internal server error" }, { status: 500 });
  }
}
