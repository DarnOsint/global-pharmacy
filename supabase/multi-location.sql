-- Global Pharmacy — Multi-location migration.
-- Run AFTER schema.sql and migration.sql (existing installs: run this file only).
-- Safe to re-run. Run it in the Supabase SQL Editor, then run the PIN seed script
-- described in scripts/seed-staff-pins.mjs. Deploy the matching app release with it:
-- this file revokes all direct client access, so the old app stops working on purpose.

-- ─── Locations ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO locations (id, code, name) VALUES
  ('c1000000-0000-4000-8000-000000000001', 'GUDELE', 'Global Pharmacy — Gudele'),
  ('c1000000-0000-4000-8000-000000000002', 'HAI-TIJANIAH', 'Global Pharmacy — Hai Tijaniah')
ON CONFLICT (id) DO NOTHING;

-- Staff membership. Admins and general managers see every location by role,
-- so membership is mainly for pharmacists and cashiers (one location each).
CREATE TABLE IF NOT EXISTS staff_locations (
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (staff_id, location_id)
);

-- Existing staff all belong to Gudele. Hai Tijaniah staff are assigned by the admin.
INSERT INTO staff_locations (staff_id, location_id)
SELECT id, 'c1000000-0000-4000-8000-000000000001' FROM staff
ON CONFLICT DO NOTHING;

-- ─── location_id on every operational table ─────────────────────────────────
-- Existing rows belong to Gudele (the location that was already running).
DO $$
DECLARE
  t TEXT;
  gudele CONSTANT UUID := 'c1000000-0000-4000-8000-000000000001';
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'suppliers', 'products', 'customers', 'sales', 'sale_items',
    'purchases', 'purchase_items', 'expenses', 'budgets', 'payroll', 'audit_logs'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES locations(id)', t);
    EXECUTE format('UPDATE public.%I SET location_id = %L WHERE location_id IS NULL', t, gudele);
    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN location_id SET NOT NULL', t);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_location ON public.%I (location_id)', t, t);
  END LOOP;
END $$;

-- Uniqueness becomes per location: each site numbers its own products and invoices.
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_sku_key;
CREATE UNIQUE INDEX IF NOT EXISTS products_location_sku_key ON products (location_id, sku);

ALTER TABLE sales DROP CONSTRAINT IF EXISTS sales_invoice_number_key;
CREATE UNIQUE INDEX IF NOT EXISTS sales_location_invoice_key ON sales (location_id, invoice_number);

ALTER TABLE purchases DROP CONSTRAINT IF EXISTS purchases_invoice_number_key;
CREATE UNIQUE INDEX IF NOT EXISTS purchases_location_invoice_key ON purchases (location_id, invoice_number);

-- ─── Settings are per location ──────────────────────────────────────────────
ALTER TABLE settings ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES locations(id);
UPDATE settings SET location_id = 'c1000000-0000-4000-8000-000000000001' WHERE location_id IS NULL;
ALTER TABLE settings ALTER COLUMN location_id SET NOT NULL;
ALTER TABLE settings DROP CONSTRAINT IF EXISTS settings_pkey;
ALTER TABLE settings ADD PRIMARY KEY (location_id, key);

