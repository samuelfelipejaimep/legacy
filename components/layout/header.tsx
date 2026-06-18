"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { LogOut, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CurrencyToggle } from "@/components/common/currency-toggle";
import { logoutAction } from "@/lib/actions/auth";
import { initials } from "@/lib/utils";
import type { Profile } from "@/lib/types";

interface HeaderProps {
  profile: Profile;
}

export function Header({ profile }: HeaderProps) {
  const today = new Date();
  const dateStr = format(today, "EEEE, d 'de' MMMM", { locale: es });

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between px-6 py-4 border-b border-border bg-background/80 backdrop-blur-md">
      {/* Date */}
      <div>
        <p className="text-sm font-medium text-white capitalize">{dateStr}</p>
        <p className="text-xs text-muted-foreground">{format(today, "yyyy")}</p>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        <CurrencyToggle />

        {/* Profile menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-secondary focus:outline-none">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-accent/20 text-accent text-[11px] font-bold">
                  {initials(profile.displayName)}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-white hidden sm:block">
                {profile.displayName}
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="text-xs text-muted-foreground/60">
              Nivel {profile.level} · {profile.xp.toLocaleString()} XP
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <a href="/perfil">
                <RefreshCw className="w-4 h-4" />
                Mi Perfil
              </a>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive hover:text-destructive focus:text-destructive"
              onClick={() => logoutAction()}
            >
              <LogOut className="w-4 h-4" />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
