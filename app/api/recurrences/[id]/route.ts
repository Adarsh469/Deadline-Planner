import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jsonResponse } from "@/lib/http";
import { logError } from "@/lib/logger";

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if (!userId) return jsonResponse({ error: "Unauthorized" }, { status: 401 });

    const existing = await prisma.recurrence.findFirst({
      where: { id: params.id, userId },
    });
    if (!existing) return jsonResponse({ error: "Not found" }, { status: 404 });

    await prisma.recurrence.delete({ where: { id: params.id } });
    return jsonResponse({ ok: true });
  } catch (error) {
    logError("recurrences.delete.failed", { error: String(error) });
    return jsonResponse({ error: "Internal server error" }, { status: 500 });
  }
}