-- ─── Staff PINs are stored as salted hashes ─────────────────────────────────
-- scripts/seed-staff-pins.mjs fills pin_salt / pin_hash and clears the plaintext pin.
ALTER TABLE staff_pins ADD COLUMN IF NOT EXISTS pin_salt TEXT;
ALTER TABLE staff_pins ADD COLUMN IF NOT EXISTS pin_hash TEXT;
ALTER TABLE staff_pins ALTER COLUMN pin DROP NOT NULL;
ALTER TABLE staff_pins DROP CONSTRAINT IF EXISTS staff_pins_pin_key;
ALTER TABLE staff_pins ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- ─── Login rate limiting ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pin_attempts (
  id BIGSERIAL PRIMARY KEY,
  ip TEXT NOT NULL,
  device_id TEXT NOT NULL,
  success BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pin_attempts_ip ON pin_attempts (ip, created_at);
CREATE INDEX IF NOT EXISTS idx_pin_attempts_device ON pin_attempts (device_id, created_at);

-- ─── Server-side sessions (logout and revocation) ──────────────────────────
-- One row per signed-in browser. The cookie carries the row id; logout sets revoked_at.
CREATE TABLE IF NOT EXISTS auth_sessions (
  id UUID PRIMARY KEY,
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_staff ON auth_sessions (staff_id);
ALTER TABLE auth_sessions ENABLE ROW LEVEL SECURITY;

-- ─── Lock the database down ─────────────────────────────────────────────────
-- Every table is reachable only through the server (service role bypasses RLS).
-- The browser's anon key gets nothing: no policies and no grants.
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
  FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', r.tablename);
  END LOOP;
END $$;

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;

-- ─── Hai Tijaniah: copy the Gudele catalog (separate rows, new ids) ─────────
-- Suppliers and products are copied with fresh ids so the two sites never share rows.
-- Stock starts at 0 at Hai Tijaniah; stock is received there through purchases.
-- Safe to re-run: it does nothing if Hai Tijaniah already has products.
DO $$
DECLARE
  gudele CONSTANT UUID := 'c1000000-0000-4000-8000-000000000001';
  hai CONSTANT UUID := 'c1000000-0000-4000-8000-000000000002';
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE location_id = hai) THEN
    CREATE TEMP TABLE sup_map ON COMMIT DROP AS
      SELECT id AS old_id, gen_random_uuid() AS new_id FROM suppliers WHERE location_id = gudele;

    INSERT INTO suppliers (id, name, contact_person, phone, email, address, city, notes, is_active, created_at, location_id)
    SELECT m.new_id, s.name, s.contact_person, s.phone, s.email, s.address, s.city, s.notes, s.is_active, s.created_at, hai
    FROM suppliers s JOIN sup_map m ON m.old_id = s.id;

    CREATE TEMP TABLE prod_map ON COMMIT DROP AS
      SELECT id AS old_id, gen_random_uuid() AS new_id FROM products WHERE location_id = gudele;

    INSERT INTO products (
      id, name, generic_name, category, supplier_id, sku, product_code, barcode,
      unit_price, cost_price, currency, quantity_in_stock, reorder_level, alert_days,
      expiry_date, batch_number, manufacturer, description, image_url, is_active,
      created_at, updated_at, location_id
    )
    SELECT
      m.new_id, p.name, p.generic_name, p.category,
      (SELECT sm.new_id FROM sup_map sm WHERE sm.old_id = p.supplier_id),
      p.sku, p.product_code, p.barcode,
      p.unit_price, p.cost_price, p.currency, 0, p.reorder_level, p.alert_days,
      p.expiry_date, p.batch_number, p.manufacturer, p.description, p.image_url, p.is_active,
      now(), now(), hai
    FROM products p JOIN prod_map m ON m.old_id = p.id;

    INSERT INTO settings (location_id, key, value, updated_at)
    SELECT hai, key, value, now() FROM settings WHERE location_id = gudele
    ON CONFLICT (location_id, key) DO NOTHING;
  END IF;
END $$;

-- ─── Cross-site summary (owners' dashboard) ────────────────────────────────
-- Returns one JSON object per location: sales, expenses and stock grouped by
-- currency (no currency conversion), plus low-stock and expiring product counts.
CREATE INDEX IF NOT EXISTS idx_sales_location_created ON sales (location_id, created_at);

CREATE OR REPLACE FUNCTION location_summary(p_from TIMESTAMPTZ, p_to TIMESTAMPTZ)
RETURNS JSONB
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'location_id', l.id,
      'code', l.code,
      'name', l.name,
      'is_active', l.is_active,
      'sales', COALESCE((
        SELECT jsonb_agg(jsonb_build_object('currency', x.currency, 'count', x.cnt, 'revenue', x.revenue))
        FROM (
          SELECT s.currency,
                 COUNT(*) AS cnt,
                 COALESCE(SUM(s.total) FILTER (WHERE s.status = 'completed'), 0) AS revenue
          FROM sales s
          WHERE s.location_id = l.id AND s.created_at >= p_from AND s.created_at < p_to
          GROUP BY s.currency
        ) x), '[]'::jsonb),
      'expenses', COALESCE((
        SELECT jsonb_agg(jsonb_build_object('currency', x.currency, 'amount', x.amount))
        FROM (
          SELECT e.currency, COALESCE(SUM(e.amount), 0) AS amount
          FROM expenses e
          WHERE e.location_id = l.id AND e.date >= p_from::date AND e.date < p_to::date
          GROUP BY e.currency
        ) x), '[]'::jsonb),
      'stock', COALESCE((
        SELECT jsonb_agg(jsonb_build_object(
                 'currency', x.currency, 'units', x.units,
                 'cost_value', x.cost_value, 'retail_value', x.retail_value))
        FROM (
          SELECT p.currency,
                 SUM(p.quantity_in_stock) AS units,
                 SUM(p.quantity_in_stock * p.cost_price) AS cost_value,
                 SUM(p.quantity_in_stock * p.unit_price) AS retail_value
          FROM products p
          WHERE p.location_id = l.id AND p.is_active
          GROUP BY p.currency
        ) x), '[]'::jsonb),
      'low_stock', (
        SELECT COUNT(*) FROM products p
        WHERE p.location_id = l.id AND p.is_active AND p.quantity_in_stock <= p.reorder_level),
      'expiring', (
        SELECT COUNT(*) FROM products p
        WHERE p.location_id = l.id AND p.is_active AND p.expiry_date <= CURRENT_DATE + p.alert_days)
    )
    ORDER BY l.code
  ), '[]'::jsonb)
  FROM locations l;
$$;

REVOKE ALL ON FUNCTION location_summary(TIMESTAMPTZ, TIMESTAMPTZ) FROM PUBLIC, anon, authenticated;
