import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { ProfileSync } from "@/components/common/profile-sync";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  let profile = await prisma.profile.findUnique({
    where: { userId: user.id },
    include: { settings: true },
  });

  if (!profile) {
    profile = await prisma.profile.create({
      data: {
        userId: user.id,
        displayName: user.email?.split("@")[0] ?? "Usuario",
        settings: { create: {} },
      },
      include: { settings: true },
    });

    const { Currency } = await import("@prisma/client");

    await prisma.objective.createMany({
      data: [
        { profileId: profile.id, name: "MX-5 Protocol",        subtitle: "Mazda Miata MX-5 2026",                          targetAmount: 175_000_000, currency: Currency.COP, priority: 1, xpReward: 5000 },
        { profileId: profile.id, name: "Upgrade Profesional",   subtitle: "MacBook Air para trabajo y productividad",       targetAmount: 1700,        currency: Currency.USD, priority: 2, xpReward: 500  },
        { profileId: profile.id, name: "Misión Caribe",         subtitle: "Crucero Royal Caribbean para mis padres",        targetAmount: 4000,        currency: Currency.USD, priority: 3, xpReward: 1000 },
        { profileId: profile.id, name: "Deuda de Honor",        subtitle: "Pago completo de deuda familiar",                targetAmount: 2_000_000,   currency: Currency.COP, priority: 4, xpReward: 2000 },
        { profileId: profile.id, name: "Capital de Ataque",     subtitle: "Reinversión para crecimiento del negocio",       targetAmount: 10_000,      currency: Currency.USD, priority: 5, xpReward: 3000 },
      ],
    });
  }

  // Rate is read from DB only — user sets it manually in Perfil.
  // No automatic API overwrite: prevents stale/incorrect API data from
  // silently corrupting the stored rate on every page load.
  const copToUsdRate = Number(profile.settings?.copToUsdRate ?? 4400);

  return (
    <div className="min-h-screen bg-background">
      <div className="hidden md:block">
        <Sidebar
          level={profile.level}
          xp={profile.xp}
          displayName={profile.displayName}
        />
      </div>

      <div className="md:ml-[240px] flex flex-col min-h-screen">
        <Header profile={profile} />
        <main className="flex-1 p-5 md:p-6 pb-24 md:pb-6">{children}</main>
      </div>

      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
        <MobileNav />
      </div>

      <ProfileSync
        profileId={profile.id}
        displayName={profile.displayName}
        level={profile.level}
        xp={profile.xp}
        controlIndex={Number(profile.controlIndex)}
        copToUsdRate={copToUsdRate}
      />
    </div>
  );
}
