import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RecurrenceUnit, DeadlinePriority } from "@prisma/client";
import { jsonResponse } from "@/lib/http";
import { logError } from "@/lib/logger";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if (!userId) return jsonResponse({ error: "Unauthorized" }, { status: 401 });

    const recurrences = await prisma.recurrence.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return jsonResponse(
      { data: recurrences },
      { cacheControl: "private, max-age=60, stale-while-revalidate=120" }
    );
  } catch (error) {
    logError("recurrences.get.failed", { error: String(error) });
    return jsonResponse({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if (!userId) return jsonResponse({ error: "Unauthorized" }, { status: 401 });

    const payload = (await req.json()) as {
      title: string;
      description?: string | null;
      priority: DeadlinePriority;
      category?: string | null;
      unit: RecurrenceUnit;
      interval: number;
      startDate: string;
      endDate?: string | null;
    };

    if (!payload?.title || !payload?.startDate || !payload?.unit || !payload?.priority) {
      return jsonResponse({ error: "Invalid payload" }, { status: 400 });
    }

    const interval = Number(payload.interval ?? 1);
    if (!Number.isFinite(interval) || interval < 1) {
      return jsonResponse({ error: "Invalid interval" }, { status: 400 });
    }

    const startDate = new Date(payload.startDate);
    if (Number.isNaN(startDate.getTime())) {
      return jsonResponse({ error: "Invalid startDate" }, { status: 400 });
    }

    const endDate = payload.endDate ? new Date(payload.endDate) : null;
    if (endDate && Number.isNaN(endDate.getTime())) {
      return jsonResponse({ error: "Invalid endDate" }, { status: 400 });
    }

    const recurrence = await prisma.recurrence.create({
      data: {
        userId,
        title: payload.title,
        description: payload.description ?? null,
        priority: payload.priority,
        category: payload.category ?? null,
        unit: payload.unit,
        interval,
        startDate,
        endDate,
      },
    });

    return jsonResponse({ data: recurrence }, { status: 201 });
  } catch (error) {
    logError("recurrences.post.failed", { error: String(error) });
    return jsonResponse({ error: "Internal server error" }, { status: 500 });
  }
}
