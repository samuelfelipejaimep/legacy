"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { createServerClient } from "@/lib/supabase/server";
import {
  getLevelFromXp,
  getXpForLevel,
  XP,
  CONTROL_INDEX_WEIGHTS,
} from "@/lib/constants";
import { startOfMonth, endOfMonth, currentMonthYear } from "@/lib/utils";
import type { ActionResult } from "@/lib/types";

// ─── Get or create profile ────────────────────────────────────

export async function getOrCreateProfile() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  let profile = await prisma.profile.findUnique({
    where: { userId: user.id },
    include: { settings: true },
  });

  if (!profile) {
    profile = await prisma.profile.create({
      data: {
        userId: user.id,
        displayName: user.email?.split("@")[0] ?? "Usuario",
        settings: { create: {} },
      },
      include: { settings: true },
    });

    // Create initial objectives
    await createInitialObjectives(profile.id);
  }

  return profile;
}

async function createInitialObjectives(profileId: string) {
  const { Currency } = await import("@prisma/client");

  await prisma.objective.createMany({
    data: [
      {
        profileId,
        name: "MX-5 Protocol",
        subtitle: "Mazda Miata MX-5 2026",
        targetAmount: 175_000_000,
        currency: Currency.COP,
        priority: 1,
        xpReward: 5000,
      },
      {
        profileId,
        name: "Upgrade Profesional",
        subtitle: "MacBook Air para trabajo y productividad",
        targetAmount: 1700,
        currency: Currency.USD,
        priority: 2,
        xpReward: 500,
      },
      {
        profileId,
        name: "Misión Caribe",
        subtitle: "Crucero Royal Caribbean para mis padres",
        targetAmount: 4000,
        currency: Currency.USD,
        priority: 3,
        xpReward: 1000,
      },
      {
        profileId,
        name: "Deuda de Honor",
        subtitle: "Pago completo de deuda familiar",
        targetAmount: 2_000_000,
        currency: Currency.COP,
        priority: 4,
        xpReward: 2000,
      },
      {
        profileId,
        name: "Capital de Ataque",
        subtitle: "Reinversión para crecimiento del negocio",
        targetAmount: 10_000,
        currency: Currency.USD,
        priority: 5,
        xpReward: 3000,
      },
    ],
  });
}

// ─── Add XP and handle level-ups ─────────────────────────────

export async function addXp(
  profileId: string,
  amount: number,
  reason: string
): Promise<{ levelsGained: number; newLevel: number; newXp: number }> {
  const profile = await prisma.profile.findUniqueOrThrow({
    where: { id: profileId },
  });

  const oldLevel = profile.level;
  const newXp = profile.xp + amount;
  const newLevel = getLevelFromXp(newXp);

  await prisma.profile.update({
    where: { id: profileId },
    data: { xp: newXp, level: newLevel },
  });

  if (newLevel > oldLevel) {
    await prisma.levelHistory.create({
      data: {
        profileId,
        fromLevel: oldLevel,
        toLevel: newLevel,
        reason,
        xpAtLevel: newXp,
      },
    });
  }

  return { levelsGained: newLevel - oldLevel, newLevel, newXp };
}

// ─── Recalculate Control Index ────────────────────────────────

export async function recalculateControlIndex(profileId: string): Promise<number> {
  const { month, year } = currentMonthYear();
  const from = startOfMonth(month, year);
  const to = endOfMonth(month, year);

  const [transactions, objectives, reviews] = await Promise.all([
    prisma.transaction.findMany({
      where: { profileId, date: { gte: from, lte: to } },
    }),
    prisma.objective.findMany({
      where: { profileId, status: { in: ["ACTIVE", "FIXED"] } },
    }),
    prisma.monthlyReview.findMany({
      where: { profileId, year, month: { lte: month } },
    }),
  ]);

  // Transaction consistency (0-100): 1+ transaction per day = perfect
  const daysInMonth = new Date(year, month, 0).getDate();
  const activeDays = new Set(transactions.map((t) => new Date(t.date).getDate())).size;
  const transactionScore = Math.min((activeDays / Math.max(daysInMonth * 0.5, 1)) * 100, 100);

  // Budget compliance: no impulse purchases = good
  const impulseCount = transactions.filter((t) => t.isImpulsive).length;
  const budgetScore = Math.max(100 - impulseCount * 15, 0);

  // Objective progress: average progress across active objectives
  const objectiveScore =
    objectives.length > 0
      ? objectives.reduce((sum, obj) => {
          const pct = Math.min((obj.currentAmount / obj.targetAmount) * 100, 100);
          return sum + pct;
        }, 0) / objectives.length
      : 0;

  // Monthly review: last 3 months
  const reviewScore = Math.min((reviews.filter((r) => r.completedAt).length / 3) * 100, 100);

  const controlIndex =
    transactionScore * CONTROL_INDEX_WEIGHTS.transactionConsistency +
    budgetScore * CONTROL_INDEX_WEIGHTS.budgetCompliance +
    objectiveScore * CONTROL_INDEX_WEIGHTS.objectiveProgress +
    reviewScore * CONTROL_INDEX_WEIGHTS.monthlyReviewCompletion;

  const rounded = Math.round(controlIndex * 100) / 100;

  await prisma.profile.update({
    where: { id: profileId },
    data: { controlIndex: rounded },
  });

  revalidatePath("/");
  return rounded;
}

// ─── Update profile ───────────────────────────────────────────

export async function updateProfile(
  profileId: string,
  data: { displayName?: string; preferredCurrency?: "USD" | "COP" }
): Promise<ActionResult> {
  try {
    const { Currency } = await import("@prisma/client");
    await prisma.profile.update({
      where: { id: profileId },
      data: {
        ...(data.displayName && { displayName: data.displayName }),
        ...(data.preferredCurrency && {
          preferredCurrency: data.preferredCurrency as any,
        }),
      },
    });
    revalidatePath("/", "layout");
    return { success: true };
  } catch {
    return { success: false, error: "Error actualizando perfil" };
  }
}

// ─── Update exchange rate ─────────────────────────────────────

export async function updateExchangeRate(
  profileId: string,
  rate: number
): Promise<ActionResult> {
  try {
    await prisma.settings.upsert({
      where: { profileId },
      update: { copToUsdRate: rate },
      create: { profileId, copToUsdRate: rate },
    });
    revalidatePath("/", "layout");
    return { success: true };
  } catch {
    return { success: false, error: "Error actualizando tasa" };
  }
}
