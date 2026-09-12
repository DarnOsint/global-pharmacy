-- Global Pharmacy — Migration for EXISTING Supabase databases.
-- Run this in your Supabase SQL Editor if you created your tables before
-- the currency / alert_days columns and the budgets table were added.
-- Fresh setups can use schema.sql directly and skip this file.

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'SSP',
  ADD COLUMN IF NOT EXISTS alert_days INTEGER NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS product_code TEXT NOT NULL DEFAULT '';

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
-- AUDIT LOGS (detailed record of who did what, when, what changed, and the effect)
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  staff_name TEXT NOT NULL DEFAULT '',
  staff_role TEXT NOT NULL DEFAULT '',
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL DEFAULT '',
  entity_id TEXT NOT NULL DEFAULT '',
  entity_name TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL,
  old_values JSONB,
  new_values JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_staff ON audit_logs(staff_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'audit_logs') THEN
    CREATE POLICY "Allow all" ON audit_logs FOR ALL USING (true);
  END IF;
END $$;

-- Re-seed the authoritative HR staff records and PINs
INSERT INTO staff (id, first_name, last_name, role, phone, email, hire_date, salary) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Clara', 'Evelino Modi', 'admin', '+211928000601', 'clara@globalpharmacy.ss', '2024-01-15', 300000),
  ('a0000000-0000-0000-0000-000000000002', 'Dr. Denis', 'Sebit', 'pharmacist', '+211915747474', 'denis@globalpharmacy.ss', '2024-03-20', 300000),
  ('a0000000-0000-0000-0000-000000000003', 'Dr. Jasinta', 'Robert', 'pharmacist', '+211925687772', 'jasinta@globalpharmacy.ss', '2024-06-10', 300000),
  ('a0000000-0000-0000-0000-000000000004', 'Mr. Emmanuel', 'Morbe', 'cashier', '+211929420661', 'emmanuel@globalpharmacy.ss', '2025-01-05', 200000),
  ('a0000000-0000-0000-0000-000000000005', 'Dr. Mary', 'Evelino', 'general_manager', '+256778551051', 'mary@globalpharmacy.ss', '2025-06-15', 280000),
  ('a0000000-0000-0000-0000-000000000006', 'Dr. Bortel', 'Ohesa', 'pharmacist', '+211920123456', 'bortel@globalpharmacy.ss', '2026-01-01', 250000)
ON CONFLICT (id) DO UPDATE SET
  first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name,
  role = EXCLUDED.role, phone = EXCLUDED.phone,
  email = EXCLUDED.email, hire_date = EXCLUDED.hire_date, salary = EXCLUDED.salary;

-- Add UNIQUE constraint on staff_id so PIN upserts can use ON CONFLICT (staff_id)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'staff_pins_staff_id_key') THEN
    ALTER TABLE staff_pins ADD CONSTRAINT staff_pins_staff_id_key UNIQUE (staff_id);
  END IF;
END $$;

-- Delete legacy PIN rows (old seeded IDs/PINs) and install authoritative PINs
DELETE FROM staff_pins WHERE staff_id::text NOT LIKE 'a0000000-%';
INSERT INTO staff_pins (staff_id, pin) VALUES
  ('a0000000-0000-0000-0000-000000000001', '0887'),
  ('a0000000-0000-0000-0000-000000000002', '5184'),
  ('a0000000-0000-0000-0000-000000000003', '9067'),
  ('a0000000-0000-0000-0000-000000000004', '2741'),
  ('a0000000-0000-0000-0000-000000000005', '6358'),
  ('a0000000-0000-0000-0000-000000000006', '4819')
ON CONFLICT (staff_id) DO UPDATE SET pin = EXCLUDED.pin;
