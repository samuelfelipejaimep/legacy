"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { addXp } from "@/lib/actions/profile";
import type { ActionResult, ObjectiveFormData } from "@/lib/types";

// ─── CREATE ──────────────────────────────────────────────────

export async function createObjective(
  profileId: string,
  data: ObjectiveFormData
): Promise<ActionResult<{ id: string }>> {
  try {
    const xpReward = Math.max(100, Math.round(Number(data.targetAmount) * 0.005));

    const objective = await prisma.objective.create({
      data: {
        profileId,
        name: data.name.trim(),
        subtitle: data.subtitle?.trim() || null,
        targetAmount: Number(data.targetAmount),
        currency: data.currency as any,
        targetDate: data.targetDate ? new Date(data.targetDate) : null,
        priority: data.priority ?? 99,
        xpReward,
      },
    });

    revalidatePath("/objetivos");
    revalidatePath("/");
    return { success: true, data: { id: objective.id } };
  } catch (error) {
    console.error("createObjective:", error);
    return { success: false, error: "Error creando el objetivo" };
  }
}

// ─── UPDATE ──────────────────────────────────────────────────

export async function updateObjective(
  objectiveId: string,
  data: Partial<ObjectiveFormData>
): Promise<ActionResult> {
  try {
    await prisma.objective.update({
      where: { id: objectiveId },
      data: {
        ...(data.name && { name: data.name.trim() }),
        ...(data.subtitle !== undefined && { subtitle: data.subtitle?.trim() || null }),
        ...(data.targetAmount !== undefined && { targetAmount: Number(data.targetAmount) }),
        ...(data.currency && { currency: data.currency as any }),
        ...(data.targetDate !== undefined && {
          targetDate: data.targetDate ? new Date(data.targetDate) : null,
        }),
        ...(data.priority !== undefined && { priority: Number(data.priority) }),
      },
    });

    revalidatePath("/objetivos");
    revalidatePath(`/objetivos/${objectiveId}`);
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("updateObjective:", error);
    return { success: false, error: "Error actualizando el objetivo" };
  }
}

// ─── DELETE ──────────────────────────────────────────────────

export async function deleteObjective(objectiveId: string): Promise<ActionResult> {
  try {
    await prisma.objective.delete({ where: { id: objectiveId } });
    revalidatePath("/objetivos");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("deleteObjective:", error);
    return { success: false, error: "Error eliminando el objetivo" };
  }
}

// ─── STATUS ──────────────────────────────────────────────────

export async function setObjectiveStatus(
  objectiveId: string,
  status: "ACTIVE" | "FIXED" | "PAUSED"
): Promise<ActionResult> {
  try {
    await prisma.objective.update({
      where: { id: objectiveId },
      data: { status: status as any },
    });
    revalidatePath("/objetivos");
    revalidatePath(`/objetivos/${objectiveId}`);
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("setObjectiveStatus:", error);
    return { success: false, error: "Error cambiando estado" };
  }
}

// ─── COMPLETE → Hall of Fame ──────────────────────────────────

export async function completeObjective(
  objectiveId: string,
  profileId: string,
  extras: { notes?: string; emotion?: string }
): Promise<ActionResult> {
  try {
    const objective = await prisma.objective.findUniqueOrThrow({
      where: { id: objectiveId },
    });

    await prisma.$transaction([
      prisma.objective.update({
        where: { id: objectiveId },
        data: { status: "COMPLETED", completedAt: new Date() },
      }),
      prisma.hallOfFame.upsert({
        where: { objectiveId },
        update: {
          completedAt: new Date(),
          notes: extras.notes || null,
          emotion: extras.emotion || null,
          finalAmount: objective.currentAmount,
          xpEarned: objective.xpReward,
        },
        create: {
          objectiveId,
          completedAt: new Date(),
          notes: extras.notes || null,
          emotion: extras.emotion || null,
          finalAmount: objective.currentAmount,
          xpEarned: objective.xpReward,
        },
      }),
    ]);

    if (objective.xpReward > 0) {
      await addXp(profileId, objective.xpReward, `Objetivo completado: ${objective.name}`);
    }

    revalidatePath("/objetivos");
    revalidatePath(`/objetivos/${objectiveId}`);
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("completeObjective:", error);
    return { success: false, error: "Error completando el objetivo" };
  }
}

// ─── CANCEL → Strategic Archive ──────────────────────────────

export async function cancelObjective(
  objectiveId: string,
  data: { reason: string; redistributeTo?: string }
): Promise<ActionResult> {
  try {
    const objective = await prisma.objective.findUniqueOrThrow({
      where: { id: objectiveId },
    });

    await prisma.$transaction([
      prisma.objective.update({
        where: { id: objectiveId },
        data: { status: "CANCELLED", cancelledAt: new Date() },
      }),
      prisma.strategicArchive.upsert({
        where: { objectiveId },
        update: {
          cancelledAt: new Date(),
          reason: data.reason,
          fundsRecovered: objective.currentAmount,
          redistributedTo: data.redistributeTo || null,
        },
        create: {
          objectiveId,
          cancelledAt: new Date(),
          reason: data.reason,
          fundsRecovered: objective.currentAmount,
          redistributedTo: data.redistributeTo || null,
        },
      }),
    ]);

    revalidatePath("/objetivos");
    revalidatePath(`/objetivos/${objectiveId}`);
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("cancelObjective:", error);
    return { success: false, error: "Error cancelando el objetivo" };
  }
}

// ─── ADD FUNDS ────────────────────────────────────────────────

export async function addFundsToObjective(
  objectiveId: string,
  amount: number
): Promise<ActionResult> {
  try {
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      return { success: false, error: "El monto debe ser mayor a 0" };
    }

    await prisma.objective.update({
      where: { id: objectiveId },
      data: { currentAmount: { increment: amt } },
    });

    revalidatePath("/objetivos");
    revalidatePath(`/objetivos/${objectiveId}`);
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("addFundsToObjective:", error);
    return { success: false, error: "Error añadiendo fondos" };
  }
}

// ─── UPDATE PRIORITY ─────────────────────────────────────────

export async function updateObjectivePriority(
  objectiveId: string,
  priority: number
): Promise<ActionResult> {
  try {
    await prisma.objective.update({
      where: { id: objectiveId },
      data: { priority },
    });
    revalidatePath("/objetivos");
    revalidatePath("/");
    return { success: true };
  } catch {
    return { success: false, error: "Error actualizando prioridad" };
  }
}
