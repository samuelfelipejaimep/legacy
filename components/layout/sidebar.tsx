"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Sparkles,
  Target,
  ArrowLeftRight,
  CalendarCheck,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getLevelName, getXpForLevel, getXpForNextLevel } from "@/lib/constants";
import { TooltipProvider } from "@/components/ui/tooltip";

const NAV_ITEMS = [
  { href: "/", label: "Centro de Control", icon: LayoutDashboard },
  { href: "/midas", label: "MIDAS", icon: Sparkles, indicator: true },
  { href: "/objetivos", label: "Objetivos", icon: Target },
  { href: "/movimientos", label: "Movimientos", icon: ArrowLeftRight },
  { href: "/revision", label: "Revisión Mensual", icon: CalendarCheck },
];

interface SidebarProps {
  level?: number;
  xp?: number;
  displayName?: string;
}

export function Sidebar({ level = 1, xp = 0, displayName = "Usuario" }: SidebarProps) {
  const pathname = usePathname();

  const xpForCurrent = getXpForLevel(level);
  const xpForNext = getXpForNextLevel(level);
  const xpProgress =
    xpForNext > xpForCurrent
      ? ((xp - xpForCurrent) / (xpForNext - xpForCurrent)) * 100
      : 100;
  const xpToNext = Math.max(xpForNext - xp, 0);

  return (
    <TooltipProvider delayDuration={0}>
      <motion.aside
        initial={{ x: -260, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="fixed left-0 top-0 z-50 h-screen w-[240px] flex flex-col border-r border-border bg-card"
      >
        {/* ── Brand ─────────────────────────────── */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-border">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center flex-shrink-0 shadow-[0_0_16px_hsl(var(--accent)/0.5)]">
            <span className="text-white font-black text-xs tracking-widest">L</span>
          </div>
          <div>
            <p className="text-white font-bold text-sm tracking-[0.18em]">LEGACY</p>
            <p className="text-muted-foreground text-[9px] tracking-widest uppercase">Sistema Personal</p>
          </div>
        </div>

        {/* ── Navigation ────────────────────────── */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link key={item.href} href={item.href}>
                <motion.div
                  whileHover={{ x: isActive ? 0 : 3 }}
                  transition={{ duration: 0.15 }}
                  className={cn(
                    "relative flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors duration-150 group",
                    isActive
                      ? "bg-accent/10 text-white"
                      : "text-muted-foreground hover:text-white hover:bg-white/[0.04]"
                  )}
                >
                  {/* Active indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-accent rounded-r-full"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                    />
                  )}

                  <Icon
                    className={cn(
                      "w-4 h-4 flex-shrink-0 transition-colors",
                      isActive ? "text-accent" : "group-hover:text-white"
                    )}
                  />
                  <span className="text-sm font-medium">{item.label}</span>

                  {/* MIDAS pulse */}
                  {item.indicator && (
                    <div className="ml-auto">
                      <div
                        className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          isActive ? "bg-accent animate-pulse" : "bg-accent/30"
                        )}
                      />
                    </div>
                  )}
                </motion.div>
              </Link>
            );
          })}
        </nav>

        {/* ── Profile ───────────────────────────── */}
        <div className="px-3 py-2 border-t border-border">
          <Link href="/perfil">
            <div
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors duration-150",
                pathname === "/perfil"
                  ? "bg-accent/10 text-white"
                  : "text-muted-foreground hover:text-white hover:bg-white/[0.04]"
              )}
            >
              <User className="w-4 h-4" />
              <span className="text-sm font-medium truncate">{displayName}</span>
            </div>
          </Link>
        </div>

        {/* ── Level / XP ────────────────────────── */}
        <div className="px-4 pb-5 pt-3 border-t border-border">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-[18px] h-[18px] bg-accent/15 border border-accent/25 rounded flex items-center justify-center">
                <span className="text-accent font-black text-[9px] tabular-nums">{level}</span>
              </div>
              <span className="text-xs font-semibold text-white">{getLevelName(level)}</span>
            </div>
            <span className="text-[10px] font-mono text-muted-foreground tabular-nums">
              {xp.toLocaleString()} XP
            </span>
          </div>

          {/* XP Bar */}
          <div className="relative h-1 rounded-full bg-white/5 overflow-hidden">
            <motion.div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-accent/70 to-accent rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(xpProgress, 100)}%` }}
              transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: 0.6 }}
            />
          </div>

          <p className="text-[10px] text-muted-foreground/50 mt-1.5 truncate">
            {xpToNext > 0
              ? `${xpToNext.toLocaleString()} XP para nivel ${level + 1}`
              : "Nivel máximo alcanzado"}
          </p>
        </div>
      </motion.aside>
    </TooltipProvider>
  );
}
