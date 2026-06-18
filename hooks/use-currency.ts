"use client";

import { useAppStore } from "@/store/app-store";
import { formatCurrency, copToUsd, usdToCop } from "@/lib/utils";

export function useCurrency() {
  const displayCurrency = useAppStore((s) => s.displayCurrency);
  const copToUsdRate = useAppStore((s) => s.copToUsdRate);
  const toggleCurrency = useAppStore((s) => s.toggleCurrency);

  function format(
    amount: number,
    sourceCurrency: "USD" | "COP" = "USD",
    compact = false
  ): string {
    let displayAmount = amount;

    if (sourceCurrency === "USD" && displayCurrency === "COP") {
      displayAmount = usdToCop(amount, copToUsdRate);
    } else if (sourceCurrency === "COP" && displayCurrency === "USD") {
      displayAmount = copToUsd(amount, copToUsdRate);
    }

    return formatCurrency(displayAmount, displayCurrency, compact);
  }

  function toUSD(amount: number, sourceCurrency: "USD" | "COP"): number {
    if (sourceCurrency === "COP") return copToUsd(amount, copToUsdRate);
    return amount;
  }

  function toCOP(amount: number, sourceCurrency: "USD" | "COP"): number {
    if (sourceCurrency === "USD") return usdToCop(amount, copToUsdRate);
    return amount;
  }

  return {
    displayCurrency,
    copToUsdRate,
    toggleCurrency,
    format,
    toUSD,
    toCOP,
  };
}
