export type NotificationPayload = {
  id: string;
  title: string;
  body: string;
  urgencyScore: number;
  dueDate: string;
};

export async function requestBrowserNotificationPermission() {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported" as const;
  return Notification.requestPermission();
}

export function fireBrowserNotification(payload: NotificationPayload) {
  if (typeof window === "undefined" || !("Notification" in window)) return false;
  if (Notification.permission !== "granted") return false;

  new Notification(payload.title, {
    body: payload.body,
    tag: payload.id,
    renotify: true,
  });

  return true;
}

export function shouldIncreaseReminderFrequency(urgencyScore: number) {
  if (urgencyScore >= 1) return 15; // every 15 minutes
  if (urgencyScore >= 0.4) return 60; // hourly
  if (urgencyScore >= 0.1) return 180; // every 3 hours
  return 720; // every 12 hours
}
