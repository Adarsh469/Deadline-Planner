import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateUrgencyScore, deriveStatus } from "@/lib/urgency";
import { getAuthUserId } from "@/lib/auth";
import { jsonResponse } from "@/lib/http";
import { logError } from "@/lib/logger";
import type { DeadlineUpdateInput } from "@/types/deadline";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return jsonResponse({ error: "Unauthorized" }, { status: 401 });

    const deadline = await prisma.deadline.findFirst({
      where: { id: params.id, userId },
      include: {
        dependencies: true,
        dependents: true,
      },
    });

    if (!deadline) return jsonResponse({ error: "Not found" }, { status: 404 });
    return jsonResponse({ data: deadline }, { cacheControl: "private, max-age=30, stale-while-revalidate=60" });
  } catch (error) {
    logError("deadlines.id.get.failed", { error: String(error) });
    return jsonResponse({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return jsonResponse({ error: "Unauthorized" }, { status: 401 });

    const payload = (await req.json()) as DeadlineUpdateInput;

    const dueDate = payload.dueDate ? new Date(payload.dueDate) : undefined;
    if (payload.dueDate && Number.isNaN(dueDate?.getTime())) {
      return jsonResponse({ error: "Invalid dueDate" }, { status: 400 });
    }

    const completedAt = payload.completedAt ? new Date(payload.completedAt) : payload.completedAt ?? undefined;

    const existing = await prisma.deadline.findFirst({
      where: { id: params.id, userId },
      include: { dependencies: true },
    });
    if (!existing) return jsonResponse({ error: "Not found" }, { status: 404 });

    const priority = payload.priority ?? existing.priority;
    const finalDueDate = dueDate ?? existing.dueDate;
    const urgencyScore = calculateUrgencyScore(priority, finalDueDate);

    let status = payload.status ?? existing.status;
    if (!payload.status) status = deriveStatus(finalDueDate, completedAt ?? existing.completedAt);

    if (existing.dependencies.length > 0) {
      const blockers = await prisma.deadline.count({
        where: {
          id: { in: existing.dependencies.map((d) => d.blockerId) },
          userId,
          status: { not: "COMPLETED" },
        },
      });
      if (blockers > 0) status = "BLOCKED";
    }

    const deadline = await prisma.deadline.update({
      where: { id: params.id },
      data: {
        title: payload.title ?? undefined,
        description: payload.description ?? undefined,
        dueDate,
        priority: payload.priority ?? undefined,
        category: payload.category ?? undefined,
        status,
        completedAt: completedAt ?? undefined,
        urgencyScore,
      },
    });

    return jsonResponse({ data: deadline });
  } catch (error) {
    logError("deadlines.id.patch.failed", { error: String(error) });
    return jsonResponse({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return jsonResponse({ error: "Unauthorized" }, { status: 401 });

    const existing = await prisma.deadline.findFirst({
      where: { id: params.id, userId },
    });
    if (!existing) return jsonResponse({ error: "Not found" }, { status: 404 });

    await prisma.deadline.delete({ where: { id: params.id } });
    return jsonResponse({ ok: true });
  } catch (error) {
    logError("deadlines.id.delete.failed", { error: String(error) });
    return jsonResponse({ error: "Internal server error" }, { status: 500 });
  }
}
