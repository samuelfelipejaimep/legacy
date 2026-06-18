import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { TransactionForm } from "@/components/transactions/transaction-form";
import { getFinancialSnapshot } from "@/lib/financial-model";

export const metadata = { title: "Nuevo Movimiento" };
export const dynamic = "force-dynamic";

export default async function NuevoMovimientoPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await prisma.profile.findUnique({ where: { userId: user.id } });
  if (!profile) redirect("/login");

  const [categories, objectives, snapshot] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.objective.findMany({
      where: { profileId: profile.id, status: { in: ["ACTIVE", "FIXED"] } },
      orderBy: { priority: "asc" },
    }),
    getFinancialSnapshot(profile.id),
  ]);

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-xl font-bold text-white">Registrar Movimiento</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Registra un ingreso, gasto, inversión, transferencia o ahorro propio.
        </p>
      </div>

      <TransactionForm
        profileId={profile.id}
        categories={categories}
        objectives={objectives}
        currentLiquidityUSD={snapshot.liquidezDisponible}
      />
    </div>
  );
}
