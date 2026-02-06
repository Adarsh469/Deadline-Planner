import { PrismaClient, RecurrenceUnit, DeadlinePriority } from "@prisma/client";

export type RecurrenceGenerationResult = {
  created: number;
  updated: number;
};

function addInterval(date: Date, unit: RecurrenceUnit, interval: number) {
  const d = new Date(date);
  if (unit === "DAILY") d.setDate(d.getDate() + interval);
  if (unit === "WEEKLY") d.setDate(d.getDate() + interval * 7);
  if (unit === "MONTHLY") d.setMonth(d.getMonth() + interval);
  return d;
}

function normalizeStart(startDate: Date) {
  const d = new Date(startDate);
  d.setSeconds(0, 0);
  return d;
}

export async function generateRecurrenceDeadlines(
  prisma: PrismaClient,
  now = new Date(),
  daysAhead = 30
): Promise<RecurrenceGenerationResult> {
  const horizon = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

  const recurrences = await prisma.recurrence.findMany({
    where: {
      startDate: { lte: horizon },
      OR: [{ endDate: null }, { endDate: { gte: now } }],
    },
  });

  if (recurrences.length === 0) return { created: 0, updated: 0 };

  let created = 0;
  let updated = 0;

  for (const recurrence of recurrences) {
    const start = normalizeStart(recurrence.startDate);
    const end = recurrence.endDate ? new Date(recurrence.endDate) : null;
    const last = recurrence.lastGeneratedAt ? new Date(recurrence.lastGeneratedAt) : null;

    let cursor = last ? addInterval(last, recurrence.unit, recurrence.interval) : start;
    const cutoff = end && end < horizon ? end : horizon;

    const dueDates: Date[] = [];
    while (cursor <= cutoff) {
      if (cursor >= start) dueDates.push(new Date(cursor));
      cursor = addInterval(cursor, recurrence.unit, recurrence.interval);
    }

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
