import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth, currentMonthYear } from "@/lib/utils";

/**
 * NUEVO MODELO FINANCIERO LEGACY
 * ─────────────────────────────────────────────────────────────
 * Patrimonio Total  = Liquidez Disponible + Capital en Misión + Escudo Financiero
 *
 * Reglas:
 * - INCOME e INVESTMENT suman a Patrimonio Total. Por defecto caen en
 *   Liquidez Disponible, salvo la porción asignada a una misión (vía
 *   ObjectiveAllocation), que cae en Capital en Misión.
 * - EXPENSE descuenta únicamente de Liquidez Disponible (y por tanto de
 *   Patrimonio Total — el dinero sale del sistema).
 * - SAVINGS ("Ahorro Propio") mueve dinero de Liquidez Disponible hacia
 *   Escudo Financiero. Patrimonio Total no cambia.
 * - TRANSFER no afecta ninguna métrica (igual que en el modelo anterior).
 *
 * Capital en Misión y Escudo Financiero son saldos vivos (no se recalculan
 * a partir de sumas de transacciones); Liquidez Disponible es un RESIDUO:
 *
 *   Liquidez Disponible = Patrimonio Total − Capital en Misión − Escudo Financiero
 *
 * Esto hace que asignar capital a una misión, cancelar una misión (libera
 * capital de vuelta a Liquidez automáticamente) y mover dinero al Escudo
 * Financiero, todo se refleje de forma consistente sin necesitar lógica
 * adicional ni una tabla de "USD" en las asignaciones.
 */

export interface FinancialSnapshot {
  patrimonioTotal: number;
  liquidezDisponible: number;
  capitalEnMision: number;
  escudoFinanciero: number;
  monthlyGrowthPct: number;
  /** Desglose informativo (no forma parte de las 3 cuentas, solo contexto) */
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlyInvestment: number;
}

export async function getFinancialSnapshot(profileId: string): Promise<FinancialSnapshot> {
  const [profile, settings, incomeAgg, expenseAgg, investmentAgg, missions] =
    await Promise.all([
      prisma.profile.findUniqueOrThrow({ where: { id: profileId } }),
      prisma.settings.findUnique({ where: { profileId } }),
      prisma.transaction.aggregate({
        where: { profileId, type: "INCOME" },
        _sum: { amountUSD: true },
      }),
      prisma.transaction.aggregate({
        where: { profileId, type: "EXPENSE" },
        _sum: { amountUSD: true },
      }),
      prisma.transaction.aggregate({
        where: { profileId, type: "INVESTMENT" },
        _sum: { amountUSD: true },
      }),
      // Capital en Misión: todas las misiones NO canceladas (ACTIVE, FIXED,
      // PAUSED, COMPLETED). Al cancelar una misión, su capital deja de
      // contarse aquí y por tanto se libera automáticamente a Liquidez.
      prisma.objective.findMany({
        where: { profileId, status: { not: "CANCELLED" } },
        select: { currentAmount: true, currency: true },
      }),
    ]);

  const copToUsdRate = Number(settings?.copToUsdRate ?? 4400);

  const totalIncomeUSD = Number(incomeAgg._sum.amountUSD ?? 0);
  const totalExpenseUSD = Number(expenseAgg._sum.amountUSD ?? 0);
  const totalInvestmentUSD = Number(investmentAgg._sum.amountUSD ?? 0);

  const patrimonioTotal = totalIncomeUSD + totalInvestmentUSD - totalExpenseUSD;

  const capitalEnMision = missions.reduce((sum, m) => {
    const amt = Number(m.currentAmount);
    return sum + (m.currency === "COP" ? amt / copToUsdRate : amt);
  }, 0);

  const escudoFinanciero = Number(profile.shieldBalance);

  const liquidezDisponible = patrimonioTotal - capitalEnMision - escudoFinanciero;

  const monthlyGrowthPct = await computeMonthlyGrowthPct(profileId, patrimonioTotal, copToUsdRate);

  // Monthly breakdown (informational, current calendar month only)
  const { month, year } = currentMonthYear();
  const from = startOfMonth(month, year);
  const to = endOfMonth(month, year);
  const monthlyTxs = await prisma.transaction.findMany({
    where: { profileId, date: { gte: from, lte: to } },
    select: { type: true, amountUSD: true },
  });
  const monthlyIncome = monthlyTxs.filter((t) => t.type === "INCOME").reduce((s, t) => s + Number(t.amountUSD), 0);
  const monthlyExpenses = monthlyTxs.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + Number(t.amountUSD), 0);
  const monthlyInvestment = monthlyTxs.filter((t) => t.type === "INVESTMENT").reduce((s, t) => s + Number(t.amountUSD), 0);

  return {
    patrimonioTotal,
    liquidezDisponible,
    capitalEnMision,
    escudoFinanciero,
    monthlyGrowthPct,
    monthlyIncome,
    monthlyExpenses,
    monthlyInvestment,
  };
}

