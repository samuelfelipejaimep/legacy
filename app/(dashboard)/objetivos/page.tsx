import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trophy, Archive, Target, Calendar } from "lucide-react";
import { percentage } from "@/lib/utils";
import { OBJECTIVE_STATUS_LABELS } from "@/lib/constants";
import { ObjectiveStatusBadge } from "@/components/objectives/objective-status-badge";
import { CurrencyAmount } from "@/components/common/currency-amount";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export const metadata = { title: "Objetivos" };
export const dynamic = "force-dynamic";

export default async function ObjetivosPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await prisma.profile.findUnique({ where: { userId: user.id } });
  if (!profile) redirect("/login");

  const [active, completed, hallOfFame, archive] = await Promise.all([
    prisma.objective.findMany({
      where: { profileId: profile.id, status: { in: ["ACTIVE", "FIXED", "PAUSED"] } },
      orderBy: [{ status: "asc" }, { priority: "asc" }],
    }),
    prisma.objective.findMany({
      where: { profileId: profile.id, status: "COMPLETED" },
      include: { hallOfFame: true },
      orderBy: { completedAt: "desc" },
    }),
    prisma.hallOfFame.findMany({
      where: { objective: { profileId: profile.id } },
      include: { objective: true },
      orderBy: { completedAt: "desc" },
    }),
    prisma.strategicArchive.findMany({
      where: { objective: { profileId: profile.id } },
      include: { objective: true },
      orderBy: { cancelledAt: "desc" },
    }),
  ]);

  return (
    <div className="space-y-7 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Objetivos</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {active.length} activo{active.length !== 1 ? "s" : ""} · {completed.length} completado{completed.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link href="/objetivos/nuevo">
          <Button variant="legacy" size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            Nueva misión
          </Button>
        </Link>
      </div>

      {/* Active objectives */}
      {active.length === 0 ? (
        <Card className="p-10 flex flex-col items-center text-center">
          <Target className="w-10 h-10 text-muted-foreground/30 mb-3" />
          <p className="text-white font-medium">Sin misiones activas</p>
          <p className="text-sm text-muted-foreground mt-1">Crea tu primera misión para empezar a construir tu legado.</p>
          <Link href="/objetivos/nuevo" className="mt-4">
            <Button variant="legacy-outline" size="sm">Crear misión</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid gap-3">
          {active.map((obj) => {
            const pct = percentage(Number(obj.currentAmount), Number(obj.targetAmount));
            return (
              <Link key={obj.id} href={`/objetivos/${obj.id}`}>
                <Card className="p-5 hover:border-accent/30 transition-colors cursor-pointer group">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-bold text-white group-hover:text-accent transition-colors truncate">
                          {obj.name}
                        </h3>
                        <ObjectiveStatusBadge status={obj.status} />
                      </div>
                      {obj.subtitle && (
                        <p className="text-sm text-muted-foreground truncate">{obj.subtitle}</p>
                      )}
                    </div>
                    <span className="text-2xl font-black text-white tabular-nums flex-shrink-0">
                      {pct.toFixed(0)}%
                    </span>
                  </div>
                  <Progress value={pct} className="h-1.5 mb-3" />
                  <div className="flex justify-between text-xs text-muted-foreground tabular-nums">
                    <CurrencyAmount amount={Number(obj.currentAmount)} currency={obj.currency as "USD"|"COP"} />
                    <span>Meta: <CurrencyAmount amount={Number(obj.targetAmount)} currency={obj.currency as "USD"|"COP"} /></span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground/50 mt-2">
                    <Calendar className="w-3 h-3" />
                    Creada el {format(new Date(obj.createdAt), "d MMM yyyy", { locale: es })}
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {/* Hall of Fame */}
      {hallOfFame.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="w-4 h-4 text-yellow-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-widest">Hall of Fame</h2>
          </div>
          <div className="grid gap-2">
            {hallOfFame.map((h) => (
              <Card key={h.id} className="p-4 border-yellow-800/30 bg-yellow-950/10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-white">{h.objective.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Completado · +{h.xpEarned.toLocaleString()} XP
                    </p>
                  </div>
                  <CurrencyAmount
                    amount={Number(h.finalAmount)}
                    currency={h.objective.currency as "USD"|"COP"}
                    className="text-yellow-400 font-bold"
                  />
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Strategic Archive */}
      {archive.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Archive className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Archivo Estratégico</h2>
          </div>
          <div className="grid gap-2">
            {archive.map((a) => (
              <Card key={a.id} className="p-4 opacity-60">
                <p className="font-semibold text-white">{a.objective.name}</p>
                {a.reason && <p className="text-xs text-muted-foreground mt-0.5">{a.reason}</p>}
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
