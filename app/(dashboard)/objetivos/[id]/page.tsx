import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

import { Button } from "@/components/ui/button";
import { ObjectiveActions } from "@/components/objectives/objective-actions";
import { ObjectiveStatusBadge } from "@/components/objectives/objective-status-badge";
import { CurrencyAmount } from "@/components/common/currency-amount";
import { ChevronLeft, Calendar, Target, Trophy, Archive } from "lucide-react";
import { percentage } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const obj = await prisma.objective.findUnique({ where: { id } });
  return { title: obj?.name ?? "Objetivo" };
}

export default async function ObjectiveDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await prisma.profile.findUnique({ where: { userId: user.id } });
  if (!profile) redirect("/login");

  const objective = await prisma.objective.findUnique({
    where: { id },
    include: {
      allocations: {
        include: { transaction: { include: { category: true } } },
        orderBy: { allocatedAt: "desc" },
        take: 20,
      },
      hallOfFame: true,
      archive: true,
    },
  });

  if (!objective || objective.profileId !== profile.id) notFound();

  const pct = percentage(Number(objective.currentAmount), Number(objective.targetAmount));
  const remaining = Math.max(Number(objective.targetAmount) - Number(objective.currentAmount), 0);
  const currency = objective.currency as "USD" | "COP";
  const isComplete = objective.status === "COMPLETED";
  const isCancelled = objective.status === "CANCELLED";

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Back */}
      <Link
        href="/objetivos"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-white transition-colors"
      >
        <ChevronLeft className="w-4 h-4" /> Objetivos
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 mb-1 flex-wrap">
            <h1 className="text-2xl font-bold text-white">{objective.name}</h1>
            <ObjectiveStatusBadge status={objective.status} />
          </div>
          {objective.subtitle && (
            <p className="text-muted-foreground">{objective.subtitle}</p>
          )}
        </div>
        {!isComplete && !isCancelled && (
          <Link href={`/objetivos/${objective.id}/editar`}>
            <Button variant="outline" size="sm">Editar</Button>
          </Link>
        )}
      </div>

      {/* Progress card */}
      <Card className="p-6">
        <div className="flex items-baseline justify-between mb-4">
          <div>
            <p className="text-4xl font-black text-white tabular-nums">{pct.toFixed(1)}%</p>
            <p className="text-sm text-muted-foreground mt-0.5">completado</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Meta</p>
            <p className="text-lg font-bold text-white tabular-nums">
              <CurrencyAmount amount={Number(objective.targetAmount)} currency={currency} />
            </p>
          </div>
        </div>

        <Progress value={pct} className="h-2.5 mb-4" />

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Acumulado</p>
            <p className="font-bold text-white tabular-nums">
              <CurrencyAmount amount={Number(objective.currentAmount)} currency={currency} />
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Restante</p>
            <p className="font-bold text-white tabular-nums">
              <CurrencyAmount amount={remaining} currency={currency} />
            </p>
          </div>
          {objective.targetDate && (
            <div>
              <p className="text-xs text-muted-foreground mb-0.5 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Fecha objetivo
              </p>
              <p className="font-bold text-white">
                {format(new Date(objective.targetDate), "d MMM yyyy", { locale: es })}
              </p>
            </div>
          )}
          <div>
            <p className="text-xs text-muted-foreground mb-0.5 flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Fecha de creación
            </p>
            <p className="font-bold text-white">
              {format(new Date(objective.createdAt), "d MMM yyyy", { locale: es })}
            </p>
          </div>
        </div>
      </Card>

      {/* Actions */}
      <ObjectiveActions objective={objective as any} profileId={profile.id} />

      {/* Hall of Fame entry */}
      {isComplete && objective.hallOfFame && (
        <Card className="p-5 border-yellow-800/30 bg-yellow-950/10">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="w-4 h-4 text-yellow-400" />
            <p className="text-sm font-bold text-yellow-400 uppercase tracking-widest">Hall of Fame</p>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Completado</span>
              <span className="text-white">
                {format(new Date(objective.hallOfFame.completedAt), "d 'de' MMMM yyyy", { locale: es })}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Monto final</span>
              <span className="text-white font-bold tabular-nums">
                <CurrencyAmount amount={Number(objective.hallOfFame.finalAmount)} currency={currency} />
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">XP ganado</span>
              <span className="text-accent font-bold">+{objective.hallOfFame.xpEarned.toLocaleString()} XP</span>
            </div>
            {objective.hallOfFame.emotion && (
              <p className="text-2xl mt-1">{objective.hallOfFame.emotion}</p>
            )}
            {objective.hallOfFame.notes && (
              <p className="text-sm text-white/80 mt-2 pt-2 border-t border-yellow-800/30">
                {objective.hallOfFame.notes}
              </p>
            )}
          </div>
        </Card>
      )}

      {/* Strategic Archive entry */}
      {isCancelled && objective.archive && (
        <Card className="p-5 border-border/50 opacity-80">
          <div className="flex items-center gap-2 mb-3">
            <Archive className="w-4 h-4 text-muted-foreground" />
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Archivo Estratégico</p>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Cancelado</span>
              <span className="text-white">
                {format(new Date(objective.archive.cancelledAt), "d 'de' MMMM yyyy", { locale: es })}
              </span>
            </div>
            {objective.archive.fundsRecovered > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Fondos recuperados</span>
                <span className="text-white tabular-nums">
                  <CurrencyAmount amount={Number(objective.archive.fundsRecovered)} currency={currency} />
                </span>
              </div>
            )}
            {objective.archive.redistributedTo && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Reasignado a</span>
                <span className="text-white">{objective.archive.redistributedTo}</span>
              </div>
            )}
            {objective.archive.reason && (
              <p className="text-sm text-white/70 mt-2 pt-2 border-t border-border">
                {objective.archive.reason}
              </p>
            )}
          </div>
        </Card>
      )}

      {/* Allocation history */}
      {objective.allocations.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-white uppercase tracking-widest mb-3">
            Historial de aportes
          </h2>
          <div className="space-y-2">
            {objective.allocations.map((alloc) => (
              <Card key={alloc.id} className="px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-sm text-white truncate">
                      {alloc.transaction.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {alloc.transaction.category.icon} {alloc.transaction.category.name} ·{" "}
                      {format(new Date(alloc.allocatedAt), "d MMM", { locale: es })}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-emerald-400 tabular-nums flex-shrink-0 ml-3">
                    +<CurrencyAmount amount={Number(alloc.amount)} currency={alloc.currency as "USD" | "COP"} />
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* No allocations */}
      {objective.allocations.length === 0 && !isComplete && !isCancelled && (
        <Card className="p-6 text-center">
          <Target className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            Aún no hay aportes. Asigna fondos al registrar un movimiento o usa "Añadir fondos".
          </p>
        </Card>
      )}
    </div>
  );
}
