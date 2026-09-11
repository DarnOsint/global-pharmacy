-- Global Pharmacy — Migration for EXISTING Supabase databases.
-- Run this in your Supabase SQL Editor if you created your tables before
-- the currency / alert_days columns and the budgets table were added.
-- Fresh setups can use schema.sql directly and skip this file.

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'SSP',
  ADD COLUMN IF NOT EXISTS alert_days INTEGER NOT NULL DEFAULT 30;

ALTER TABLE sales
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'SSP';

ALTER TABLE purchases
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'SSP';

ALTER TABLE expenses
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'SSP';

CREATE TABLE IF NOT EXISTS budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL DEFAULT 'other',
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'SSP',
  period TEXT NOT NULL DEFAULT 'monthly',
  month TEXT NOT NULL DEFAULT '',
  spent NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'budgets') THEN
    CREATE POLICY "Allow all" ON budgets FOR ALL USING (true);
  END IF;
END $$;

-- App settings (synced admin values such as the SSP/USD exchange rate)
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'settings') THEN
    CREATE POLICY "Allow all" ON settings FOR ALL USING (true);
  END IF;
END $$;
-- Rename role value: store_manager -> general_manager
-- Renamed in place so existing rows keep their role automatically (PG 10+).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'store_manager') THEN
    ALTER TYPE user_role RENAME VALUE 'store_manager' TO 'general_manager';
  END IF;
END $$;
