"use client";

import { useState, useTransition } from "react";
import { RefreshCw, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateExchangeRate } from "@/lib/actions/profile";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/utils";

interface ExchangeRateFormProps {
  profileId: string;
  currentRate: number;
}

export function ExchangeRateForm({ profileId, currentRate }: ExchangeRateFormProps) {
  const setCopToUsdRate = useAppStore((s) => s.setCopToUsdRate);
  const [isPending, startTransition] = useTransition();
  const [isFetching, setIsFetching] = useState(false);
  const [value, setValue] = useState(String(Math.round(currentRate)));
  const [saved, setSaved] = useState(false);
  const [apiRate, setApiRate] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleSave() {
    const rate = Number(value);
    if (!rate || rate < 500 || rate > 20_000) {
      setError("Ingresa un valor entre 500 y 20,000 COP/USD");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await updateExchangeRate(profileId, rate);
      if (result.success) {
        setCopToUsdRate(rate);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } else {
        setError(result.error ?? "Error guardando");
      }
    });
  }

  async function handleFetchFromApi() {
    setIsFetching(true);
    setError(null);
    try {
      const res = await fetch("/api/exchange-rate");
      const data = await res.json();
      if (data.success && data.usdCopRate) {
        const fetched = Math.round(data.usdCopRate);
        setApiRate(fetched);
        setValue(String(fetched));
      } else {
        setError("La API no devolvió un valor válido");
      }
    } catch {
      setError("Error conectando con la API de tasas");
    } finally {
      setIsFetching(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-end gap-2">
        <div className="flex-1 space-y-1.5">
          <Label htmlFor="cop-rate">Tasa COP por 1 USD</Label>
          <Input
            id="cop-rate"
            type="number"
            min="500"
            max="20000"
            step="1"
            value={value}
            onChange={(e) => { setValue(e.target.value); setSaved(false); setError(null); }}
            className="font-mono"
          />
        </div>
        <Button
          variant={saved ? "outline" : "legacy"}
          size="default"
          onClick={handleSave}
          disabled={isPending || saved}
          className={cn("gap-2 flex-shrink-0", saved && "border-emerald-500/40 text-emerald-400")}
        >
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : saved ? (
            <><Check className="w-4 h-4" /> Guardado</>
          ) : (
            "Guardar"
          )}
        </Button>
      </div>

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}

      <button
        onClick={handleFetchFromApi}
        disabled={isFetching}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-white transition-colors disabled:opacity-50"
      >
        <RefreshCw className={cn("w-3 h-3", isFetching && "animate-spin")} />
        {isFetching ? "Consultando API…" : "Obtener tasa desde API"}
        {apiRate && !isFetching && (
          <span className="text-emerald-400 ml-1">→ {apiRate.toLocaleString()} COP</span>
        )}
      </button>

      <p className="text-[10px] text-muted-foreground/50 leading-relaxed">
        La tasa de la API puede tener demoras. Si el valor no es correcto,
        ingrésalo manualmente y guarda.
      </p>
    </div>
  );
}
