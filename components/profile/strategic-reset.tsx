"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, AlertTriangle, ShieldAlert, Skull } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { resetUserData } from "@/lib/actions/reset";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/utils";

// 20 random words — one is chosen each session
const RANDOM_WORDS = [
  "disciplina", "patrimonio", "fortaleza", "legado", "visión",
  "estrategia", "libertad", "crecimiento", "propósito", "resiliencia",
  "momentum", "claridad", "constancia", "audacia", "victoria",
  "fundamentos", "ambición", "equilibrio", "abundancia", "determinación",
];

function getRandomWord(): string {
  return RANDOM_WORDS[Math.floor(Math.random() * RANDOM_WORDS.length)];
}

type Step = "idle" | "step1" | "step2" | "step3" | "done";

export function StrategicReset() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState<Step>("idle");
  const [word] = useState(() => getRandomWord());
  const [typed, setTyped] = useState("");
  const [error, setError] = useState("");
  const setProfile = useAppStore((s) => s.setProfile);

  function advance() {
    setStep((s) =>
      s === "step1" ? "step2" : s === "step2" ? "step3" : "idle"
    );
    setError("");
    setTyped("");
  }

  function handleWordConfirm() {
    if (typed.trim().toLowerCase() !== word.toLowerCase()) {
      setError(`Escribe exactamente: ${word}`);
      return;
    }
    advance();
  }

  function executeReset() {
    startTransition(async () => {
      const result = await resetUserData();
      if (result.success) {
        setStep("done");
        // Reset Zustand profile
        setProfile({ profileId: "", displayName: "", level: 1, xp: 0, controlIndex: 0 });
        setTimeout(() => {
          router.push("/");
          router.refresh();
        }, 2800);
      } else {
        setError(result.error ?? "Error desconocido");
        setStep("step3");
      }
    });
  }

  return (
    <>
      {/* Trigger button */}
      {step === "idle" && (
        <button
          onClick={() => setStep("step1")}
          className="w-full text-left px-4 py-3 rounded-lg border border-border/40 text-xs text-muted-foreground/50 hover:border-accent/30 hover:text-muted-foreground transition-all group"
        >
          <span className="flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 group-hover:text-accent transition-colors" />
            Reinicio Estratégico
          </span>
        </button>
      )}

      {/* Step modals */}
      <AnimatePresence>
        {step !== "idle" && step !== "done" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl"
            >
              {/* ── STEP 1 ────────────────────────────────── */}
              {step === "step1" && (
                <div className="space-y-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/25 flex items-center justify-center flex-shrink-0">
                      <ShieldAlert className="w-5 h-5 text-yellow-400" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-white">🚨 Alto ahí, exitoso.</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Estás a punto de borrar todos tus avances en LEGACY: movimientos, objetivos,
                    conversaciones con MIDAS, XP y niveles.
                    <br /><br />
                    ¿Seguro que no fue un clic accidental mientras perseguías tus metas?
                  </p>
                  <div className="flex gap-2.5">
                    <Button variant="outline" className="flex-1" onClick={() => setStep("idle")}>
                      No, me asusté
                    </Button>
                    <Button variant="legacy" className="flex-1" onClick={advance}>
                      Sí, continuar
                    </Button>
                  </div>
                </div>
              )}

              {/* ── STEP 2 ────────────────────────────────── */}
              {step === "step2" && (
                <div className="space-y-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/25 flex items-center justify-center flex-shrink-0">
                      <AlertTriangle className="w-5 h-5 text-orange-400" />
                    </div>
                    <p className="text-lg font-bold text-white">🧠 Última prueba de cordura.</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Para demostrar que todavía estás pensando con el cerebro y no con la dopamina,
                    escribe exactamente:
                  </p>
                  <div className="px-4 py-3 rounded-lg bg-secondary border border-border text-center">
                    <p className="text-lg font-black text-white tracking-wider">{word}</p>
                  </div>
                  <Input
                    value={typed}
                    onChange={(e) => { setTyped(e.target.value); setError(""); }}
                    placeholder="Escribe la palabra..."
                    onKeyDown={(e) => { if (e.key === "Enter") handleWordConfirm(); }}
                    autoFocus
                    className={cn(error && "border-destructive/50 focus:border-destructive/60")}
                  />
                  {error && <p className="text-xs text-destructive">{error}</p>}
                  <div className="flex gap-2.5">
                    <Button variant="outline" className="flex-1" onClick={() => setStep("idle")}>
                      Cancelar
                    </Button>
                    <Button
                      variant="legacy"
                      className="flex-1"
                      onClick={handleWordConfirm}
                      disabled={!typed.trim()}
                    >
                      Confirmar
                    </Button>
                  </div>
                </div>
              )}

              {/* ── STEP 3 ────────────────────────────────── */}
              {step === "step3" && (
                <div className="space-y-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/25 flex items-center justify-center flex-shrink-0">
                      <Skull className="w-5 h-5 text-accent" />
                    </div>
                    <p className="text-lg font-bold text-white">☢️ Protocolo Big Bang.</p>
                  </div>
                  <div className="rounded-lg bg-accent/5 border border-accent/20 p-4 space-y-1.5">
                    {[
                      "Esta acción NO es reversible.",
                      "No existe CTRL+Z.",
                      "No existe MIDAS milagroso.",
                      "No existe viaje temporal.",
                      "Después de esto, LEGACY olvidará todos los datos históricos.",
                    ].map((line) => (
                      <p key={line} className="text-sm text-white/80 flex items-start gap-2">
                        <span className="text-accent mt-0.5">·</span>
                        {line}
                      </p>
                    ))}
                  </div>
                  {error && (
                    <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
                      {error}
                    </p>
                  )}
                  <div className="flex gap-2.5">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setStep("idle")}
                      disabled={isPending}
                    >
                      No, mejor no
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 border-accent/30 text-accent hover:bg-accent/10 hover:border-accent/60"
                      onClick={executeReset}
                      disabled={isPending}
                    >
                      {isPending ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Borrando…</>
                      ) : (
                        "Sí, borrar todo"
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Done screen */}
      <AnimatePresence>
        {step === "done" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-background"
            />
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="relative text-center space-y-4"
            >
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3, type: "spring", bounce: 0.4 }}
                className="w-16 h-16 rounded-2xl bg-accent/15 border border-accent/25 flex items-center justify-center mx-auto"
              >
                <span className="text-3xl">🎯</span>
              </motion.div>
              <div>
                <p className="text-2xl font-black text-white">Reinicio completado.</p>
                <p className="text-white/70 mt-1">Bienvenido de nuevo.</p>
                <p className="text-muted-foreground text-sm mt-2">
                  Es hora de construir algo que valga la pena recordar.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
