"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { addXp, recalculateControlIndex } from "@/lib/actions/profile";
import { XP, VAULT } from "@/lib/constants";
import type { ActionResult, TransactionFormData, VaultAlert } from "@/lib/types";

// ─── VAULT PROTOCOL CHECK ────────────────────────────────────

export async function checkVaultProtocol(
  profileId: string,
  amountUSD: number
): Promise<VaultAlert> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [txs, objectives] = await Promise.all([
    prisma.transaction.findMany({
      where: { profileId, date: { gte: startOfMonth } },
    }),
    prisma.objective.findMany({
      where: { profileId, status: { in: ["ACTIVE", "FIXED"] } },
      orderBy: { priority: "asc" },
      take: 5,
    }),
  ]);

  const income = txs.filter((t) => t.type === "INCOME").reduce((s, t) => s + Number(t.amountUSD), 0);
  const expenses = txs.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + Number(t.amountUSD), 0);
  const liquidity = Math.max(income - expenses, 0);
  const liquidityImpactPct = liquidity > 0 ? (amountUSD / liquidity) * 100 : 100;

  const overThreshold = amountUSD >= VAULT.IMPULSE_THRESHOLD_USD;
  const overLiquidity = liquidityImpactPct >= VAULT.LIQUIDITY_THRESHOLD_PCT * 100;
  const triggered = overThreshold || overLiquidity;

  const avgMonthly = income > 0 ? income * 0.15 : 200;

  const affectedObjectives = objectives
    .filter((o) => Number(o.targetAmount) > Number(o.currentAmount))
    .slice(0, 3)
    .map((o) => {
      const delayDays = avgMonthly > 0 ? Math.round((amountUSD / avgMonthly) * 30) : 30;
      return { name: o.name, delayDays };
    });

  let recoveryPlan = "Puedes compensar esto incrementando tus ingresos o reduciendo gastos esta semana.";
  if (amountUSD >= 2000) {
    recoveryPlan = "Un gasto de este tamaño requiere un plan claro. Considera si puedes diferirlo o dividirlo en cuotas.";
  } else if (amountUSD >= 500) {
    recoveryPlan = "Reducir gastos discrecionales por 3-4 semanas puede compensar este impacto.";
  }

  return {
    triggered,
    amount: amountUSD,
    liquidityImpactPct,
    affectedObjectives,
    recoveryPlan,
  };
}

// ─── CREATE TRANSACTION ───────────────────────────────────────

export async function createTransaction(
  profileId: string,
  data: TransactionFormData,
  copRate = 4400
): Promise<ActionResult<{ id: string; vault?: VaultAlert }>> {
  try {
    const rawAmount = Number(data.amount);
    if (!Number.isFinite(rawAmount) || rawAmount <= 0) {
      return { success: false, error: "El monto debe ser mayor a 0" };
    }

    // Tasa autoritativa: se lee de Settings en el servidor en vez de
    // confiar en el valor que envía el cliente (que puede estar
    // desfasado si el usuario actualizó la tasa en otra pestaña/sesión).
    let effectiveRate = copRate;
    if (data.currency === "COP") {
      const settings = await prisma.settings.findUnique({ where: { profileId } });
      effectiveRate = Number(settings?.copToUsdRate ?? copRate);
    }

    const amountUSD = data.currency === "COP" ? rawAmount / effectiveRate : rawAmount;

    // Vault check for large impulsive expenses
    let vault: VaultAlert | undefined;
    if (data.type === "EXPENSE" && data.isImpulsive) {
      vault = await checkVaultProtocol(profileId, amountUSD);
    }

    const transaction = await prisma.transaction.create({
      data: {
        profileId,
        type: data.type as any,
        amount: rawAmount,
        currency: data.currency as any,
        amountUSD,
        description: data.description.trim(),
        notes: data.notes?.trim() || null,
        date: data.date ? new Date(data.date) : new Date(),
        categoryId: data.categoryId,
        isImpulsive: data.isImpulsive ?? false,
        vaultFlag: vault?.triggered ?? false,
      },
    });

    // Handle objective allocations — el monto asignado nunca puede
    // exceder el monto de esta transacción (evita Liquidez negativa
    // artificial por una asignación mayor al ingreso real).
    if (data.objectiveAllocations?.length) {
      for (const alloc of data.objectiveAllocations) {
        if (!alloc.objectiveId || alloc.amount <= 0) continue;
        const allocAmt = Math.min(Number(alloc.amount), rawAmount);
        await prisma.$transaction([
          prisma.objectiveAllocation.create({
            data: {
              transactionId: transaction.id,
              objectiveId: alloc.objectiveId,
              amount: allocAmt,
              currency: data.currency as any,
            },
          }),
          prisma.objective.update({
            where: { id: alloc.objectiveId },
            data: { currentAmount: { increment: allocAmt } },
          }),
        ]);
      }
    }

    // Ahorro Propio (SAVINGS): mueve el monto directamente al Escudo Financiero
    if (data.type === "SAVINGS") {
      await prisma.profile.update({
        where: { id: profileId },
        data: { shieldBalance: { increment: amountUSD } },
      });
    }

    // Award XP
    const count = await prisma.transaction.count({ where: { profileId } });
    const xpAmt = count === 1 ? XP.FIRST_TRANSACTION : XP.REGISTER_TRANSACTION;
    await addXp(profileId, xpAmt, "Movimiento registrado");
    await recalculateControlIndex(profileId);

    revalidatePath("/movimientos");
    revalidatePath("/");
    return { success: true, data: { id: transaction.id, vault } };
  } catch (error) {
    console.error("createTransaction:", error);
    return { success: false, error: "Error registrando el movimiento" };
  }
}

