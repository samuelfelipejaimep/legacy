"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play, Pause, Pin, X, Trophy, Trash2, ChevronDown,
  Loader2, Plus, DollarSign
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  setObjectiveStatus, completeObjective, cancelObjective,
  deleteObjective, addFundsToObjective
} from "@/lib/actions/objectives";
import { cn } from "@/lib/utils";
import type { Objective } from "@/lib/types";

interface ObjectiveActionsProps {
  objective: Objective;
  profileId: string;
}

export function ObjectiveActions({ objective, profileId }: ObjectiveActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [modal, setModal] = useState<"complete" | "cancel" | "funds" | "delete" | null>(null);

  // Complete form state
  const [completeNotes, setCompleteNotes] = useState("");
  const [completeEmotion, setCompleteEmotion] = useState("");

  // Cancel form state
  const [cancelReason, setCancelReason] = useState("");
  const [cancelRedistribute, setCancelRedistribute] = useState("");

  // Add funds state
  const [fundsAmount, setFundsAmount] = useState("");

  const isActive = objective.status === "ACTIVE";
  const isPaused = objective.status === "PAUSED";
  const isFixed = objective.status === "FIXED";
  const isComplete = objective.status === "COMPLETED";
  const isCancelled = objective.status === "CANCELLED";
  const isEditable = !isComplete && !isCancelled;

  function run(fn: () => Promise<void>) {
    startTransition(async () => {
      await fn();
    });
  }

  const EMOTIONS = ["🎉", "😊", "💪", "🙏", "🔥", "👑"];

  return (
    <>
      {/* Action bar */}
      {isEditable && (
        <div className="flex items-center gap-2 flex-wrap">
          {/* Primary action */}
          {!isComplete && !isCancelled && (
            <Button
              variant="legacy"
              size="sm"
              className="gap-1.5"
              onClick={() => setModal("complete")}
              disabled={isPending}
            >
              <Trophy className="w-3.5 h-3.5" />
              Completar misión
            </Button>
          )}

          {/* Add funds */}
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => setModal("funds")}
            disabled={isPending}
          >
            <Plus className="w-3.5 h-3.5" />
            Añadir fondos
          </Button>

          {/* More actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1" disabled={isPending}>
                {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                Más acciones
                <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {isActive && (
                <DropdownMenuItem onClick={() => run(() => setObjectiveStatus(objective.id, "FIXED").then(() => router.refresh()))}>
                  <Pin className="w-4 h-4" /> Fijar objetivo
                </DropdownMenuItem>
              )}
              {isFixed && (
                <DropdownMenuItem onClick={() => run(() => setObjectiveStatus(objective.id, "ACTIVE").then(() => router.refresh()))}>
                  <Play className="w-4 h-4" /> Activar objetivo
                </DropdownMenuItem>
              )}
              {(isActive || isFixed) && (
                <DropdownMenuItem onClick={() => run(() => setObjectiveStatus(objective.id, "PAUSED").then(() => router.refresh()))}>
                  <Pause className="w-4 h-4" /> Pausar
                </DropdownMenuItem>
              )}
              {isPaused && (
                <DropdownMenuItem onClick={() => run(() => setObjectiveStatus(objective.id, "ACTIVE").then(() => router.refresh()))}>
                  <Play className="w-4 h-4" /> Reanudar
                </DropdownMenuItem>
              )}

              <DropdownMenuItem asChild>
                <a href={`/objetivos/${objective.id}/editar`}>
                  <Pin className="w-4 h-4" /> Editar
                </a>
              </DropdownMenuItem>

              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setModal("cancel")}
              >
                <X className="w-4 h-4" /> Cancelar misión
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setModal("delete")}
              >
                <Trash2 className="w-4 h-4" /> Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* ── COMPLETE MODAL ─────────────────────── */}
      <AnimatePresence>
        {modal === "complete" && (
          <Modal onClose={() => setModal(null)} title="🏆 Completar Misión">
            <p className="text-sm text-muted-foreground mb-4">
              ¡Felicidades! Esta misión pasará al Hall of Fame.
            </p>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>¿Cómo te sientes? (opcional)</Label>
                <div className="flex gap-2">
                  {EMOTIONS.map((e) => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => setCompleteEmotion(completeEmotion === e ? "" : e)}
                      className={cn(
                        "w-9 h-9 text-xl rounded-lg border transition-all",
                        completeEmotion === e ? "border-accent bg-accent/10" : "border-border hover:border-white/30"
                      )}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="completeNotes">Nota de cierre (opcional)</Label>
                <Textarea
                  id="completeNotes"
                  placeholder="¿Qué aprendiste? ¿Cómo lo lograste?"
                  value={completeNotes}
                  onChange={(e) => setCompleteNotes(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="flex gap-2.5">
                <Button variant="outline" className="flex-1" onClick={() => setModal(null)}>Cancelar</Button>
                <Button
                  variant="legacy"
                  className="flex-1"
                  disabled={isPending}
                  onClick={() => run(async () => {
                    const res = await completeObjective(objective.id, profileId, {
                      notes: completeNotes || undefined,
                      emotion: completeEmotion || undefined,
                    });
                    if (res.success) { setModal(null); router.push("/objetivos"); router.refresh(); }
                  })}
                >
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirmar logro"}
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* ── CANCEL MODAL ───────────────────────── */}
      <AnimatePresence>
        {modal === "cancel" && (
          <Modal onClose={() => setModal(null)} title="Cancelar Misión">
            <p className="text-sm text-muted-foreground mb-4">
              Esta misión pasará al Archivo Estratégico. Los fondos acumulados pueden reasignarse.
            </p>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="cancelReason">Motivo de cancelación *</Label>
                <Textarea
                  id="cancelReason"
                  placeholder="¿Por qué cancelas esta misión?"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cancelRedistribute">Reasignar fondos a (opcional)</Label>
                <Input
                  id="cancelRedistribute"
                  placeholder="ej. Escudo Financiero"
                  value={cancelRedistribute}
                  onChange={(e) => setCancelRedistribute(e.target.value)}
                />
              </div>
              <div className="flex gap-2.5">
                <Button variant="outline" className="flex-1" onClick={() => setModal(null)}>Mantener</Button>
                <Button
                  variant="outline"
                  className="flex-1 border-destructive/30 text-destructive hover:bg-destructive/10"
                  disabled={isPending || !cancelReason.trim()}
                  onClick={() => run(async () => {
                    const res = await cancelObjective(objective.id, {
                      reason: cancelReason,
                      redistributeTo: cancelRedistribute || undefined,
                    });
                    if (res.success) { setModal(null); router.push("/objetivos"); router.refresh(); }
                  })}
                >
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirmar cancelación"}
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* ── ADD FUNDS MODAL ────────────────────── */}
      <AnimatePresence>
        {modal === "funds" && (
          <Modal onClose={() => setModal(null)} title="Añadir Fondos">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="fundsAmount">
                  Monto ({objective.currency})
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="fundsAmount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    value={fundsAmount}
                    onChange={(e) => setFundsAmount(e.target.value)}
                    className="pl-9 font-mono"
                    autoFocus
                  />
                </div>
              </div>
              <div className="flex gap-2.5">
                <Button variant="outline" className="flex-1" onClick={() => setModal(null)}>Cancelar</Button>
                <Button
                  variant="legacy"
                  className="flex-1"
                  disabled={isPending || !fundsAmount || Number(fundsAmount) <= 0}
                  onClick={() => run(async () => {
                    const res = await addFundsToObjective(objective.id, Number(fundsAmount));
                    if (res.success) { setModal(null); setFundsAmount(""); router.refresh(); }
                  })}
                >
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Añadir"}
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* ── DELETE MODAL ───────────────────────── */}
      <AnimatePresence>
        {modal === "delete" && (
          <Modal onClose={() => setModal(null)} title="Eliminar Objetivo">
            <p className="text-sm text-muted-foreground mb-4">
              Esta acción es permanente y eliminará todo el historial de este objetivo.
            </p>
            <div className="flex gap-2.5">
              <Button variant="outline" className="flex-1" onClick={() => setModal(null)}>Cancelar</Button>
              <Button
                variant="outline"
                className="flex-1 border-destructive/30 text-destructive hover:bg-destructive/10"
                disabled={isPending}
                onClick={() => run(async () => {
                  const res = await deleteObjective(objective.id);
                  if (res.success) { setModal(null); router.push("/objetivos"); router.refresh(); }
                })}
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Eliminar definitivamente"}
              </Button>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Shared modal shell ───────────────────────────────────────

function Modal({ children, title, onClose }: { children: React.ReactNode; title: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl"
      >
        <h2 className="text-base font-bold text-white mb-4">{title}</h2>
        {children}
      </motion.div>
    </div>
  );
}
