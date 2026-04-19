import { PrismaClient, RecurrenceUnit, DeadlinePriority } from "@prisma/client";

export type RecurrenceGenerationResult = {
  created: number;
  updated: number;
};

// ── Helpers ─────────────────────────────────────────────────────────

function parseIntList(s: string | null | undefined): number[] {
  if (!s) return [];
  return s.split(",").map((x) => parseInt(x.trim(), 10)).filter((n) => Number.isFinite(n));
}

/** Return every date between `from` (inclusive) and `to` (inclusive) */
function dateRange(from: Date, to: Date): Date[] {
  const dates: Date[] = [];
  const cur = new Date(from);
  cur.setHours(from.getHours(), from.getMinutes(), 0, 0);
  while (cur <= to) {
    dates.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

/** Given a recurrence start date, produce all due-dates in [now, horizon] */
function computeDueDates(
  unit: RecurrenceUnit,
  startDate: Date,
  daysOfWeek: number[], // for WEEKLY
  datesOfMonth: number[], // for MONTHLY
  now: Date,
  horizon: Date
): Date[] {
  const h = startDate.getHours();
  const m = startDate.getMinutes();
  const from = now < startDate ? startDate : now;

  if (unit === "DAILY") {
    return dateRange(from, horizon)
      .map((d) => {
        d.setHours(h, m, 0, 0);
        return d;
      })
      .filter((d) => d >= from && d <= horizon);
  }

  if (unit === "WEEKLY") {
    if (daysOfWeek.length === 0) {
      // Fallback: same weekday as startDate
      daysOfWeek = [startDate.getDay()];
    }
    return dateRange(from, horizon)
      .filter((d) => daysOfWeek.includes(d.getDay()))
      .map((d) => {
        d.setHours(h, m, 0, 0);
        return d;
      })
      .filter((d) => d >= from && d <= horizon);
  }

  if (unit === "MONTHLY") {
    if (datesOfMonth.length === 0) {
      datesOfMonth = [startDate.getDate()];
    }
    return dateRange(from, horizon)
      .filter((d) => datesOfMonth.includes(d.getDate()))
      .map((d) => {
        d.setHours(h, m, 0, 0);
        return d;
      })
      .filter((d) => d >= from && d <= horizon);
  }

  return [];
}

// ── Main export ──────────────────────────────────────────────────────

export async function generateRecurrenceDeadlines(
  prisma: PrismaClient,
  now = new Date(),
  daysAhead = 30,
  opts: { userId?: string; recurrenceId?: string } = {}
): Promise<RecurrenceGenerationResult> {
  const horizon = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

  const recurrences = await prisma.recurrence.findMany({
    where: {
      startDate: { lte: horizon },
      OR: [{ endDate: null }, { endDate: { gte: now } }],
      ...(opts.userId ? { userId: opts.userId } : {}),
      ...(opts.recurrenceId ? { id: opts.recurrenceId } : {}),
    },
  });

  if (recurrences.length === 0) return { created: 0, updated: 0 };

  let created = 0;
  let updated = 0;

  for (const recurrence of recurrences) {
    // Skip if paused and pausedUntil is still in the future
    if (recurrence.pausedUntil && recurrence.pausedUntil > now) continue;
    const startDate = new Date(recurrence.startDate);
    const end = recurrence.endDate ? new Date(recurrence.endDate) : null;
    const cutoff = end && end < horizon ? end : horizon;

    // Use last-generated time as the lower bound so we don't regenerate past entries
    const lastGen = recurrence.lastGeneratedAt ? new Date(recurrence.lastGeneratedAt) : null;
    // Start generating from 1 minute after lastGen (to avoid re-inserting it) or from now
    const genFrom = lastGen ? new Date(lastGen.getTime() + 60_000) : now;

    const dueDates = computeDueDates(
      recurrence.unit,
      startDate,
      parseIntList(recurrence.daysOfWeek),
      parseIntList(recurrence.datesOfMonth),
      genFrom,
      cutoff
    );

    if (dueDates.length === 0) continue;

    const result = await prisma.$transaction(async (tx) => {
      const insert = await tx.deadline.createMany({
        data: dueDates.map((dueDate) => ({
          userId: recurrence.userId,
          title: recurrence.title,
          description: recurrence.description,
          dueDate,
          priority: recurrence.priority as DeadlinePriority,
          category: recurrence.category,
          status: "PENDING",
          urgencyScore: 0,
          recurrenceId: recurrence.id,
        })),
        skipDuplicates: true,
      });

      const lastGeneratedAt = dueDates[dueDates.length - 1];
      await tx.recurrence.update({
        where: { id: recurrence.id },
        data: { lastGeneratedAt },
      });

      return insert.count;
    });

    created += result;
    updated += 1;
  }

  return { created, updated };
}
