"use client";

import { useTransition } from "react";
import { Loader2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/lib/actions/auth";

export function LogoutButton() {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      className="w-full gap-2 text-destructive border-destructive/30 hover:bg-destructive/10 hover:border-destructive/60"
      disabled={isPending}
      onClick={() => startTransition(() => logoutAction())}
    >
      {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
      Cerrar sesión
    </Button>
  );
}
