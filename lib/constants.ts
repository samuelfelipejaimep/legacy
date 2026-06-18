// ─── LEVEL SYSTEM ────────────────────────────────────────────

export interface LevelDef {
  level: number;
  name: string;
  xpRequired: number;
}

// XP requerido para ALCANZAR ese nivel
export const LEVELS: LevelDef[] = [
  { level: 1, name: "Aprendiz", xpRequired: 0 },
  { level: 2, name: "Aprendiz", xpRequired: 200 },
  { level: 3, name: "Aprendiz", xpRequired: 500 },
  { level: 4, name: "Aprendiz", xpRequired: 900 },
  { level: 5, name: "Constructor", xpRequired: 1_400 },
  { level: 6, name: "Constructor", xpRequired: 2_000 },
  { level: 7, name: "Constructor", xpRequired: 2_700 },
  { level: 8, name: "Constructor", xpRequired: 3_500 },
  { level: 9, name: "Constructor", xpRequired: 4_400 },
  { level: 10, name: "Creador", xpRequired: 5_500 },
  { level: 12, name: "Creador", xpRequired: 8_000 },
  { level: 15, name: "Creador", xpRequired: 12_500 },
  { level: 20, name: "Operador", xpRequired: 40_000 },
  { level: 25, name: "Operador", xpRequired: 70_000 },
  { level: 30, name: "Operador", xpRequired: 100_000 },
  { level: 35, name: "Empresario", xpRequired: 120_000 },
  { level: 40, name: "Empresario", xpRequired: 160_000 },
  { level: 45, name: "Empresario", xpRequired: 220_000 },
  { level: 50, name: "Estratega", xpRequired: 300_000 },
  { level: 60, name: "Estratega", xpRequired: 450_000 },
  { level: 70, name: "Estratega", xpRequired: 620_000 },
  { level: 75, name: "Visionario", xpRequired: 750_000 },
  { level: 85, name: "Visionario", xpRequired: 1_100_000 },
  { level: 95, name: "Visionario", xpRequired: 1_600_000 },
  { level: 100, name: "Legacy", xpRequired: 2_000_000 },
];

export function getLevelName(level: number): string {
  const milestones = [1, 5, 10, 20, 35, 50, 75, 100];
  const names: Record<number, string> = {
    1: "Aprendiz",
    5: "Constructor",
    10: "Creador",
    20: "Operador",
    35: "Empresario",
    50: "Estratega",
    75: "Visionario",
    100: "Legacy",
  };

  let name = "Aprendiz";
  for (const milestone of milestones) {
    if (level >= milestone) name = names[milestone];
  }
  return name;
}

export function getXpForLevel(level: number): number {
  const entry = LEVELS.slice()
    .reverse()
    .find((l) => l.level <= level);
  if (!entry) return 0;

  // Interpolate if we're between defined levels
  const next = LEVELS.find((l) => l.level > level);
  if (!next || entry.level === level) return entry.xpRequired;

  const fraction = (level - entry.level) / (next.level - entry.level);
  return Math.round(entry.xpRequired + fraction * (next.xpRequired - entry.xpRequired));
}

export function getXpForNextLevel(level: number): number {
  return getXpForLevel(level + 1);
}

export function getLevelFromXp(xp: number): number {
  let currentLevel = 1;
  for (let lvl = 1; lvl <= 100; lvl++) {
    if (xp >= getXpForLevel(lvl)) currentLevel = lvl;
    else break;
  }
  return currentLevel;
}

// ─── XP REWARDS ──────────────────────────────────────────────

export const XP = {
  REGISTER_TRANSACTION: 5,
  DAILY_LOGIN: 2,
  DAILY_STREAK_BONUS: 10,    // per day in streak
  COMPLETE_OBJECTIVE_BASE: 500,
  MONTHLY_REVIEW: 100,
  SAVE_MONEY: 1,             // per USD saved
  INVEST_MONEY: 2,           // per USD invested
  BUDGET_MONTH_COMPLIANCE: 150,
  FIRST_TRANSACTION: 25,
  VAULT_AVOIDED: 50,         // resisted impulse purchase
} as const;

// ─── CONTROL INDEX ────────────────────────────────────────────

export const CONTROL_INDEX_WEIGHTS = {
  transactionConsistency: 0.25,
  budgetCompliance: 0.30,
  objectiveProgress: 0.25,
  monthlyReviewCompletion: 0.20,
} as const;

// ─── VAULT (CAJA FUERTE) ──────────────────────────────────────

export const VAULT = {
  IMPULSE_THRESHOLD_USD: 1000,
  LIQUIDITY_THRESHOLD_PCT: 0.15,  // 15% of liquid funds
} as const;

// ─── DEFAULT EXCHANGE RATE ────────────────────────────────────

export const DEFAULT_COP_USD_RATE = Number(
  process.env.NEXT_PUBLIC_DEFAULT_COP_USD_RATE ?? 4400
);

// ─── APP NAVIGATION ──────────────────────────────────────────

export const NAV_ITEMS = [
  { href: "/", label: "Centro de Control", shortLabel: "Control" },
  { href: "/midas", label: "MIDAS", shortLabel: "MIDAS" },
  { href: "/objetivos", label: "Objetivos", shortLabel: "Objetivos" },
  { href: "/movimientos", label: "Movimientos", shortLabel: "Movimientos" },
  { href: "/revision", label: "Revisión Mensual", shortLabel: "Revisión" },
] as const;

// ─── OBJECTIVE STATUS LABELS ──────────────────────────────────

export const OBJECTIVE_STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Activo",
  FIXED: "Fijado",
  PAUSED: "Pausado",
  CANCELLED: "Cancelado",
  COMPLETED: "Completado",
};

export const OBJECTIVE_STATUS_COLORS: Record<string, string> = {
  ACTIVE: "text-emerald-400",
  FIXED: "text-blue-400",
  PAUSED: "text-yellow-400",
  CANCELLED: "text-muted-foreground",
  COMPLETED: "text-accent",
};
