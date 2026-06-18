"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2, ArrowUpRight, ArrowDownRight, TrendingUp, ArrowLeftRight,
  ShieldCheck, AlertTriangle, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { VaultAlertModal } from "@/components/transactions/vault-alert";
import { createTransaction, checkVaultProtocol } from "@/lib/actions/transactions";
import { useAppStore } from "@/store/app-store";
import { useCurrency } from "@/hooks/use-currency";
import { cn } from "@/lib/utils";
import type { Category, Objective, VaultAlert } from "@/lib/types";

interface TransactionFormProps {
  profileId: string;
  categories: Category[];
  objectives: Objective[];
  /** Liquidez Disponible actual del usuario, en USD. Usado solo para mostrar
   *  la advertencia antes de asignar capital a una misión. */
  currentLiquidityUSD?: number;
}

const NO_OBJECTIVE = "none";

const TYPES = [
  { value: "INCOME", label: "Ingreso", icon: ArrowUpRight, color: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" },
  { value: "EXPENSE", label: "Gasto", icon: ArrowDownRight, color: "border-accent/30 bg-accent/10 text-accent" },
  { value: "INVESTMENT", label: "Inversión", icon: TrendingUp, color: "border-blue-500/30 bg-blue-500/10 text-blue-400" },
  { value: "TRANSFER", label: "Transferencia", icon: ArrowLeftRight, color: "border-yellow-500/30 bg-yellow-500/10 text-yellow-400" },
  { value: "SAVINGS", label: "Ahorro Propio", icon: ShieldCheck, color: "border-cyan-500/30 bg-cyan-500/10 text-cyan-400" },
];

export function TransactionForm({ profileId, categories, objectives, currentLiquidityUSD = 0 }: TransactionFormProps) {
  const router = useRouter();
  const copToUsdRate = useAppStore((s) => s.copToUsdRate);
  const { format } = useCurrency();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [vaultData, setVaultData] = useState<VaultAlert | null>(null);
  const [showAllocationConfirm, setShowAllocationConfirm] = useState(false);
  // Cierra el hueco entre un clic y que isPending se active: sin esto,
  // un doble clic durante el "await checkVaultProtocol" podía enviar
  // dos transacciones idénticas (ver auditoría de duplicados).
  const submittingRef = useRef(false);

  const [form, setForm] = useState({
    type: "EXPENSE",
    amount: "",
    currency: "USD" as "USD" | "COP",
    description: "",
    categoryId: "",
    date: new Date().toISOString().split("T")[0],
    notes: "",
    isImpulsive: false,
    objectiveId: "",
    objectiveAmount: "",
  });

  function set(key: string, value: unknown) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError(null);
  }

  const hasAllocation =
    !!form.objectiveId && form.objectiveId !== NO_OBJECTIVE && Number(form.objectiveAmount) > 0;

  function allocationAmountUSD(): number {
    const raw = Number(form.objectiveAmount) || 0;
    return form.currency === "COP" ? raw / copToUsdRate : raw;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submittingRef.current) return;
    if (!form.amount || !form.description || !form.categoryId) {
      setError("Completa todos los campos obligatorios");
      return;
    }

    submittingRef.current = true;
    try {
      const amountUSD =
        form.currency === "COP"
          ? Number(form.amount) / copToUsdRate
          : Number(form.amount);

      // Check vault for impulsive expenses
      if (form.type === "EXPENSE" && form.isImpulsive) {
        const vault = await checkVaultProtocol(profileId, amountUSD);
        if (vault.triggered) {
          setVaultData(vault);
          return;
        }
      }

      // Warn before reducing Liquidez Disponible via mission allocation
      if (hasAllocation) {
        setShowAllocationConfirm(true);
        return;
      }

      submitTransaction();
    } finally {
      submittingRef.current = false;
    }
  }

  function submitTransaction() {
    setVaultData(null);
    setShowAllocationConfirm(false);
    startTransition(async () => {
      const result = await createTransaction(profileId, {
        type: form.type as any,
        amount: Number(form.amount),
        currency: form.currency,
        description: form.description,
        notes: form.notes || undefined,
        categoryId: form.categoryId,
        date: form.date,
        isImpulsive: form.isImpulsive,
        objectiveAllocations: hasAllocation
          ? [{ objectiveId: form.objectiveId, amount: Number(form.objectiveAmount) }]
          : [],
      }, copToUsdRate);

      if (result.success) {
        router.push("/movimientos");
        router.refresh();
      } else {
        setError(result.error ?? "Error desconocido");
      }
    });
  }

  const incomeOrInvestment = form.type === "INCOME" || form.type === "INVESTMENT";
  const activeObjectives = objectives.filter((o) => o.status === "ACTIVE" || o.status === "FIXED");

  const allocUSD = allocationAmountUSD();
  const remainingLiquidity = currentLiquidityUSD - allocUSD;
  const selectedMissionName = activeObjectives.find((o) => o.id === form.objectiveId)?.name ?? "";

  return (
    <>
      {vaultData && (
        <VaultAlertModal
          vault={vaultData}
          onConfirm={submitTransaction}
          onCancel={() => setVaultData(null)}
          loading={isPending}
        />
      )}

      {/* Mission allocation confirmation — warns before reducing Liquidez Disponible */}
      <AnimatePresence>
        {showAllocationConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setShowAllocationConfirm(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full max-w-sm rounded-xl border border-yellow-500/25 bg-card p-6 shadow-2xl"
            >
              <div className="flex items-start gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-yellow-500/10 border border-yellow-500/25 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-4.5 h-4.5 text-yellow-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">
                    Esta asignación reducirá tu Liquidez Disponible
                  </p>
                  {selectedMissionName && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Destino: {selectedMissionName}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setShowAllocationConfirm(false)}
                  className="ml-auto text-muted-foreground hover:text-white transition-colors flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 mb-5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Liquidez actual</span>
                  <span className="text-white font-mono tabular-nums">{format(currentLiquidityUSD)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Monto asignado</span>
                  <span className="text-yellow-400 font-mono tabular-nums">−{format(allocUSD)}</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-border">
                  <span className="text-white font-medium">Liquidez restante</span>
                  <span className={cn(
                    "font-bold font-mono tabular-nums",
                    remainingLiquidity < 0 ? "text-accent" : "text-emerald-400"
                  )}>
                    {format(remainingLiquidity)}
                  </span>
                </div>
              </div>

              <div className="flex gap-2.5">
                <Button variant="outline" className="flex-1" onClick={() => setShowAllocationConfirm(false)}>
                  Revisar
                </Button>
                <Button variant="legacy" className="flex-1" onClick={submitTransaction} disabled={isPending}>
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Continuar"}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="space-y-5 max-w-xl">
        {/* Type selector */}
        <div>
          <Label className="mb-2 block">Tipo</Label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {TYPES.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => set("type", t.value)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 py-3 px-2 rounded-lg border transition-all text-xs font-medium",
                    form.type === t.value ? t.color : "border-border text-muted-foreground hover:border-white/20 hover:text-white"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-center leading-tight">{t.label}</span>
                </button>
              );
            })}
          </div>
          {form.type === "SAVINGS" && (
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
              Este monto se mueve directamente a tu Escudo Financiero.
            </p>
          )}
        </div>

        {/* Amount + Currency */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="amount">Monto *</Label>
            <Input
              id="amount"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={form.amount}
              onChange={(e) => set("amount", e.target.value)}
              required
              className="font-mono"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Moneda</Label>
            <Select value={form.currency} onValueChange={(v) => set("currency", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">🇺🇸 USD</SelectItem>
                <SelectItem value="COP">🇨🇴 COP</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <Label htmlFor="description">Descripción *</Label>
          <Input
            id="description"
            placeholder="¿Qué fue esto?"
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            required
          />
        </div>

        {/* Category */}
        <div className="space-y-1.5">
          <Label>Categoría *</Label>
          <Select value={form.categoryId} onValueChange={(v) => set("categoryId", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona categoría" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.icon} {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date */}
        <div className="space-y-1.5">
          <Label htmlFor="date">Fecha</Label>
          <Input
            id="date"
            type="date"
            value={form.date}
            onChange={(e) => set("date", e.target.value)}
          />
        </div>

        {/* Impulsive toggle for expenses */}
        {form.type === "EXPENSE" && (
          <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-secondary/40">
            <button
              type="button"
              onClick={() => set("isImpulsive", !form.isImpulsive)}
              className={cn(
                "w-9 h-5 rounded-full transition-colors flex-shrink-0",
                form.isImpulsive ? "bg-accent" : "bg-border"
              )}
            >
              <div className={cn(
                "w-3.5 h-3.5 rounded-full bg-white mx-0.5 transition-transform",
                form.isImpulsive ? "translate-x-4" : "translate-x-0"
              )} />
            </button>
            <div>
              <p className="text-sm font-medium text-white">Compra impulsiva</p>
              <p className="text-xs text-muted-foreground">Activa el Protocolo Caja Fuerte si supera $1,000 USD</p>
            </div>
          </div>
        )}

        {/* Objective allocation for income/investment */}
        {incomeOrInvestment && activeObjectives.length > 0 && (
          <Card className="p-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Asignar a misión (opcional)
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Misión</Label>
                <Select value={form.objectiveId} onValueChange={(v) => set("objectiveId", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sin asignar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_OBJECTIVE}>Sin asignar</SelectItem>
                    {activeObjectives.map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {form.objectiveId && form.objectiveId !== NO_OBJECTIVE && (
                <div className="space-y-1.5">
                  <Label htmlFor="objAmount">Monto a asignar</Label>
                  <Input
                    id="objAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={form.objectiveAmount}
                    onChange={(e) => set("objectiveAmount", e.target.value)}
                    className="font-mono"
                  />
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Notes */}
        <div className="space-y-1.5">
          <Label htmlFor="notes">Notas (opcional)</Label>
          <Textarea
            id="notes"
            placeholder="Detalles adicionales..."
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            rows={2}
          />
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-3 py-2.5 rounded-lg bg-destructive/10 border border-destructive/20"
          >
            <p className="text-destructive text-sm">{error}</p>
          </motion.div>
        )}

        <div className="flex gap-3 pt-1">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isPending}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="legacy"
            disabled={isPending}
            className="flex-1"
          >
            {isPending ? <><Loader2 className="w-4 h-4 animate-spin" />Guardando...</> : "Registrar movimiento"}
          </Button>
        </div>
      </form>
    </>
  );
}
