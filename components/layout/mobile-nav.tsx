"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Sparkles, Target, ArrowLeftRight, CalendarCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const MOBILE_NAV = [
  { href: "/", label: "Control", icon: LayoutDashboard },
  { href: "/objetivos", label: "Metas", icon: Target },
  { href: "/midas", label: "MIDAS", icon: Sparkles, featured: true },
  { href: "/movimientos", label: "Movimientos", icon: ArrowLeftRight },
  { href: "/revision", label: "Revisión", icon: CalendarCheck },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center justify-around px-2 py-2 border-t border-border bg-card/95 backdrop-blur-md">
      {MOBILE_NAV.map((item) => {
        const isActive =
          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        const Icon = item.icon;

        return (
          <Link key={item.href} href={item.href} className="flex-1">
            <div
              className={cn(
                "flex flex-col items-center gap-1 py-1.5 rounded-xl transition-colors",
                item.featured
                  ? isActive
                    ? "text-accent"
                    : "text-muted-foreground"
                  : isActive
                  ? "text-white"
                  : "text-muted-foreground"
              )}
            >
              {item.featured ? (
                <div
                  className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center transition-all",
                    isActive
                      ? "bg-accent shadow-[0_0_14px_hsl(var(--accent)/0.5)]"
                      : "bg-accent/15"
                  )}
                >
                  <Icon className={cn("w-4 h-4", isActive ? "text-white" : "text-accent")} />
                </div>
              ) : (
                <Icon className="w-4 h-4" />
              )}
              {!item.featured && (
                <span
                  className={cn(
                    "text-[9px] font-medium tracking-wide",
                    isActive ? "text-white" : "text-muted-foreground"
                  )}
                >
                  {item.label}
                </span>
              )}
            </div>
          </Link>
        );
      })}
    </nav>
  );
}
