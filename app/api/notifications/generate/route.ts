import { prisma } from "@/lib/prisma";
import { generateNotifications } from "@/lib/notifications-engine";
import { jsonResponse } from "@/lib/http";
import { logError } from "@/lib/logger";

export async function POST(req: Request) {
  try {
    const secret = req.headers.get("x-cron-secret");
    if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
      return jsonResponse({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await generateNotifications(prisma, new Date());
    return jsonResponse({ data: result });
  } catch (error) {
    logError("notifications.generate.failed", { error: String(error) });
    return jsonResponse({ error: "Internal server error" }, { status: 500 });
  }
}
