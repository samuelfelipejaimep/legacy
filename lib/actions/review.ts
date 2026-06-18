"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { addXp } from "@/lib/actions/profile";
import { XP } from "@/lib/constants";
import type { ActionResult } from "@/lib/types";
import type { MonthlyReview } from "@prisma/client";

interface SubmitReviewInput {
  profileId: string;
  month: number;
  year: number;
  totalIncome: number;
  totalExpenses: number;
  totalInvested: number;
  wentWell: string;
  wentWrong: string;
  nextMonthGoal: number;
  priorityChanges: string;
  reviewId: string | null;
}

export async function submitMonthlyReview(
  input: SubmitReviewInput
): Promise<ActionResult<MonthlyReview>> {
  try {
    const saved = Math.max(input.totalIncome - input.totalExpenses - input.totalInvested, 0);

    const review = await prisma.monthlyReview.upsert({
      where: {
        profileId_month_year: {
          profileId: input.profileId,
          month: input.month,
          year: input.year,
        },
      },
      update: {
        totalIncome: input.totalIncome,
        totalExpenses: input.totalExpenses,
        totalSaved: saved,
        totalInvested: input.totalInvested,
        wentWell: input.wentWell,
        wentWrong: input.wentWrong,
        nextMonthGoal: input.nextMonthGoal,
        priorityChanges: input.priorityChanges,
        completedAt: new Date(),
      },
      create: {
        profileId: input.profileId,
        month: input.month,
        year: input.year,
        totalIncome: input.totalIncome,
        totalExpenses: input.totalExpenses,
        totalSaved: saved,
        totalInvested: input.totalInvested,
        wentWell: input.wentWell,
        wentWrong: input.wentWrong,
        nextMonthGoal: input.nextMonthGoal,
        priorityChanges: input.priorityChanges,
        completedAt: new Date(),
        xpGained: XP.MONTHLY_REVIEW,
      },
    });

    // Award XP if first completion
    if (!input.reviewId) {
      await addXp(input.profileId, XP.MONTHLY_REVIEW, "Revisión mensual completada");
    }

    revalidatePath("/revision");
    revalidatePath("/");
    return { success: true, data: review };
  } catch (error) {
    console.error("submitMonthlyReview error:", error);
    return { success: false, error: "Error guardando la revisión" };
  }
}
