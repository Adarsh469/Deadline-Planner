import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jsonResponse } from "@/lib/http";
import { logError } from "@/lib/logger";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if (!userId) return jsonResponse({ error: "Unauthorized" }, { status: 401 });

    const payload = (await req.json()) as { ids: string[] };
    if (!payload?.ids?.length) return jsonResponse({ error: "Missing ids" }, { status: 400 });

    await prisma.notification.updateMany({
      where: { userId, id: { in: payload.ids } },
      data: { seenAt: new Date() },
    });

    return jsonResponse({ ok: true });
  } catch (error) {
    logError("notifications.ack.failed", { error: String(error) });
    return jsonResponse({ error: "Internal server error" }, { status: 500 });
  }
}
