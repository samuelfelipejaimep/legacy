import { create } from "zustand";
import type { MidasMessage_UI } from "@/lib/types";

interface MidasState {
  conversationId: string | null;
  messages: MidasMessage_UI[];
  isTyping: boolean;
  isLoading: boolean;
  mode: "ANALYST" | "AUDITOR" | "STRATEGIST" | "MENTOR" | "FREE";

  setConversationId: (id: string) => void;
  addMessage: (message: MidasMessage_UI) => void;
  setMessages: (messages: MidasMessage_UI[]) => void;
  setIsTyping: (typing: boolean) => void;
  setIsLoading: (loading: boolean) => void;
  setMode: (mode: MidasState["mode"]) => void;
  clearConversation: () => void;
}

export const useMidasStore = create<MidasState>()((set) => ({
  conversationId: null,
  messages: [],
  isTyping: false,
  isLoading: false,
  mode: "FREE",

  setConversationId: (id) => set({ conversationId: id }),

  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),

  setMessages: (messages) => set({ messages }),

  setIsTyping: (isTyping) => set({ isTyping }),

  setIsLoading: (isLoading) => set({ isLoading }),

  setMode: (mode) => set({ mode }),

  clearConversation: () =>
    set({ conversationId: null, messages: [], isTyping: false }),
}));
