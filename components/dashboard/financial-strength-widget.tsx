"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, Crown, Zap, Target, Shield } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useCurrency } from "@/hooks/use-currency";
import { cn } from "@/lib/utils";

interface FinancialStrengthWidgetProps {
  patrimonioTotal: number;     // USD, todo el historial
  liquidezDisponible: number;  // USD
  capitalEnMision: number;     // USD
  escudoFinanciero: number;    // USD
  monthlyGrowthPct: number;
  // Desglose informativo del mes (para la barra inferior, sin cambios de cálculo)
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlyInvestment: number;
}

interface MetricProps {
  icon: React.ReactNode;
  label: string;
  sub?: string;
  value: number;
  trend?: "up" | "down" | "neutral";
  highlight?: boolean;
}

function Metric({ icon, label, sub, value, trend, highlight }: MetricProps) {
  const { format } = useCurrency();

  return (
    <div className="space-y-0.5">
      <div className="flex items-center gap-1.5">
        {icon}
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{label}</p>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className={cn(
          "font-bold tabular-nums",
          highlight ? "text-white text-2xl" : "text-white/90 text-lg"
        )}>
          {format(value)}
        </span>
        {trend && (
          <span className={cn("text-xs",
            trend === "up" ? "text-emerald-400" : trend === "down" ? "text-accent" : "text-muted-foreground"
          )}>
            {trend === "up" ? <TrendingUp className="w-3 h-3 inline" /> :
             trend === "down" ? <TrendingDown className="w-3 h-3 inline" /> :
             <Minus className="w-3 h-3 inline" />}
          </span>
        )}
      </div>
      {sub && <p className="text-[10px] text-muted-foreground/60">{sub}</p>}
    </div>
  );
}

export function FinancialStrengthWidget({
  patrimonioTotal, liquidezDisponible, capitalEnMision, escudoFinanciero,
  monthlyGrowthPct, monthlyIncome, monthlyExpenses, monthlyInvestment,
}: FinancialStrengthWidgetProps) {
  return (
    <Card className="p-6 h-full relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Crown className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
            Fortaleza Financiera
          </span>
        </div>
        <div className={cn(
          "text-xs font-medium px-2 py-0.5 rounded-md flex items-center gap-1",
          monthlyGrowthPct >= 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-accent/10 text-accent"
        )}>
          {monthlyGrowthPct >= 0 ? "+" : ""}{monthlyGrowthPct.toFixed(1)}% este mes
        </div>
      </div>

      {/* Patrimonio Total — featured metric */}
      <div className="mb-5">
        <Metric
          icon={<Crown className="w-3.5 h-3.5 text-accent" />}
          label="Patrimonio Total"
          sub="todo tu dinero, en cualquier cuenta"
          value={patrimonioTotal}
          trend={monthlyGrowthPct > 0 ? "up" : monthlyGrowthPct < 0 ? "down" : "neutral"}
          highlight
        />
      </div>

      {/* 3 buckets */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-5 pb-5 border-b border-border/50">
        <Metric
          icon={<Zap className="w-3.5 h-3.5 text-emerald-400" />}
          label="Liquidez Disponible"
          sub="para gastar sin afectar misiones"
          value={liquidezDisponible}
          trend={liquidezDisponible >= 0 ? "up" : "down"}
        />
        <Metric
          icon={<Target className="w-3.5 h-3.5 text-blue-400" />}
          label="Capital en Misión"
          sub="comprometido con objetivos activos"
          value={capitalEnMision}
        />
        <Metric
          icon={<Shield className="w-3.5 h-3.5 text-cyan-400" />}
          label="Escudo Financiero"
          sub="reserva para imprevistos"
          value={escudoFinanciero}
        />
      </div>

      {/* Bottom bar — monthly distribution (informational, unchanged calc) */}
      {monthlyIncome > 0 && (
        <div className="mt-5 space-y-1.5">
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>Distribución mensual</span>
            <span className="tabular-nums font-mono">
              {((monthlyExpenses / monthlyIncome) * 100).toFixed(0)}% gastos
            </span>
          </div>
          <div className="flex h-1.5 rounded-full overflow-hidden gap-0.5">
            <motion.div
              className="bg-accent/70 rounded-l-full"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((monthlyExpenses / monthlyIncome) * 100, 100)}%` }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
            />
            <motion.div
              className="bg-blue-500/70"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((monthlyInvestment / monthlyIncome) * 100, 100)}%` }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.5 }}
            />
            <motion.div
              className="bg-emerald-500/70 flex-1 rounded-r-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.8 }}
            />
          </div>
          <div className="flex gap-3 text-[9px] text-muted-foreground/60">
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-accent/70 inline-block" />Gastos</span>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-500/70 inline-block" />Inversiones</span>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500/70 inline-block" />Ahorros</span>
          </div>
        </div>
      )}
    </Card>
  );
}
