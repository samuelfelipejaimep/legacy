import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AppState {
  // Currency display preference
  displayCurrency: "USD" | "COP";
  copToUsdRate: number;
  setDisplayCurrency: (currency: "USD" | "COP") => void;
  setCopToUsdRate: (rate: number) => void;
  toggleCurrency: () => void;

  // Sidebar
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;

  // Profile (cached for UI)
  profileId: string | null;
  displayName: string;
  level: number;
  xp: number;
  controlIndex: number;
  setProfile: (data: {
    profileId: string;
    displayName: string;
    level: number;
    xp: number;
    controlIndex: number;
  }) => void;
  addXp: (amount: number) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Currency
      displayCurrency: "USD",
      copToUsdRate: 4400,
      setDisplayCurrency: (currency) => set({ displayCurrency: currency }),
      setCopToUsdRate: (rate) => set({ copToUsdRate: rate }),
      toggleCurrency: () =>
        set((state) => ({
          displayCurrency: state.displayCurrency === "USD" ? "COP" : "USD",
        })),

      // Sidebar
      sidebarCollapsed: false,
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

      // Profile
      profileId: null,
      displayName: "Usuario",
      level: 1,
      xp: 0,
      controlIndex: 0,
      setProfile: (data) =>
        set({
          profileId: data.profileId,
          displayName: data.displayName,
          level: data.level,
          xp: data.xp,
          controlIndex: data.controlIndex,
        }),
      addXp: (amount) =>
        set((state) => ({
          xp: state.xp + amount,
        })),
    }),
    {
      name: "legacy-app-store",
      partialize: (state) => ({
        displayCurrency: state.displayCurrency,
        copToUsdRate: state.copToUsdRate,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
);

// ─── Selectors ────────────────────────────────────────────────

export const selectDisplayCurrency = (s: AppState) => s.displayCurrency;
export const selectCopToUsdRate = (s: AppState) => s.copToUsdRate;
export const selectToggleCurrency = (s: AppState) => s.toggleCurrency;
export const selectProfile = (s: AppState) => ({
  profileId: s.profileId,
  displayName: s.displayName,
  level: s.level,
  xp: s.xp,
  controlIndex: s.controlIndex,
});
