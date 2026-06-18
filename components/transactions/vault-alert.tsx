"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Shield, AlertTriangle, TrendingDown, Clock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { VaultAlert } from "@/lib/types";

interface VaultAlertModalProps {
  vault: VaultAlert;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export function VaultAlertModal({ vault, onConfirm, onCancel, loading }: VaultAlertModalProps) {
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={onCancel}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-md rounded-xl border border-accent/30 bg-card shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-start gap-3 p-5 border-b border-border">
            <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/25 flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5 text-accent" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-black text-accent tracking-widest uppercase mb-0.5">
                Protocolo Caja Fuerte
              </p>
              <p className="text-white font-semibold">
                Gasto de alto impacto detectado
              </p>
            </div>
            <button
              onClick={onCancel}
              className="text-muted-foreground hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 space-y-4">
            {/* Impact summary */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-accent/5 border border-accent/15 p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <TrendingDown className="w-3.5 h-3.5 text-accent" />
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Impacto liquidez</span>
                </div>
                <p className={cn(
                  "text-lg font-black tabular-nums",
                  vault.liquidityImpactPct >= 50 ? "text-accent" : "text-yellow-400"
                )}>
                  {vault.liquidityImpactPct.toFixed(0)}%
                </p>
              </div>
              <div className="rounded-lg bg-secondary border border-border p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-yellow-400" />
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Monto</span>
                </div>
                <p className="text-lg font-black text-white tabular-nums">
                  ${vault.amount.toFixed(0)} USD
                </p>
              </div>
            </div>

            {/* Affected objectives */}
            {vault.affectedObjectives.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Retraso estimado en objetivos
                </p>
                <div className="space-y-1.5">
                  {vault.affectedObjectives.map((obj) => (
                    <div
                      key={obj.name}
                      className="flex items-center justify-between bg-secondary rounded-lg px-3 py-2"
                    >
                      <span className="text-sm text-white truncate">{obj.name}</span>
                      <span className="text-xs text-accent font-semibold flex-shrink-0 ml-2">
                        +{obj.delayDays}d
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recovery plan */}
            <div className="rounded-lg bg-secondary border border-border p-3">
              <p className="text-xs font-semibold text-white mb-1">Plan de recuperación</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{vault.recoveryPlan}</p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-2.5 px-5 pb-5">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onCancel}
              disabled={loading}
            >
              Cancelar gasto
            </Button>
            <Button
              variant="legacy"
              className="flex-1"
              onClick={onConfirm}
              disabled={loading}
            >
              {loading ? "Guardando..." : "Confirmar de todas formas"}
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
