"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createObjective, updateObjective } from "@/lib/actions/objectives";
import type { Objective } from "@/lib/types";

interface ObjectiveFormProps {
  profileId: string;
  objective?: Objective; // present when editing
}

export function ObjectiveForm({ profileId, objective }: ObjectiveFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: objective?.name ?? "",
    subtitle: objective?.subtitle ?? "",
    targetAmount: objective?.targetAmount ? String(objective.targetAmount) : "",
    currency: (objective?.currency ?? "USD") as "USD" | "COP",
    targetDate: objective?.targetDate
      ? new Date(objective.targetDate).toISOString().split("T")[0]
      : "",
  });

  function set(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setError("El nombre es obligatorio"); return; }
    if (!form.targetAmount || Number(form.targetAmount) <= 0) {
      setError("El monto objetivo debe ser mayor a 0");
      return;
    }

    startTransition(async () => {
      const data = {
        name: form.name,
        subtitle: form.subtitle || undefined,
        targetAmount: Number(form.targetAmount),
        currency: form.currency,
        targetDate: form.targetDate || undefined,
      };

      const result = objective
        ? await updateObjective(objective.id, data)
        : await createObjective(profileId, data);

      if (result.success) {
        if (!objective && result.data && "id" in result.data) {
          router.push(`/objetivos/${result.data.id}`);
        } else {
          router.push(objective ? `/objetivos/${objective.id}` : "/objetivos");
        }
        router.refresh();
      } else {
        setError(result.error ?? "Error desconocido");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-lg">
      {/* Name */}
      <div className="space-y-1.5">
        <Label htmlFor="name">Nombre de la misión *</Label>
        <Input
          id="name"
          placeholder="ej. MX-5 Protocol"
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          required
          autoFocus
        />
      </div>

      {/* Subtitle */}
      <div className="space-y-1.5">
        <Label htmlFor="subtitle">Subtítulo (opcional)</Label>
        <Input
          id="subtitle"
          placeholder="ej. Mazda Miata MX-5 2026"
          value={form.subtitle}
          onChange={(e) => set("subtitle", e.target.value)}
        />
      </div>

      {/* Amount + Currency */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="targetAmount">Meta *</Label>
          <Input
            id="targetAmount"
            type="number"
            min="1"
            step="0.01"
            placeholder="0.00"
            value={form.targetAmount}
            onChange={(e) => set("targetAmount", e.target.value)}
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

      {/* Target Date */}
      <div className="space-y-1.5">
        <Label htmlFor="targetDate">Fecha objetivo (opcional)</Label>
        <Input
          id="targetDate"
          type="date"
          value={form.targetDate}
          onChange={(e) => set("targetDate", e.target.value)}
          min={new Date().toISOString().split("T")[0]}
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
        <Button type="submit" variant="legacy" disabled={isPending} className="flex-1">
          {isPending ? (
            <><Loader2 className="w-4 h-4 animate-spin" />{objective ? "Guardando..." : "Creando..."}</>
          ) : (
            objective ? "Guardar cambios" : "Crear misión"
          )}
        </Button>
      </div>
    </form>
  );
}
