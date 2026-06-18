"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { submitMonthlyReview } from "@/lib/actions/review";

interface MonthlyReviewFormProps {
  profileId: string;
  month: number;
  year: number;
  autoIncome: number;
  autoExpenses: number;
  autoInvested: number;
  existingReviewId: string | null;
}

const QUESTIONS = [
  { id: "income",       label: "¿Cuánto generaste este mes?",            type: "number", placeholder: "0.00", prefix: "USD $" },
  { id: "wentWell",     label: "¿Qué salió bien?",                      type: "text",   placeholder: "Describe lo positivo del mes..." },
  { id: "wentWrong",    label: "¿Qué salió mal o qué mejorar?",         type: "text",   placeholder: "Sé honesto, sin filtros..." },
  { id: "nextGoal",     label: "¿Cuánto quieres generar el próximo mes?", type: "number", placeholder: "0.00", prefix: "USD $" },
  { id: "priorities",   label: "¿Cambió alguna prioridad?",              type: "text",   placeholder: "Ajustes en objetivos, enfoques, estrategia..." },
];

export function MonthlyReviewForm({
  profileId, month, year, autoIncome, autoExpenses, autoInvested, existingReviewId,
}: MonthlyReviewFormProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [answers, setAnswers] = useState({
    income: autoIncome > 0 ? autoIncome.toFixed(2) : "",
    wentWell: "",
    wentWrong: "",
    nextGoal: "",
    priorities: "",
  });

  const current = QUESTIONS[step];
  const isLast = step === QUESTIONS.length - 1;
  const value = answers[current.id as keyof typeof answers];

  function setValue(val: string) {
    setAnswers((prev) => ({ ...prev, [current.id]: val }));
  }

  function next() {
    if (!isLast) { setStep((s) => s + 1); return; }
    startTransition(async () => {
      const result = await submitMonthlyReview({
        profileId,
        month,
        year,
        totalIncome: Number(answers.income) || 0,
        totalExpenses: autoExpenses,
        totalInvested: autoInvested,
        wentWell: answers.wentWell,
        wentWrong: answers.wentWrong,
        nextMonthGoal: Number(answers.nextGoal) || 0,
        priorityChanges: answers.priorities,
        reviewId: existingReviewId,
      });
      if (result.success) {
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* Progress */}
      <div className="flex gap-1.5">
        {QUESTIONS.map((_, i) => (
          <div key={i} className={cn(
            "h-0.5 flex-1 rounded-full transition-colors duration-500",
            i <= step ? "bg-accent" : "bg-border"
          )} />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          <Card className="p-7">
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-4">
              Pregunta {step + 1} de {QUESTIONS.length}
            </p>
            <h2 className="text-lg font-bold text-white mb-6">{current.label}</h2>

            <div className="space-y-2">
              {current.prefix && (
                <Label className="text-muted-foreground">{current.prefix}</Label>
              )}
              {current.type === "number" ? (
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={current.placeholder}
                  className="text-lg font-mono h-12"
                  autoFocus
                />
              ) : (
                <textarea
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={current.placeholder}
                  rows={4}
                  className="w-full rounded-lg border border-border bg-input px-3 py-3 text-sm text-foreground placeholder:text-muted-foreground resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent/60"
                  autoFocus
                />
              )}
            </div>
          </Card>
        </motion.div>
      </AnimatePresence>

      <div className="flex justify-between items-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
        >
          Anterior
        </Button>
        <Button variant="legacy" onClick={next} disabled={isPending} className="gap-2">
          {isPending ? (
            <><Loader2 className="w-4 h-4 animate-spin" />Procesando...</>
          ) : isLast ? (
            <><Sparkles className="w-4 h-4" />Completar revisión</>
          ) : (
            <>Siguiente <ChevronRight className="w-4 h-4" /></>
          )}
        </Button>
      </div>
    </div>
  );
}
