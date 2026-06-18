import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { MonthlyReviewForm } from "@/components/review/monthly-review-form";
import { Card } from "@/components/ui/card";
import { CheckCircle2, CalendarCheck } from "lucide-react";
import { monthName, currentMonthYear, startOfMonth, endOfMonth } from "@/lib/utils";

export const metadata = { title: "Revisión Mensual" };
export const dynamic = "force-dynamic";

export default async function RevisionPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await prisma.profile.findUnique({ where: { userId: user.id } });
  if (!profile) redirect("/login");

  const { month, year } = currentMonthYear();
  const from = startOfMonth(month, year);
  const to = endOfMonth(month, year);

  const [existingReview, transactions] = await Promise.all([
    prisma.monthlyReview.findUnique({
      where: { profileId_month_year: { profileId: profile.id, month, year } },
    }),
    prisma.transaction.findMany({
      where: { profileId: profile.id, date: { gte: from, lte: to } },
    }),
  ]);

  const income = transactions.filter((t) => t.type === "INCOME").reduce((s, t) => s + Number(t.amountUSD), 0);
  const expenses = transactions.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + Number(t.amountUSD), 0);
  const invested = transactions.filter((t) => t.type === "INVESTMENT").reduce((s, t) => s + Number(t.amountUSD), 0);

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-white">Revisión Mensual</h1>
        <p className="text-muted-foreground text-sm mt-0.5 capitalize">
          {monthName(month)} {year}
        </p>
      </div>

      {existingReview?.completedAt ? (
        <Card className="p-8 flex flex-col items-center text-center border-emerald-800/30 bg-emerald-950/10">
          <CheckCircle2 className="w-10 h-10 text-emerald-400 mb-3" />
          <p className="text-white font-semibold">Revisión completada</p>
          <p className="text-sm text-muted-foreground mt-1">
            Ya completaste la revisión de {monthName(month)}. Vuelve el próximo mes.
          </p>
          {existingReview.midasSummary && (
            <div className="mt-4 p-4 rounded-lg bg-accent/5 border border-accent/20 text-left w-full">
              <p className="text-xs text-accent font-semibold mb-1 uppercase tracking-widest">Resumen MIDAS</p>
              <p className="text-sm text-white/80">{existingReview.midasSummary}</p>
            </div>
          )}
        </Card>
      ) : (
        <MonthlyReviewForm
          profileId={profile.id}
          month={month}
          year={year}
          autoIncome={income}
          autoExpenses={expenses}
          autoInvested={invested}
          existingReviewId={existingReview?.id ?? null}
        />
      )}
    </div>
  );
}