/**
 * Crecimiento mensual: compara el aporte neto de patrimonio de este mes
 * (ingresos + inversión − gastos, calendario actual) contra el patrimonio
 * que existía al inicio del mes (patrimonioTotal − aporte de este mes).
 */
async function computeMonthlyGrowthPct(
  profileId: string,
  patrimonioTotal: number,
  copToUsdRate: number
): Promise<number> {
  const { month, year } = currentMonthYear();
  const from = startOfMonth(month, year);
  const to = endOfMonth(month, year);

  const [incomeAgg, expenseAgg, investmentAgg] = await Promise.all([
    prisma.transaction.aggregate({
      where: { profileId, type: "INCOME", date: { gte: from, lte: to } },
      _sum: { amountUSD: true },
    }),
    prisma.transaction.aggregate({
      where: { profileId, type: "EXPENSE", date: { gte: from, lte: to } },
      _sum: { amountUSD: true },
    }),
    prisma.transaction.aggregate({
      where: { profileId, type: "INVESTMENT", date: { gte: from, lte: to } },
      _sum: { amountUSD: true },
    }),
  ]);

  const thisMonthNet =
    Number(incomeAgg._sum.amountUSD ?? 0) +
    Number(investmentAgg._sum.amountUSD ?? 0) -
    Number(expenseAgg._sum.amountUSD ?? 0);

  const baseline = patrimonioTotal - thisMonthNet;

  if (baseline > 0) return (thisMonthNet / baseline) * 100;
  if (thisMonthNet > 0) return 100;
  if (thisMonthNet < 0) return -100;
  return 0;
}

/**
 * Migración silenciosa para usuarios existentes: si el perfil todavía
 * tiene la antigua misión "Escudo Financiero" (antes era un objetivo más),
 * su capital se transfiere una sola vez a profile.shieldBalance y la
 * misión se archiva (CANCELLED) para que deje de comportarse como misión.
 * Idempotente: si no existe o ya fue migrada, no hace nada.
 */
export async function migrateLegacyShieldObjective(profileId: string): Promise<void> {
  const legacy = await prisma.objective.findFirst({
    where: {
      profileId,
      name: "Escudo Financiero",
      status: { not: "CANCELLED" },
    },
  });

  if (!legacy) return;

  const settings = await prisma.settings.findUnique({ where: { profileId } });
  const copToUsdRate = Number(settings?.copToUsdRate ?? 4400);
  const amount = Number(legacy.currentAmount);
  const amountUSD = legacy.currency === "COP" ? amount / copToUsdRate : amount;

  await prisma.$transaction([
    prisma.profile.update({
      where: { id: profileId },
      data: { shieldBalance: { increment: amountUSD } },
    }),
    prisma.objective.update({
      where: { id: legacy.id },
      data: { status: "CANCELLED", cancelledAt: new Date() },
    }),
    prisma.strategicArchive.upsert({
      where: { objectiveId: legacy.id },
      update: {
        cancelledAt: new Date(),
        reason: "Migrado al nuevo Escudo Financiero como reserva estratégica.",
        fundsRecovered: amount,
        redistributedTo: "ESCUDO_FINANCIERO",
      },
      create: {
        objectiveId: legacy.id,
        cancelledAt: new Date(),
        reason: "Migrado al nuevo Escudo Financiero como reserva estratégica.",
        fundsRecovered: amount,
        redistributedTo: "ESCUDO_FINANCIERO",
      },
    }),
  ]);
}
