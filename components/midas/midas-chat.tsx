"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, User, RotateCcw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { MidasMessage_UI, MidasContext } from "@/lib/types";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface MidasChatProps {
  context: MidasContext;
  initialConversationId: string | null;
  initialMessages: MidasMessage_UI[];
}

const QUICK_PROMPTS = [
  "¿Cómo voy este mes?",
  "¿Puedo comprar algo de $500?",
  "¿Qué objetivo priorizar?",
  "Analiza mis gastos",
];

export function MidasChat({ context, initialConversationId, initialMessages }: MidasChatProps) {
  const [messages, setMessages] = useState<MidasMessage_UI[]>(initialMessages);
  const [conversationId, setConversationId] = useState<string | null>(initialConversationId);
  const [input, setInput] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  function sendMessage(text: string) {
    if (!text.trim() || isPending || isTyping) return;
    const userMsg: MidasMessage_UI = {
      id: `tmp-${Date.now()}`,
      role: "USER",
      content: text.trim(),
      createdAt: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    startTransition(async () => {
      try {
        const res = await fetch("/api/midas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text.trim(),
            conversationId,
            context,
            history: messages.slice(-10).map((m) => ({ role: m.role, content: m.content })),
          }),
        });
        const data = await res.json();
        setIsTyping(false);
        if (data.conversationId) setConversationId(data.conversationId);
        const midasMsg: MidasMessage_UI = {
          id: data.messageId ?? `midas-${Date.now()}`,
          role: "MIDAS",
          content: data.response,
          createdAt: new Date(),
        };
        setMessages((prev) => [...prev, midasMsg]);
      } catch {
        setIsTyping(false);
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            role: "MIDAS",
            content: "Hubo un error conectando conmigo. Intenta de nuevo.",
            createdAt: new Date(),
          },
        ]);
      }
    });
  }

  function clearConversation() {
    setMessages([]);
    setConversationId(null);
  }

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col flex-1 min-h-0 rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-accent/15 border border-accent/25 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-accent" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">MIDAS</p>
            <p className="text-[10px] text-muted-foreground">Tu analista personal · {isTyping ? "Escribiendo..." : "Disponible"}</p>
          </div>
        </div>
        {!isEmpty && (
          <Button variant="ghost" size="icon-sm" onClick={clearConversation} title="Nueva conversación">
            <RotateCcw className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {isEmpty ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center h-full text-center py-10 space-y-4"
          >
            <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-accent" />
            </div>
            <div>
              <p className="text-white font-semibold">Hola, {context.displayName}.</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                Soy MIDAS. Tu analista, auditor y estratega financiero personal. ¿En qué puedo ayudarte?
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  className="text-xs text-muted-foreground border border-border rounded-lg px-3 py-2 hover:border-accent/40 hover:text-white hover:bg-accent/5 transition-all text-left"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </motion.div>
        ) : (
          <>
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className={cn("flex gap-3", msg.role === "USER" ? "justify-end" : "justify-start")}
                >
                  {msg.role === "MIDAS" && (
                    <div className="w-7 h-7 rounded-lg bg-accent/15 border border-accent/25 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Sparkles className="w-3.5 h-3.5 text-accent" />
                    </div>
                  )}
                  <div className={cn(
                    "max-w-[80%] rounded-xl px-4 py-3 text-sm leading-relaxed",
                    msg.role === "USER"
                      ? "bg-accent/15 text-white ml-auto"
                      : "bg-secondary text-white/90"
                  )}>
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1.5 text-right">
                      {format(new Date(msg.createdAt), "HH:mm", { locale: es })}
                    </p>
                  </div>
                  {msg.role === "USER" && (
                    <div className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0 mt-0.5">
                      <User className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Typing indicator */}
            <AnimatePresence>
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="flex gap-3"
                >
                  <div className="w-7 h-7 rounded-lg bg-accent/15 border border-accent/25 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-3.5 h-3.5 text-accent" />
                  </div>
                  <div className="bg-secondary rounded-xl px-4 py-3 flex items-center gap-1.5">
                    {[0, 0.15, 0.3].map((delay, i) => (
                      <motion.div
                        key={i}
                        className="w-1.5 h-1.5 bg-accent rounded-full"
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-4 border-t border-border flex-shrink-0">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
            placeholder="Pregunta a MIDAS..."
            disabled={isPending || isTyping}
            className="flex-1"
          />
          <Button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isPending || isTyping}
            variant="legacy"
            size="icon"
          >
            {isPending || isTyping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
