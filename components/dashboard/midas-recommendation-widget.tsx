"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Objective } from "@/lib/types";
import { useCurrency } from "@/hooks/use-currency";

interface MidasRecommendationWidgetProps {
  profileId: string;
  income: number;
  expenses: number;
  objectives: Objective[];
}

export function MidasRecommendationWidget({
  profileId, income, expenses, objectives,
}: MidasRecommendationWidgetProps) {
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { format } = useCurrency();

  useEffect(() => {
    // Generate a context-aware insight without API call for dashboard widget
    const generateInsight = () => {
      const saved = income - expenses;
      const savingsRate = income > 0 ? (saved / income) * 100 : 0;
      const activeObjectives = objectives.filter((o) => o.status === "ACTIVE");
      const mostProgress = activeObjectives.reduce<Objective | null>((best, obj) => {
        const pct = Number(obj.currentAmount) / Number(obj.targetAmount);
        const bestPct = best ? Number(best.currentAmount) / Number(best.targetAmount) : -1;
        return pct > bestPct ? obj : best;
      }, null);

      if (income === 0) {
        return "Registra tus ingresos de este mes para que pueda analizar tu situación y darte recomendaciones precisas.";
      }
      if (savingsRate < 10) {
        return `Tus gastos están consumiendo más del ${(100 - savingsRate).toFixed(0)}% de tus ingresos. Revisemos juntos dónde están los excesos para liberar capital.`;
      }
      if (mostProgress) {
        const pct = ((Number(mostProgress.currentAmount) / Number(mostProgress.targetAmount)) * 100).toFixed(0);
        return `"${mostProgress.name}" lleva ${pct}% de avance. ${Number(pct) > 50 ? "¡Estás en la recta final! Mantén el ritmo." : "Consistencia es la clave. Cada aporte cuenta."}`;
      }
      if (savingsRate >= 20) {
        return `Tasa de ahorro del ${savingsRate.toFixed(0)}% — eso es disciplina real. Asegúrate de que ese capital esté trabajando en tus objetivos.`;
      }
      return `Con ${format(saved)} disponibles este mes, hay oportunidad de fortalecer tu posición. ¿Dónde quieres atacar primero?`;
    };

    const timer = setTimeout(() => {
      setInsight(generateInsight());
      setLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, [income, expenses, objectives]);

  return (
    <Card className="p-6 border-accent/20 bg-gradient-to-r from-accent/5 to-transparent relative overflow-hidden">
      {/* Subtle accent glow */}
      <div className="absolute top-0 right-0 w-48 h-full bg-gradient-to-l from-accent/5 to-transparent pointer-events-none" />

      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* MIDAS icon */}
          <div className="w-9 h-9 rounded-xl bg-accent/15 border border-accent/25 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4 text-accent" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-black text-accent tracking-widest">MIDAS</span>
              <span className="text-[9px] text-muted-foreground uppercase tracking-wider">recomendación</span>
            </div>

            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2"
                >
                  <Loader2 className="w-3 h-3 text-accent animate-spin" />
                  <span className="text-sm text-muted-foreground">Analizando tu situación...</span>
                </motion.div>
              ) : (
                <motion.p
                  key="insight"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="text-sm text-white/90 leading-relaxed"
                >
                  {insight}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* CTA */}
        <Link href="/midas" className="flex-shrink-0">
          <Button variant="legacy-outline" size="sm" className="gap-1.5">
            Hablar con MIDAS
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </Link>
      </div>
    </Card>
  );
}
