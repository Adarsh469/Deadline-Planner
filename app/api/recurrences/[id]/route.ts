import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jsonResponse } from "@/lib/http";
import { logError } from "@/lib/logger";
import { generateRecurrenceDeadlines } from "@/lib/recurrence-engine";

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if (!userId) return jsonResponse({ error: "Unauthorized" }, { status: 401 });

    const existing = await prisma.recurrence.findFirst({
      where: { id: params.id, userId },
    });
    if (!existing) return jsonResponse({ error: "Not found" }, { status: 404 });

    // Delete all associated future pending deadlines first, then the recurrence
    await prisma.$transaction([
      prisma.deadline.deleteMany({
        where: {
          recurrenceId: params.id,
          status: "PENDING",
          dueDate: { gte: new Date() },
        },
      }),
      prisma.recurrence.delete({ where: { id: params.id } }),
    ]);

    return jsonResponse({ ok: true });
  } catch (error) {
    logError("recurrences.delete.failed", { error: String(error) });
    return jsonResponse({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if (!userId) return jsonResponse({ error: "Unauthorized" }, { status: 401 });

    const existing = await prisma.recurrence.findFirst({
      where: { id: params.id, userId },
    });
    if (!existing) return jsonResponse({ error: "Not found" }, { status: 404 });

    const body = (await req.json()) as { pausedUntil?: string | null };
    const isPausing = !!body.pausedUntil;
    const pausedUntil = body.pausedUntil ? new Date(body.pausedUntil) : null;

    if (isPausing) {
      // Pausing: update pausedUntil AND delete all future pending deadlines for this recurrence
      await prisma.$transaction([
        prisma.deadline.deleteMany({
          where: {
            recurrenceId: params.id,
            status: "PENDING",
            dueDate: { gte: new Date() },
          },
        }),
        prisma.recurrence.update({
          where: { id: params.id },
          data: { pausedUntil, lastGeneratedAt: null },
        }),
      ]);
    } else {
      // Resuming: clear pausedUntil and reset lastGeneratedAt so engine regenerates from now
      await prisma.recurrence.update({
        where: { id: params.id },
        data: { pausedUntil: null, lastGeneratedAt: null },
      });
      // Immediately regenerate deadlines scoped to this user + this specific recurrence
      await generateRecurrenceDeadlines(prisma, new Date(), 365, {
        userId,
        recurrenceId: params.id,
      });
    }

    const updated = await prisma.recurrence.findUnique({ where: { id: params.id } });
    return jsonResponse({ data: updated });
  } catch (error) {
    logError("recurrences.patch.failed", { error: String(error) });
    return jsonResponse({ error: "Internal server error" }, { status: 500 });
  }
}