// ─── UPDATE TRANSACTION ───────────────────────────────────────

export async function updateTransaction(
  transactionId: string,
  data: Partial<TransactionFormData>,
  copRate = 4400
): Promise<ActionResult> {
  try {
    const existing = await prisma.transaction.findUniqueOrThrow({
      where: { id: transactionId },
    });

    const updates: Record<string, unknown> = {};
    if (data.description) updates.description = data.description.trim();
    if (data.notes !== undefined) updates.notes = data.notes?.trim() || null;
    if (data.date) updates.date = new Date(data.date);
    if (data.categoryId) updates.categoryId = data.categoryId;
    if (data.isImpulsive !== undefined) updates.isImpulsive = data.isImpulsive;

    let shieldDeltaUSD = 0;
    if (data.amount !== undefined) {
      const rawAmount = Number(data.amount);
      if (!Number.isFinite(rawAmount) || rawAmount <= 0) {
        return { success: false, error: "El monto debe ser mayor a 0" };
      }

      const currency = data.currency ?? existing.currency;

      let effectiveRate = copRate;
      if (currency === "COP") {
        const settings = await prisma.settings.findUnique({ where: { profileId: existing.profileId } });
        effectiveRate = Number(settings?.copToUsdRate ?? copRate);
      }

      const newAmountUSD = currency === "COP" ? rawAmount / effectiveRate : rawAmount;
      updates.amount = rawAmount;
      updates.currency = currency;
      updates.amountUSD = newAmountUSD;

      if (existing.type === "SAVINGS") {
        shieldDeltaUSD = newAmountUSD - Number(existing.amountUSD);
      }
    }

    await prisma.transaction.update({ where: { id: transactionId }, data: updates });

    if (shieldDeltaUSD !== 0) {
      await prisma.profile.update({
        where: { id: existing.profileId },
        data: { shieldBalance: { increment: shieldDeltaUSD } },
      });
    }

    await recalculateControlIndex(existing.profileId);

    revalidatePath("/movimientos");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("updateTransaction:", error);
    return { success: false, error: "Error actualizando el movimiento" };
  }
}

// ─── DELETE TRANSACTION ───────────────────────────────────────

export async function deleteTransaction(transactionId: string): Promise<ActionResult> {
  try {
    const tx = await prisma.transaction.findUniqueOrThrow({
      where: { id: transactionId },
      include: { allocations: true },
    });

    // Reverse objective allocations
    for (const alloc of tx.allocations) {
      await prisma.objective.update({
        where: { id: alloc.objectiveId },
        data: { currentAmount: { decrement: Number(alloc.amount) } },
      });
    }

    // Reverse Escudo Financiero contribution if this was an Ahorro Propio
    if (tx.type === "SAVINGS") {
      await prisma.profile.update({
        where: { id: tx.profileId },
        data: { shieldBalance: { decrement: Number(tx.amountUSD) } },
      });
    }

    await prisma.transaction.delete({ where: { id: transactionId } });
    await recalculateControlIndex(tx.profileId);

    revalidatePath("/movimientos");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("deleteTransaction:", error);
    return { success: false, error: "Error eliminando el movimiento" };
  }
}
