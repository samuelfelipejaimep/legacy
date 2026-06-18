-- LEGACY — Initial SQL Setup
-- Run this in Supabase SQL Editor or psql

-- ─── EXTENSIONS ──────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── ENUMS ───────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE "Currency" AS ENUM ('USD', 'COP');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "ObjectiveStatus" AS ENUM ('ACTIVE', 'FIXED', 'PAUSED', 'CANCELLED', 'COMPLETED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "TransactionType" AS ENUM ('INCOME', 'EXPENSE', 'TRANSFER', 'INVESTMENT', 'SAVINGS');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "MidasRole" AS ENUM ('USER', 'MIDAS');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── TABLES ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS profiles (
  id                TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id           TEXT UNIQUE NOT NULL,
  display_name      TEXT NOT NULL,
  avatar_url        TEXT,
  level             INTEGER NOT NULL DEFAULT 1,
  xp                INTEGER NOT NULL DEFAULT 0,
  control_index     DECIMAL(5,2) NOT NULL DEFAULT 0,
  shield_balance    DECIMAL(15,2) NOT NULL DEFAULT 0,
  preferred_currency "Currency" NOT NULL DEFAULT 'USD',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS settings (
  id                      TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  profile_id              TEXT UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  cop_to_usd_rate         DECIMAL(10,2) NOT NULL DEFAULT 4400,
  preferred_currency      "Currency" NOT NULL DEFAULT 'USD',
  notifications_enabled   BOOLEAN NOT NULL DEFAULT true,
  vault_threshold_usd     DECIMAL(10,2) NOT NULL DEFAULT 1000,
  vault_liquidity_pct     DECIMAL(5,2) NOT NULL DEFAULT 15,
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categories (
  id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name       TEXT UNIQUE NOT NULL,
  icon       TEXT,
  color      TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_system  BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transactions (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  profile_id  TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type        "TransactionType" NOT NULL,
  amount      DECIMAL(15,2) NOT NULL,
  currency    "Currency" NOT NULL DEFAULT 'USD',
  amount_usd  DECIMAL(15,2) NOT NULL,
  description TEXT NOT NULL,
  notes       TEXT,
  date        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  category_id TEXT NOT NULL REFERENCES categories(id),
  is_impulsive BOOLEAN NOT NULL DEFAULT false,
  vault_flag  BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS objectives (
  id             TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  profile_id     TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  subtitle       TEXT,
  target_amount  DECIMAL(15,2) NOT NULL,
  current_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  currency       "Currency" NOT NULL DEFAULT 'USD',
  status         "ObjectiveStatus" NOT NULL DEFAULT 'ACTIVE',
  priority       INTEGER NOT NULL DEFAULT 0,
  xp_reward      INTEGER NOT NULL DEFAULT 0,
  started_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at   TIMESTAMPTZ,
  cancelled_at   TIMESTAMPTZ,
  target_date    TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS objective_allocations (
  id             TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  transaction_id TEXT NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  objective_id   TEXT NOT NULL REFERENCES objectives(id) ON DELETE CASCADE,
  amount         DECIMAL(15,2) NOT NULL,
  currency       "Currency" NOT NULL DEFAULT 'USD',
  allocated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS monthly_reviews (
  id               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  profile_id       TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  month            INTEGER NOT NULL,
  year             INTEGER NOT NULL,
  total_income     DECIMAL(15,2) NOT NULL DEFAULT 0,
  total_expenses   DECIMAL(15,2) NOT NULL DEFAULT 0,
  total_saved      DECIMAL(15,2) NOT NULL DEFAULT 0,
  total_invested   DECIMAL(15,2) NOT NULL DEFAULT 0,
  went_well        TEXT,
  went_wrong       TEXT,
  next_month_goal  DECIMAL(15,2),
  priority_changes TEXT,
  midas_summary    TEXT,
  control_index_at DECIMAL(5,2) NOT NULL DEFAULT 0,
  xp_gained        INTEGER NOT NULL DEFAULT 0,
  completed_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (profile_id, month, year)
);

CREATE TABLE IF NOT EXISTS midas_conversations (
  id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title      TEXT,
  context    TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS midas_messages (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  conversation_id TEXT NOT NULL REFERENCES midas_conversations(id) ON DELETE CASCADE,
  role            "MidasRole" NOT NULL,
  content         TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS level_history (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  profile_id  TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  from_level  INTEGER NOT NULL,
  to_level    INTEGER NOT NULL,
  reason      TEXT,
  xp_at_level INTEGER NOT NULL,
  achieved_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hall_of_fame (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  objective_id TEXT UNIQUE NOT NULL REFERENCES objectives(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ NOT NULL,
  notes        TEXT,
  photo_url    TEXT,
  final_amount DECIMAL(15,2) NOT NULL,
  xp_earned    INTEGER NOT NULL DEFAULT 0,
  emotion      TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS strategic_archive (
  id               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  objective_id     TEXT UNIQUE NOT NULL REFERENCES objectives(id) ON DELETE CASCADE,
  cancelled_at     TIMESTAMPTZ NOT NULL,
  reason           TEXT,
  funds_recovered  DECIMAL(15,2) NOT NULL DEFAULT 0,
  redistributed_to TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── INDEXES ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_transactions_profile_date ON transactions(profile_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_objectives_profile_status ON objectives(profile_id, status);
CREATE INDEX IF NOT EXISTS idx_monthly_reviews_profile ON monthly_reviews(profile_id, year DESC, month DESC);
CREATE INDEX IF NOT EXISTS idx_midas_messages_conv ON midas_messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_level_history_profile ON level_history(profile_id, achieved_at DESC);

-- ─── UPDATED_AT TRIGGER ──────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DO $$ DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['profiles','settings','transactions','objectives','monthly_reviews','midas_conversations']
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%s_updated_at ON %s', t, t);
    EXECUTE format('CREATE TRIGGER trg_%s_updated_at BEFORE UPDATE ON %s FOR EACH ROW EXECUTE FUNCTION update_updated_at()', t, t);
  END LOOP;
END $$;

-- ─── SEED CATEGORIES ─────────────────────────────────────────
INSERT INTO categories (name, icon, color, is_default, is_system) VALUES
  ('Ingresos',           '💵', '#10B981', true, true),
  ('Relationship',       '💑', '#FF6B6B', true, true),
  ('Familia',            '👨‍👩‍👧‍👦', '#FF9F43', true, true),
  ('Amigos',             '👫', '#F9CA24', true, true),
  ('Mercado',            '🛒', '#6AB04C', true, true),
  ('Comida',             '🍽️', '#22A6B3', true, true),
  ('Transporte',         '🚗', '#7ED6DF', true, true),
  ('Servicios',          '⚡', '#686DE0', true, true),
  ('Entretenimiento',    '🎮', '#BE2EDD', true, true),
  ('Viajes',             '✈️', '#4834D4', true, true),
  ('Compras Personales', '🛍️', '#EB3B5A', true, true),
  ('Inversiones',        '📈', '#20BF6B', true, true),
  ('Capital de Ataque',  '⚔️', '#3867D6', true, true),
  ('Zona de Riesgo',     '⚠️', '#E74C3C', true, true)
ON CONFLICT (name) DO NOTHING;
