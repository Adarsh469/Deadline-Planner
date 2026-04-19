import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jsonResponse } from "@/lib/http";
import { logError } from "@/lib/logger";
import { DeadlinePriority } from "@prisma/client";

/**
 * PATCH /api/deadlines/bulk-priority
 * Body: { recurrenceId: string; priority: DeadlinePriority }
 *
 * Updates the priority of ALL non-completed deadlines belonging to the
 * given recurrence (scoped to the current user).
 */
export async function PATCH(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        const userId = session?.user?.id;
        if (!userId) return jsonResponse({ error: "Unauthorized" }, { status: 401 });

        const { recurrenceId, priority } = (await req.json()) as {
            recurrenceId: string;
            priority: DeadlinePriority;
        };

        if (!recurrenceId || !priority) {
            return jsonResponse({ error: "recurrenceId and priority are required" }, { status: 400 });
        }

        const { count } = await prisma.deadline.updateMany({
            where: {
                userId,
                recurrenceId,
                status: { not: "COMPLETED" },
            },
            data: { priority },
        });

        return jsonResponse({ data: { updated: count } });
    } catch (error) {
        logError("deadlines.bulk-priority.failed", { error: String(error) });
        return jsonResponse({ error: "Internal server error" }, { status: 500 });
    }
}
