"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/utils";

export function CurrencyToggle() {
  const displayCurrency = useAppStore((s) => s.displayCurrency);
  const toggleCurrency = useAppStore((s) => s.toggleCurrency);

  return (
    <button
      onClick={toggleCurrency}
      className={cn(
        "relative flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium transition-all",
        "hover:bg-secondary hover:border-white/20 focus:outline-none focus:ring-1 focus:ring-accent/50"
      )}
    >
      <AnimatePresence mode="wait">
        <motion.span
          key={displayCurrency}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.15 }}
          className={cn(
            "font-mono tabular-nums",
            displayCurrency === "USD" ? "text-emerald-400" : "text-yellow-400"
          )}
        >
          {displayCurrency}
        </motion.span>
      </AnimatePresence>
      <span className="text-muted-foreground">·</span>
      <span className="text-muted-foreground text-[10px]">
        {displayCurrency === "USD" ? "COP" : "USD"}
      </span>
    </button>
  );
}
