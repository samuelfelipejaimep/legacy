import type {
  Profile,
  Settings,
  Category,
  Transaction,
  Objective,
  ObjectiveAllocation,
  MonthlyReview,
  MidasConversation,
  MidasMessage,
  HallOfFame,
  StrategicArchive,
  LevelHistory,
} from "@prisma/client";

// ─── Re-exports ───────────────────────────────────────────────
export type {
  Profile,
  Settings,
  Category,
  Transaction,
  Objective,
  ObjectiveAllocation,
  MonthlyReview,
  MidasConversation,
  MidasMessage,
  HallOfFame,
  StrategicArchive,
  LevelHistory,
};

// ─── Extended types with relations ───────────────────────────

export type TransactionWithCategory = Transaction & {
  category: Category;
};

export type TransactionWithAll = Transaction & {
  category: Category;
  allocations: (ObjectiveAllocation & { objective: Objective })[];
};

export type ObjectiveWithRelations = Objective & {
  allocations: ObjectiveAllocation[];
  hallOfFame: HallOfFame | null;
  archive: StrategicArchive | null;
};

export type ProfileWithSettings = Profile & {
  settings: Settings | null;
};

export type ConversationWithMessages = MidasConversation & {
  messages: MidasMessage[];
};

// ─── Dashboard ────────────────────────────────────────────────

export interface DashboardData {
  profile: Profile;
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlyInvested: number;
  monthlySaved: number;
  transactionCount: number;
  activeObjectives: Objective[];
  recentTransactions: TransactionWithCategory[];
  currentMonthReview: MonthlyReview | null;
}

export interface FinancialSnapshot {
  available: number;
  investments: number;
  netWorth: number;
  liquidity: number;
  reserves: number;
  monthlyGrowthPct: number;
  yearlyGrowthPct: number;
  currency: "USD" | "COP";
}

// ─── MIDAS ────────────────────────────────────────────────────

export interface MidasMessage_UI {
  id: string;
  role: "USER" | "MIDAS";
  content: string;
  createdAt: Date;
}

export interface MidasContext {
  profileId: string;
  displayName: string;
  level: number;
  xp: number;
  controlIndex: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  patrimonioTotal: number;
  liquidezDisponible: number;
  capitalEnMision: number;
  escudoFinanciero: number;
  activeObjectives: Pick<Objective, "name" | "targetAmount" | "currentAmount" | "currency" | "status">[];
  recentPatterns?: string;
}

// ─── Forms ────────────────────────────────────────────────────

export interface TransactionFormData {
  type: "INCOME" | "EXPENSE" | "TRANSFER" | "INVESTMENT" | "SAVINGS";
  amount: number;
  currency: "USD" | "COP";
  description: string;
  notes?: string;
  categoryId: string;
  date: string;
  isImpulsive?: boolean;
  objectiveAllocations?: { objectiveId: string; amount: number }[];
}

export interface ObjectiveFormData {
  name: string;
  subtitle?: string;
  targetAmount: number;
  currency: "USD" | "COP";
  targetDate?: string;
  priority?: number;
}

export interface MonthlyReviewFormData {
  totalIncome: number;
  wentWell: string;
  wentWrong: string;
  nextMonthGoal: number;
  priorityChanges?: string;
}

// ─── Server Action results ────────────────────────────────────

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

// ─── Vault Protocol ───────────────────────────────────────────

export interface VaultAlert {
  triggered: boolean;
  amount: number;
  liquidityImpactPct: number;
  affectedObjectives: { name: string; delayDays: number }[];
  recoveryPlan: string;
}

// ─── Redistribution ───────────────────────────────────────────

export type RedistributionTarget =
  | "AUTO"
  | "MANUAL"
  | "ESCUDO_FINANCIERO"
  | "CAPITAL_ATAQUE";

export interface RedistributionRequest {
  objectiveId: string;
  fundsRecovered: number;
  target: RedistributionTarget;
  targetObjectiveId?: string;
}
