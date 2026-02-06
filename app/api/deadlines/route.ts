import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateUrgencyScore, deriveStatus } from "@/lib/urgency";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { jsonResponse } from "@/lib/http";
import { logError } from "@/lib/logger";
import type { DeadlineInput } from "@/types/deadline";

function parseSort(req: NextRequest) {
  const sort = req.nextUrl.searchParams.get("sort") || "urgency";
  if (sort === "dueDate") return { dueDate: "asc" } as const;
  return { urgencyScore: "desc" } as const;
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if (!userId) return jsonResponse({ error: "Unauthorized" }, { status: 401 });

    const deadlines = await prisma.deadline.findMany({
      where: { userId },
      orderBy: parseSort(req),
      include: {
        dependencies: true,
        dependents: true,
      },
    });

    return jsonResponse(
      { data: deadlines },
      { cacheControl: "private, max-age=30, stale-while-revalidate=60" }
    );
  } catch (error) {
    logError("deadlines.get.failed", { error: String(error) });
    return jsonResponse({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if (!userId) return jsonResponse({ error: "Unauthorized" }, { status: 401 });

    const payload = (await req.json()) as DeadlineInput;
    if (!payload?.title || !payload?.dueDate || !payload?.priority) {
      return jsonResponse({ error: "Invalid payload" }, { status: 400 });
    }

    const dueDate = new Date(payload.dueDate);
    if (Number.isNaN(dueDate.getTime())) {
      return jsonResponse({ error: "Invalid dueDate" }, { status: 400 });
    }

    const urgencyScore = calculateUrgencyScore(payload.priority, dueDate);

    let status = deriveStatus(dueDate);
    if (payload.dependencyIds?.length) {
      const ownedBlockers = await prisma.deadline.count({
        where: {
          id: { in: payload.dependencyIds },
          userId,
        },
      });
      if (ownedBlockers !== payload.dependencyIds.length) {
        return jsonResponse({ error: "Invalid dependencies" }, { status: 403 });
      }

      const blockers = await prisma.deadline.count({
        where: {
          id: { in: payload.dependencyIds },
          userId,
          status: { not: "COMPLETED" },
        },
      });
      if (blockers > 0) status = "BLOCKED";
    }

    const deadline = await prisma.deadline.create({
      data: {
        userId,
        title: payload.title,
        description: payload.description ?? null,
        dueDate,
        priority: payload.priority,
        category: payload.category ?? null,
        urgencyScore,
        status,
        recurrenceId: payload.recurrenceId ?? null,
        dependencies: payload.dependencyIds?.length
          ? {
              createMany: {
                data: payload.dependencyIds.map((id) => ({ blockerId: id })),
              },
            }
          : undefined,
      },
    });

    return jsonResponse({ data: deadline }, { status: 201 });
  } catch (error) {
    logError("deadlines.post.failed", { error: String(error) });
    return jsonResponse({ error: "Internal server error" }, { status: 500 });
  }
}
