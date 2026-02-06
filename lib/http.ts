import { NextResponse } from "next/server";

export function jsonResponse<T>(data: T, options?: { status?: number; cacheControl?: string }) {
  const headers: Record<string, string> = {};
  if (options?.cacheControl) headers["Cache-Control"] = options.cacheControl;
  return NextResponse.json(data, { status: options?.status ?? 200, headers });
}
