import { getAuthUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jsonResponse } from "@/lib/http";
import { logError } from "@/lib/logger";

export async function GET() {
  try {
    const userId = await getAuthUserId();
    if (!userId) return jsonResponse({ error: "Unauthorized" }, { status: 401 });

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return jsonResponse(
      { data: notifications },
      { cacheControl: "private, max-age=15, stale-while-revalidate=30" }
    );
  } catch (error) {
    logError("notifications.get.failed", { error: String(error) });
    return jsonResponse({ error: "Internal server error" }, { status: 500 });
  }
}
