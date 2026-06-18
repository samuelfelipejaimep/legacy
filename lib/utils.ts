import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Currency formatters ──────────────────────────────────────

export function formatUSD(amount: number, compact = false): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: compact ? "compact" : "standard",
    maximumFractionDigits: compact ? 1 : 2,
  }).format(amount);
}

export function formatCOP(amount: number, compact = false): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    notation: compact ? "compact" : "standard",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCurrency(
  amount: number,
  currency: "USD" | "COP",
  compact = false
): string {
  return currency === "USD"
    ? formatUSD(amount, compact)
    : formatCOP(amount, compact);
}

export function copToUsd(cop: number, rate = 4400): number {
  return cop / rate;
}

export function usdToCop(usd: number, rate = 4400): number {
  return usd * rate;
}

// ─── Number helpers ───────────────────────────────────────────

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("es-CO").format(n);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function percentage(value: number, total: number): number {
  if (total === 0) return 0;
  return clamp((value / total) * 100, 0, 100);
}

// ─── Date helpers ─────────────────────────────────────────────

export function monthName(month: number): string {
  return new Date(2024, month - 1, 1).toLocaleString("es", { month: "long" });
}

export function currentMonthYear(): { month: number; year: number } {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
}

export function startOfMonth(month: number, year: number): Date {
  return new Date(year, month - 1, 1);
}

export function endOfMonth(month: number, year: number): Date {
  return new Date(year, month, 0, 23, 59, 59, 999);
}

// ─── String helpers ───────────────────────────────────────────

export function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export function truncate(str: string, length: number): string {
  return str.length > length ? str.slice(0, length) + "…" : str;
}
