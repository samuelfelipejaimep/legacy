"use client";

import { motion } from "framer-motion";
import { Activity } from "lucide-react";
import { Card } from "@/components/ui/card";
import { getLevelName } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface ControlIndexWidgetProps {
  score: number;
  level: number;
  xp: number;
}

const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function scoreColor(score: number) {
  if (score >= 80) return { stroke: "#10B981", text: "text-emerald-400", label: "Excelente" };
  if (score >= 60) return { stroke: "#F59E0B", text: "text-yellow-400", label: "Bueno" };
  if (score >= 40) return { stroke: "#F97316", text: "text-orange-400", label: "Regular" };
  return { stroke: "hsl(var(--accent))", text: "text-accent", label: "Crítico" };
}

export function ControlIndexWidget({ score, level, xp }: ControlIndexWidgetProps) {
  const rounded = Math.round(Number(score));
  const { stroke, text, label } = scoreColor(rounded);
  const offset = CIRCUMFERENCE - (rounded / 100) * CIRCUMFERENCE;

  return (
    <Card className="p-6 relative overflow-hidden">
      {/* Ambient glow */}
      <div
        className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-32 h-32 rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{ background: stroke }}
      />

      <div className="flex items-center gap-2 mb-5">
        <Activity className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
          Índice de Control
        </span>
      </div>

      {/* Circular gauge */}
      <div className="flex flex-col items-center">
        <div className="relative w-[136px] h-[136px]">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 124 124">
            {/* Track */}
            <circle cx="62" cy="62" r={RADIUS} fill="none" stroke="currentColor"
              strokeWidth="7" className="text-white/5" />
            {/* Progress */}
            <motion.circle
              cx="62" cy="62" r={RADIUS} fill="none"
              stroke={stroke} strokeWidth="7" strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              initial={{ strokeDashoffset: CIRCUMFERENCE }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
            />
          </svg>

          {/* Center value */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span
              className={cn("text-[40px] font-black leading-none tabular-nums", text)}
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              {rounded}
            </motion.span>
            <span className="text-muted-foreground text-[11px] mt-0.5">/ 100</span>
          </div>
        </div>

        <div className="text-center mt-3 space-y-0.5">
          <p className="text-xs font-semibold text-white">{label}</p>
          <p className="text-[11px] text-muted-foreground">
            Nivel {level} · {getLevelName(level)}
          </p>
          <p className="text-[10px] text-muted-foreground/60 font-mono tabular-nums">
            {xp.toLocaleString()} XP
          </p>
        </div>
      </div>
    </Card>
  );
}
