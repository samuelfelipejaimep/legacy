"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { createServerClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/types";

export async function resetUserData(): Promise<ActionResult> {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "No autenticado" };

    const profile = await prisma.profile.findUnique({
      where: { userId: user.id },
    });
    if (!profile) return { success: false, error: "Perfil no encontrado" };

    const profileId = profile.id;

    // ── Fetch IDs upfront to use explicit filters (avoid nested-relation
    //    filters which can silently fail in Prisma batch transactions) ──────

    const objectiveIds = (
      await prisma.objective.findMany({
        where: { profileId },
        select: { id: true },
      })
    ).map((o) => o.id);

    const transactionIds = (
      await prisma.transaction.findMany({
        where: { profileId },
        select: { id: true },
      })
    ).map((t) => t.id);

    const conversationIds = (
      await prisma.midasConversation.findMany({
        where: { profileId },
        select: { id: true },
      })
    ).map((c) => c.id);

    // ── Delete in FK-safe order, each as an independent await ─────────────
    // 1. ObjectiveAllocations (references both Transaction and Objective)
    if (objectiveIds.length > 0 || transactionIds.length > 0) {
      await prisma.objectiveAllocation.deleteMany({
        where: {
          OR: [
            ...(objectiveIds.length > 0
              ? [{ objectiveId: { in: objectiveIds } }]
              : []),
            ...(transactionIds.length > 0
              ? [{ transactionId: { in: transactionIds } }]
              : []),
          ],
        },
      });
    }

    // 2. Hall of Fame (references Objective)
    if (objectiveIds.length > 0) {
      await prisma.hallOfFame.deleteMany({
        where: { objectiveId: { in: objectiveIds } },
      });
    }

    // 3. Strategic Archive (references Objective)
    if (objectiveIds.length > 0) {
      await prisma.strategicArchive.deleteMany({
        where: { objectiveId: { in: objectiveIds } },
      });
    }

    // 4. Objectives
    await prisma.objective.deleteMany({ where: { profileId } });

    // 5. Transactions
    await prisma.transaction.deleteMany({ where: { profileId } });

    // 6. MIDAS messages (references Conversation)
    if (conversationIds.length > 0) {
      await prisma.midasMessage.deleteMany({
        where: { conversationId: { in: conversationIds } },
      });
    }

    // 7. MIDAS conversations
    await prisma.midasConversation.deleteMany({ where: { profileId } });

    // 8. Monthly reviews
    await prisma.monthlyReview.deleteMany({ where: { profileId } });

    // 9. Level history
    await prisma.levelHistory.deleteMany({ where: { profileId } });

    // 10. Reset profile counters — keep name, email, currency, settings
    await prisma.profile.update({
      where: { id: profileId },
      data: { xp: 0, level: 1, controlIndex: 0, shieldBalance: 0 },
    });

    // ── NO createMany here — user starts with a completely blank slate ─────

    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    console.error("resetUserData error:", error);
    return {
      success: false,
      error: "Error durante el reinicio. Revisa la consola.",
    };
  }
}
