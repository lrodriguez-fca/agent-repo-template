import { SESSION_LABEL, type SessionType } from "./timer";

export function endMessage(ended: SessionType, next: SessionType): string {
  return `${SESSION_LABEL[ended]} ended. Next: ${SESSION_LABEL[next]}.`;
}

function warn(message: string, err?: unknown) {
  if (import.meta.env?.DEV) console.warn(message, err);
}

export function notificationsSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

/** REQ-021: only called from a user action (enabling the toggle). */
export async function requestNotificationPermission(): Promise<NotificationPermission | "unsupported"> {
  if (!notificationsSupported()) return "unsupported";
  try {
    if (Notification.permission !== "default") return Notification.permission;
    return await Notification.requestPermission();
  } catch (err) {
    warn("Notification permission request failed", err);
    return "denied";
  }
}

/** REQ-020/022: never throws. */
export function showSystemNotification(title: string, body: string): void {
  if (!notificationsSupported() || Notification.permission !== "granted") return;
  try {
    new Notification(title, { body });
  } catch (err) {
    warn("Could not show notification", err);
  }
}
