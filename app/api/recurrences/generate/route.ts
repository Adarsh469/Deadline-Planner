import { prisma } from "@/lib/prisma";
import { generateRecurrenceDeadlines } from "@/lib/recurrence-engine";
import { jsonResponse } from "@/lib/http";
import { logError } from "@/lib/logger";

export async function POST(req: Request) {
  try {
    const secret = req.headers.get("x-cron-secret");
    if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
      return jsonResponse({ error: "Unauthorized" }, { status: 401 });
    }

    const horizon = Number(req.headers.get("x-days-ahead") ?? 30);
    const safeHorizon = Number.isFinite(horizon) && horizon > 0 ? horizon : 30;
    const result = await generateRecurrenceDeadlines(prisma, new Date(), safeHorizon);
    return jsonResponse({ data: result });
  } catch (error) {
    logError("recurrences.generate.failed", { error: String(error) });
    return jsonResponse({ error: "Internal server error" }, { status: 500 });
  }
}
