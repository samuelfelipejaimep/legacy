import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StrategicReset } from "@/components/profile/strategic-reset";
import { ExchangeRateForm } from "@/components/profile/exchange-rate-form";
import { Progress } from "@/components/ui/progress";
import { LevelBadge } from "@/components/common/level-badge";
import { LogoutButton } from "@/components/common/logout-button";
import { getXpForLevel, getXpForNextLevel, getLevelName, LEVELS } from "@/lib/constants";
import { percentage, monthName } from "@/lib/utils";
import { Trophy, Target, ArrowLeftRight, CalendarCheck, Star } from "lucide-react";

export const metadata = { title: "Perfil" };
export const dynamic = "force-dynamic";

export default async function PerfilPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await prisma.profile.findUnique({
    where: { userId: user.id },
    include: { settings: true, levelHistory: { orderBy: { achievedAt: "desc" }, take: 5 } },
  });
  if (!profile) redirect("/login");

  const [transactionCount, objectivesCompleted, reviewsCompleted] = await Promise.all([
    prisma.transaction.count({ where: { profileId: profile.id } }),
    prisma.objective.count({ where: { profileId: profile.id, status: "COMPLETED" } }),
    prisma.monthlyReview.count({ where: { profileId: profile.id, completedAt: { not: null } } }),
  ]);

  const xpForCurrent = getXpForLevel(profile.level);
  const xpForNext = getXpForNextLevel(profile.level);
  const xpProgress = percentage(profile.xp - xpForCurrent, xpForNext - xpForCurrent);
  const xpToNext = Math.max(xpForNext - profile.xp, 0);

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-xl font-bold text-white">Perfil</h1>

      {/* Identity card */}
      <Card className="p-6">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-accent/15 border border-accent/25 flex items-center justify-center">
              <span className="text-accent font-black text-xl">{profile.displayName[0].toUpperCase()}</span>
            </div>
            <div>
              <p className="text-lg font-bold text-white">{profile.displayName}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <LevelBadge level={profile.level} size="lg" />
        </div>

        {/* XP bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">{profile.xp.toLocaleString()} XP</span>
            <span className="text-muted-foreground/60">
              {xpToNext > 0 ? `${xpToNext.toLocaleString()} XP para nivel ${profile.level + 1}` : "Nivel máximo"}
            </span>
          </div>
          <Progress value={xpProgress} className="h-2" />
        </div>
      </Card>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Movimientos", value: transactionCount, icon: ArrowLeftRight, color: "text-blue-400" },
          { label: "Objetivos", value: objectivesCompleted, icon: Target, color: "text-accent" },
          { label: "Revisiones", value: reviewsCompleted, icon: CalendarCheck, color: "text-emerald-400" },
          { label: "Índice", value: `${Math.round(Number(profile.controlIndex))}/100`, icon: Star, color: "text-yellow-400" },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="p-4 text-center">
              <Icon className={`w-5 h-5 mx-auto mb-2 ${stat.color}`} />
              <p className="text-xl font-black text-white tabular-nums">{stat.value}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{stat.label}</p>
            </Card>
          );
        })}
      </div>

      {/* Level history */}
      {profile.levelHistory.length > 0 && (
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-4 h-4 text-yellow-400" />
            <p className="text-sm font-bold text-white uppercase tracking-widest">Historial de Niveles</p>
          </div>
          <div className="space-y-2">
            {profile.levelHistory.map((h) => (
              <div key={h.id} className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-sm">Nivel {h.fromLevel}</span>
                  <span className="text-muted-foreground">→</span>
                  <span className="text-white font-semibold text-sm">Nivel {h.toLevel}</span>
                  <span className="text-xs text-muted-foreground">— {getLevelName(h.toLevel)}</span>
                </div>
                <span className="text-xs text-muted-foreground font-mono">
                  {new Date(h.achievedAt).toLocaleDateString("es")}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Settings */}
      <Card className="p-5">
        <p className="text-sm font-bold text-white uppercase tracking-widest mb-4">Configuración</p>
        <div className="space-y-4">
          <ExchangeRateForm
            profileId={profile.id}
            currentRate={Number(profile.settings?.copToUsdRate ?? 4400)}
          />
          <div className="flex items-center justify-between py-2 border-t border-border/50 pt-3">
            <span className="text-sm text-muted-foreground">Moneda preferida</span>
            <Badge variant="legacy">{profile.settings?.preferredCurrency ?? "USD"}</Badge>
          </div>
        </div>
      </Card>

      <LogoutButton />

      {/* Zona de peligro */}
      <div className="pt-2">
        <StrategicReset />
      </div>
    </div>
  );
}
