"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Target, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useCurrency } from "@/hooks/use-currency";
import { percentage, truncate } from "@/lib/utils";
import type { Objective } from "@/lib/types";

interface ActiveMissionsWidgetProps {
  objectives: Objective[];
}

export function ActiveMissionsWidget({ objectives }: ActiveMissionsWidgetProps) {
  const { format } = useCurrency();
  const active = objectives.slice(0, 5);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Target className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
            Misiones Activas
          </span>
        </div>
        <Link
          href="/objetivos"
          className="text-[10px] text-muted-foreground hover:text-white transition-colors flex items-center gap-0.5"
        >
          Ver todas <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      {active.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Target className="w-8 h-8 text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">Sin misiones activas</p>
          <Link href="/objetivos" className="text-xs text-accent hover:underline mt-1">
            Crear primera misión
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {active.map((obj, i) => {
            const pct = percentage(Number(obj.currentAmount), Number(obj.targetAmount));
            const remaining = Number(obj.targetAmount) - Number(obj.currentAmount);
            const currency = obj.currency as "USD" | "COP";

            return (
              <motion.div
                key={obj.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
                <Link href={`/objetivos/${obj.id}`}>
                  <div className="group cursor-pointer space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white group-hover:text-accent transition-colors truncate">
                          {obj.name}
                        </p>
                        {obj.subtitle && (
                          <p className="text-[11px] text-muted-foreground truncate">{obj.subtitle}</p>
                        )}
                      </div>
                      <span className="text-xs font-bold tabular-nums text-white flex-shrink-0">
                        {pct.toFixed(0)}%
                      </span>
                    </div>

                    <Progress value={pct} className="h-1" />

                    <div className="flex justify-between text-[10px] text-muted-foreground/60 tabular-nums">
                      <span>{format(Number(obj.currentAmount), currency)}</span>
                      <span>{format(remaining, currency)} restantes</span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
