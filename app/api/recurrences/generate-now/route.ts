import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateRecurrenceDeadlines } from "@/lib/recurrence-engine";
import { jsonResponse } from "@/lib/http";
import { logError } from "@/lib/logger";

/**
 * POST /api/recurrences/generate-now
 * Triggers immediate deadline generation for the current user's recurrences.
 * Auth-guarded (session required) — no cron secret needed.
 */
export async function POST() {
    try {
        const session = await getServerSession(authOptions);
        const userId = session?.user?.id;
        if (!userId) {
            return jsonResponse({ error: "Unauthorized" }, { status: 401 });
        }

        // Scope generation to this user only
        const result = await generateRecurrenceDeadlines(prisma, new Date(), 365, { userId });
        return jsonResponse({ data: result });
    } catch (error) {
        logError("recurrences.generate-now.failed", { error: String(error) });
        return jsonResponse({ error: "Internal server error" }, { status: 500 });
    }
}
