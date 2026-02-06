import { NotificationType, PrismaClient } from "@prisma/client";

const UPCOMING_WINDOW_HOURS = 24;

function roundDown(date: Date, minutes: number) {
  const ms = minutes * 60 * 1000;
  return new Date(Math.floor(date.getTime() / ms) * ms);
}

function startOfToday(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function buildNotificationCopy(type: NotificationType, title: string, dueDate: Date) {
  const formatted = dueDate.toLocaleString();
  if (type === "OVERDUE") {
    return {
      title: "Overdue deadline",
      body: `"${title}" was due ${formatted}.`,
    };
  }
  if (type === "ESCALATING") {
    return {
      title: "Deadline approaching",
      body: `"${title}" is due by ${formatted}.`,
    };
  }
  return {
    title: "Upcoming deadline",
    body: `"${title}" is due by ${formatted}.`,
  };
}

function computeSchedule(dueDate: Date, now: Date) {
  const diffMs = dueDate.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffMs <= 0) {
    return { type: "OVERDUE" as NotificationType, scheduledAt: startOfToday(now) };
  }

  if (diffHours <= 1) {
    return { type: "ESCALATING" as NotificationType, scheduledAt: roundDown(now, 15) };
  }

  if (diffHours <= 6) {
    return { type: "ESCALATING" as NotificationType, scheduledAt: roundDown(now, 60) };
  }

  return { type: "UPCOMING" as NotificationType, scheduledAt: roundDown(now, 360) };
}

export async function generateNotifications(prisma: PrismaClient, now = new Date()) {
  const upcomingCutoff = new Date(now.getTime() + UPCOMING_WINDOW_HOURS * 60 * 60 * 1000);

  const deadlines = await prisma.deadline.findMany({
    where: {
      status: { not: "COMPLETED" },
      OR: [{ dueDate: { lte: upcomingCutoff } }, { dueDate: { lt: now } }],
    },
    select: {
      id: true,
      userId: true,
      title: true,
      dueDate: true,
    },
  });

  if (deadlines.length === 0) return { created: 0 };

  const notifications = deadlines.map((deadline) => {
    const { type, scheduledAt } = computeSchedule(new Date(deadline.dueDate), now);
    const copy = buildNotificationCopy(type, deadline.title, new Date(deadline.dueDate));

    return {
      userId: deadline.userId,
      deadlineId: deadline.id,
      type,
      scheduledAt,
      title: copy.title,
      body: copy.body,
    };
  });

  const result = await prisma.notification.createMany({
    data: notifications,
    skipDuplicates: true,
  });

  return { created: result.count };
}
