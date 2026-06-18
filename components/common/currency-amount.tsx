"use client";

import { useCurrency } from "@/hooks/use-currency";
import { cn } from "@/lib/utils";

interface CurrencyAmountProps {
  amount: number;
  currency?: "USD" | "COP";
  compact?: boolean;
  className?: string;
}

export function CurrencyAmount({ amount, currency = "USD", compact = false, className }: CurrencyAmountProps) {
  const { format } = useCurrency();
  return (
    <span className={cn("tabular-nums font-mono", className)}>
      {format(amount, currency, compact)}
    </span>
  );
}
