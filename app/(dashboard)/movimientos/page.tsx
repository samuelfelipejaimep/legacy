import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, ArrowUpRight, ArrowDownRight, TrendingUp, ArrowLeftRight, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CurrencyAmount } from "@/components/common/currency-amount";
import { TransactionActions } from "@/components/transactions/transaction-actions";
import { cn } from "@/lib/utils";

export const metadata = { title: "Movimientos" };
export const dynamic = "force-dynamic";

const TYPE_CONFIG = {
  INCOME:     { label: "Ingreso",       icon: ArrowUpRight,   color: "text-emerald-400 bg-emerald-500/10" },
  EXPENSE:    { label: "Gasto",         icon: ArrowDownRight, color: "text-accent bg-accent/10" },
  INVESTMENT: { label: "Inversión",     icon: TrendingUp,     color: "text-blue-400 bg-blue-500/10" },
  TRANSFER:   { label: "Transferencia", icon: ArrowLeftRight, color: "text-yellow-400 bg-yellow-500/10" },
  SAVINGS:    { label: "Ahorro Propio", icon: ShieldCheck,    color: "text-cyan-400 bg-cyan-500/10" },
};

export default async function MovimientosPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await prisma.profile.findUnique({ where: { userId: user.id } });
  if (!profile) redirect("/login");

  const transactions = await prisma.transaction.findMany({
    where: { profileId: profile.id },
    include: { category: true },
    orderBy: { date: "desc" },
    take: 50,
  });

  const grouped = transactions.reduce<Record<string, typeof transactions>>((acc, t) => {
    const dateKey = format(new Date(t.date), "yyyy-MM-dd");
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(t);
    return acc;
  }, {});

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Movimientos</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {transactions.length} registro{transactions.length !== 1 ? "s" : ""} recientes
          </p>
        </div>
        <Link href="/movimientos/nuevo">
          <Button variant="legacy" size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            Registrar
          </Button>
        </Link>
      </div>

      {transactions.length === 0 ? (
        <Card className="p-10 flex flex-col items-center text-center">
          <ArrowLeftRight className="w-10 h-10 text-muted-foreground/30 mb-3" />
          <p className="text-white font-medium">Sin movimientos registrados</p>
          <p className="text-sm text-muted-foreground mt-1">Registra tu primer ingreso o gasto.</p>
          <Link href="/movimientos/nuevo" className="mt-4">
            <Button variant="legacy-outline" size="sm">Registrar movimiento</Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-5">
          {Object.entries(grouped).map(([dateKey, txs]) => {
            const dateLabel = format(new Date(dateKey), "EEEE, d 'de' MMMM", { locale: es });
            const dayTotal = txs.reduce((s, t) => {
              if (t.type === "INCOME") return s + Number(t.amountUSD);
              if (t.type === "EXPENSE") return s - Number(t.amountUSD);
              return s;
            }, 0);

            return (
              <div key={dateKey}>
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-xs text-muted-foreground capitalize">{dateLabel}</span>
                  <span className={cn("text-xs font-semibold tabular-nums",
                    dayTotal >= 0 ? "text-emerald-400" : "text-accent"
                  )}>
                    {dayTotal >= 0 ? "+" : ""}<CurrencyAmount amount={Math.abs(dayTotal)} />
                  </span>
                </div>
                <div className="space-y-1.5">
                  {txs.map((t) => {
                    const cfg = TYPE_CONFIG[t.type as keyof typeof TYPE_CONFIG];
                    const Icon = cfg.icon;
                    return (
                      <Card key={t.id} className="p-4 hover:border-border/80 transition-colors group">
                        <div className="flex items-center gap-3">
                          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", cfg.color)}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{t.description}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-muted-foreground">{t.category.icon} {t.category.name}</span>
                              {t.isImpulsive && (
                                <Badge variant="destructive" className="text-[9px] py-0 px-1">Impulsivo</Badge>
                              )}
                              {t.vaultFlag && (
                                <Badge variant="warning" className="text-[9px] py-0 px-1">🛡 Caja Fuerte</Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <p className={cn("text-sm font-bold tabular-nums",
                              t.type === "INCOME" ? "text-emerald-400" : t.type === "EXPENSE" ? "text-white" : "text-blue-400"
                            )}>
                              {t.type === "INCOME" ? "+" : t.type === "EXPENSE" ? "-" : ""}
                              <CurrencyAmount amount={Number(t.amount)} currency={t.currency as "USD" | "COP"} />
                            </p>
                            <TransactionActions transactionId={t.id} description={t.description} />
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
