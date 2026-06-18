import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { MidasChat } from "@/components/midas/midas-chat";
import { getFinancialSnapshot } from "@/lib/financial-model";

export const metadata = { title: "MIDAS" };
export const dynamic = "force-dynamic";

export default async function MidasPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await prisma.profile.findUnique({ where: { userId: user.id } });
  if (!profile) redirect("/login");

  const [objectives, lastConversation, snapshot] = await Promise.all([
    prisma.objective.findMany({
      where: { profileId: profile.id, status: { in: ["ACTIVE", "FIXED"] } },
      orderBy: { priority: "asc" },
    }),
    prisma.midasConversation.findFirst({
      where: { profileId: profile.id },
      orderBy: { updatedAt: "desc" },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    }),
    getFinancialSnapshot(profile.id),
  ]);

  const context = {
    profileId: profile.id,
    displayName: profile.displayName,
    level: profile.level,
    xp: profile.xp,
    controlIndex: Number(profile.controlIndex),
    monthlyIncome: snapshot.monthlyIncome,
    monthlyExpenses: snapshot.monthlyExpenses,
    patrimonioTotal: snapshot.patrimonioTotal,
    liquidezDisponible: snapshot.liquidezDisponible,
    capitalEnMision: snapshot.capitalEnMision,
    escudoFinanciero: snapshot.escudoFinanciero,
    activeObjectives: objectives.map((o) => ({
      name: o.name,
      targetAmount: Number(o.targetAmount),
      currentAmount: Number(o.currentAmount),
      currency: o.currency as "USD" | "COP",
      status: o.status,
    })),
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] max-w-3xl mx-auto">
      <div className="mb-4 flex-shrink-0">
        <h1 className="text-xl font-bold text-white">MIDAS</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Market Investment & Digital Asset System
        </p>
      </div>
      <MidasChat
        context={context}
        initialConversationId={lastConversation?.id ?? null}
        initialMessages={
          lastConversation?.messages.map((m) => ({
            id: m.id,
            role: m.role as "USER" | "MIDAS",
            content: m.content,
            createdAt: m.createdAt,
          })) ?? []
        }
      />
    </div>
  );
}
