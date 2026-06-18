"use client";

import { motion } from "framer-motion";
import { BarChart3, ArrowUpRight, ArrowDownRight, PiggyBank, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useCurrency } from "@/hooks/use-currency";
import { monthName } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface MonthlySummaryWidgetProps {
  income: number;
  expenses: number;
  investments: number;
  saved: number;
  transactionCount: number;
  month: number;
  year: number;
}

interface LineProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}

function Line({ icon, label, value, color }: LineProps) {
  const { format } = useCurrency();
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0">
      <div className="flex items-center gap-2.5">
        <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", color)}>
          {icon}
        </div>
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <span className="text-sm font-semibold text-white tabular-nums">{format(value)}</span>
    </div>
  );
}

export function MonthlySummaryWidget({
  income, expenses, investments, saved, transactionCount, month, year,
}: MonthlySummaryWidgetProps) {
  const savingsRate = income > 0 ? (saved / income) * 100 : 0;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
            Resumen Mensual
          </span>
        </div>
        <span className="text-xs text-muted-foreground capitalize">
          {monthName(month)} {year}
        </span>
      </div>

      <div>
        <Line
          icon={<ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />}
          label="Ingresos"
          value={income}
          color="bg-emerald-500/10"
        />
        <Line
          icon={<ArrowDownRight className="w-3.5 h-3.5 text-accent" />}
          label="Gastos"
          value={expenses}
          color="bg-accent/10"
        />
        <Line
          icon={<TrendingUp className="w-3.5 h-3.5 text-blue-400" />}
          label="Invertido"
          value={investments}
          color="bg-blue-500/10"
        />
        <Line
          icon={<PiggyBank className="w-3.5 h-3.5 text-yellow-400" />}
          label="Ahorrado"
          value={Math.max(saved, 0)}
          color="bg-yellow-500/10"
        />
      </div>

      <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {transactionCount} movimiento{transactionCount !== 1 ? "s" : ""}
        </span>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, duration: 0.3 }}
          className={cn(
            "text-xs font-bold px-2.5 py-1 rounded-lg",
            savingsRate >= 20 ? "bg-emerald-500/10 text-emerald-400" :
            savingsRate >= 10 ? "bg-yellow-500/10 text-yellow-400" :
            "bg-accent/10 text-accent"
          )}
        >
          {savingsRate.toFixed(1)}% tasa de ahorro
        </motion.div>
      </div>
    </Card>
  );
}
