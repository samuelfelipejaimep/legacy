import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth, currentMonthYear } from "@/lib/utils";
import { getFinancialSnapshot, migrateLegacyShieldObjective } from "@/lib/financial-model";
import { ControlIndexWidget } from "@/components/dashboard/control-index-widget";
import { FinancialStrengthWidget } from "@/components/dashboard/financial-strength-widget";
import { ActiveMissionsWidget } from "@/components/dashboard/active-missions-widget";
import { MonthlySummaryWidget } from "@/components/dashboard/monthly-summary-widget";
import { MidasRecommendationWidget } from "@/components/dashboard/midas-recommendation-widget";

export const dynamic = "force-dynamic";

export default async function ControlCenterPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await prisma.profile.findUnique({ where: { userId: user.id } });
  if (!profile) redirect("/login");

  // Migración silenciosa, idempotente: si el perfil aún tiene la antigua
  // misión "Escudo Financiero", su capital pasa una sola vez al nuevo
  // saldo de Escudo Financiero y la misión se archiva.
  await migrateLegacyShieldObjective(profile.id);

  const { month, year } = currentMonthYear();
  const from = startOfMonth(month, year);
  const to = endOfMonth(month, year);

  const [transactions, objectives, snapshot] = await Promise.all([
    prisma.transaction.findMany({
      where: { profileId: profile.id, date: { gte: from, lte: to } },
      include: { category: true },
      orderBy: { date: "desc" },
    }),
    prisma.objective.findMany({
      where: { profileId: profile.id, status: { in: ["ACTIVE", "FIXED"] } },
      orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
    }),
    getFinancialSnapshot(profile.id),
  ]);

  const income = transactions
    .filter((t) => t.type === "INCOME")
    .reduce((s, t) => s + Number(t.amountUSD), 0);
  const expenses = transactions
    .filter((t) => t.type === "EXPENSE")
    .reduce((s, t) => s + Number(t.amountUSD), 0);
  const investments = transactions
    .filter((t) => t.type === "INVESTMENT")
    .reduce((s, t) => s + Number(t.amountUSD), 0);
  const saved = Math.max(income - expenses - investments, 0);

  return (
    <div className="space-y-5 max-w-[1400px]">
      {/* Page title */}
      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Centro de Control</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Organización. Claridad. Progreso.</p>
        </div>
      </div>

      {/* Row 1 — Index + Financial Strength */}
      <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-4">
        <ControlIndexWidget
          score={Number(profile.controlIndex)}
          level={profile.level}
          xp={profile.xp}
        />
        <FinancialStrengthWidget
          patrimonioTotal={snapshot.patrimonioTotal}
          liquidezDisponible={snapshot.liquidezDisponible}
          capitalEnMision={snapshot.capitalEnMision}
          escudoFinanciero={snapshot.escudoFinanciero}
          monthlyGrowthPct={snapshot.monthlyGrowthPct}
          monthlyIncome={income}
          monthlyExpenses={expenses}
          monthlyInvestment={investments}
        />
      </div>

      {/* Row 2 — Missions + Monthly Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ActiveMissionsWidget objectives={objectives} />
        <MonthlySummaryWidget
          income={income}
          expenses={expenses}
          investments={investments}
          saved={saved}
          transactionCount={transactions.length}
          month={month}
          year={year}
        />
      </div>

      {/* Row 3 — MIDAS */}
      <MidasRecommendationWidget
        profileId={profile.id}
        income={income}
        expenses={expenses}
        objectives={objectives}
      />
    </div>
  );
}
