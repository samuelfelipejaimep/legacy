"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginAction, signupAction } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ email: "", password: "", name: "" });

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      let result;
      if (mode === "login") {
        result = await loginAction(form.email, form.password);
      } else {
        if (!form.name.trim()) { setError("El nombre es obligatorio"); return; }
        result = await signupAction(form.email, form.password, form.name);
      }
      if (result.success) {
        router.push("/");
        router.refresh();
      } else {
        setError(result.error ?? "Error desconocido");
      }
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Brand */}
      <div className="text-center mb-10">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="inline-flex items-center justify-center w-14 h-14 bg-accent rounded-2xl mb-5 shadow-[0_0_32px_hsl(var(--accent)/0.5)]"
        >
          <span className="text-white font-black text-2xl tracking-tighter">L</span>
        </motion.div>
        <h1 className="text-2xl font-bold text-white tracking-tight">LEGACY</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Construyendo algo que valga la pena recordar.
        </p>
      </div>

      {/* Mode toggle */}
      <div className="flex rounded-lg border border-border p-1 mb-6">
        {(["login", "signup"] as const).map((m) => (
          <button
            key={m}
            onClick={() => { setMode(m); setError(null); }}
            className={cn(
              "flex-1 py-1.5 rounded-md text-sm font-medium transition-all",
              mode === m
                ? "bg-secondary text-white"
                : "text-muted-foreground hover:text-white"
            )}
          >
            {m === "login" ? "Entrar" : "Crear cuenta"}
          </button>
        ))}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === "signup" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-1.5"
          >
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              name="name"
              placeholder="Tu nombre"
              value={form.name}
              onChange={handleChange}
              disabled={isPending}
              autoComplete="name"
            />
          </motion.div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="email">Correo electrónico</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="tu@email.com"
            value={form.email}
            onChange={handleChange}
            required
            disabled={isPending}
            autoComplete="email"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Contraseña</Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              required
              disabled={isPending}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
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

        <Button type="submit" variant="legacy" className="w-full" disabled={isPending}>
          {isPending ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Procesando...</>
          ) : mode === "login" ? (
            "Entrar al sistema"
          ) : (
            "Crear mi cuenta"
          )}
        </Button>
      </form>

      <p className="text-center text-muted-foreground/50 text-xs mt-8">
        Sistema de uso exclusivo personal.
      </p>
    </motion.div>
  );
}
