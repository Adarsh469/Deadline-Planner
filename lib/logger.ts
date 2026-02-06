export type LogLevel = "info" | "warn" | "error";

export function log(level: LogLevel, message: string, meta?: Record<string, unknown>) {
  const payload = {
    level,
    message,
    ...(meta ? { meta } : {}),
  };
  // eslint-disable-next-line no-console
  console[level](JSON.stringify(payload));
}

export const logInfo = (message: string, meta?: Record<string, unknown>) => log("info", message, meta);
export const logWarn = (message: string, meta?: Record<string, unknown>) => log("warn", message, meta);
export const logError = (message: string, meta?: Record<string, unknown>) => log("error", message, meta);
