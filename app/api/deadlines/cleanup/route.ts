import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jsonResponse } from "@/lib/http";
import { logError } from "@/lib/logger";

/**
 * POST /api/deadlines/cleanup
 *
 * Rules applied when the due date has passed (dueDate < now):
 *   - COMPLETED  → delete the record (task is done, due date passed, clean up)
 *   - PENDING    → mark as OVERDUE
 *
 * A COMPLETED task whose due date hasn't passed yet remains COMPLETED and untouched.
 */
export async function POST() {
    try {
        const session = await getServerSession(authOptions);
        const userId = session?.user?.id;
        if (!userId) return jsonResponse({ error: "Unauthorized" }, { status: 401 });

        const now = new Date();

        // 1. Delete completed deadlines whose due date has already passed
        const { count: deleted } = await prisma.deadline.deleteMany({
            where: {
                userId,
                status: "COMPLETED",
                dueDate: { lt: now },
            },
        });

        // 2. Flip PENDING → OVERDUE for any deadlines past due
        const { count: markedOverdue } = await prisma.deadline.updateMany({
            where: {
                userId,
                status: "PENDING",
                dueDate: { lt: now },
            },
            data: { status: "OVERDUE" },
        });

        return jsonResponse({ data: { deleted, markedOverdue } });
    } catch (error) {
        logError("deadlines.cleanup.failed", { error: String(error) });
        return jsonResponse({ error: "Internal server error" }, { status: 500 });
    }
}
