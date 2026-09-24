-- Global Pharmacy — Canonical Product Inventory
-- Replaces the products table with the 22-item live inventory
-- (all sales/purchase line items pointing at old products are removed first).
-- Run this in your Supabase SQL Editor to reset the inventory.
-- Prices and stock are intentionally 0 (SSP) until set from the app.

DELETE FROM sale_items;
DELETE FROM purchase_items;
DELETE FROM products;

INSERT INTO products (id, name, generic_name, category, sku, product_code, barcode, unit_price, cost_price, currency, quantity_in_stock, reorder_level, alert_days, expiry_date, batch_number, manufacturer, description, image_url, is_active, created_at, updated_at) VALUES
  ('00000000-0000-4000-8000-000000000101', 'E-FIXEM-DS', 'Cefixime', 'antibiotics', 'EFX-DS', '', NULL, 0, 0, 'SSP', 0, 10, 90, '2028-12-31', '', '', NULL, NULL, true, now(), now()),
  ('00000000-0000-4000-8000-000000000102', 'CONIA Cefixime Oral Suspension', 'Cefixime', 'antibiotics', 'CONIA-CEFX', '', NULL, 0, 0, 'SSP', 0, 10, 90, '2028-12-31', '', '', NULL, NULL, true, now(), now()),
  ('00000000-0000-4000-8000-000000000103', 'Kemoxyl', 'Amoxicillin', 'antibiotics', 'KEM-AMX', '', NULL, 0, 0, 'SSP', 0, 10, 90, '2028-12-31', '', '', NULL, NULL, true, now(), now()),
  ('00000000-0000-4000-8000-000000000104', 'Cloxam', 'Cloxacillin', 'antibiotics', 'CLX', '', NULL, 0, 0, 'SSP', 0, 10, 90, '2028-12-31', '', '', NULL, NULL, true, now(), now()),
  ('00000000-0000-4000-8000-000000000105', 'SONCLAV 228.5 mg', 'Amoxicillin/Clavulanate', 'antibiotics', 'SON-228', '', NULL, 0, 0, 'SSP', 0, 10, 90, '2028-12-31', '', '', NULL, NULL, true, now(), now()),
  ('00000000-0000-4000-8000-000000000106', 'SONCLAV 156.25 mg', 'Amoxicillin/Clavulanate', 'antibiotics', 'SON-156', '', NULL, 0, 0, 'SSP', 0, 10, 90, '2028-12-31', '', '', NULL, NULL, true, now(), now()),
  ('00000000-0000-4000-8000-000000000107', 'SONCLAV 457 mg', 'Amoxicillin/Clavulanate', 'antibiotics', 'SON-457', '', NULL, 0, 0, 'SSP', 0, 10, 90, '2028-12-31', '', '', NULL, NULL, true, now(), now()),
  ('00000000-0000-4000-8000-000000000108', 'BabyVit D3 Drops', 'Vitamin D3', 'vitamins', 'BVIT-D3', '', NULL, 0, 0, 'SSP', 0, 10, 90, '2028-12-31', '', '', NULL, NULL, true, now(), now()),
  ('00000000-0000-4000-8000-000000000109', 'Apetamax Syrup', 'Appetite Stimulant', 'other', 'APM-SYR', '', NULL, 0, 0, 'SSP', 0, 10, 90, '2028-12-31', '', '', NULL, NULL, true, now(), now()),
  ('00000000-0000-4000-8000-000000000110', 'Magnavit Tonique', 'Multivitamin Tonic', 'vitamins', 'MGV-TON', '', NULL, 0, 0, 'SSP', 0, 10, 90, '2028-12-31', '', '', NULL, NULL, true, now(), now()),
  ('00000000-0000-4000-8000-000000000111', 'Rivaclav 312.5 mg/5 ml', 'Amoxicillin/Clavulanate', 'antibiotics', 'RIV-312', '', NULL, 0, 0, 'SSP', 0, 10, 90, '2028-12-31', '', '', NULL, NULL, true, now(), now()),
  ('00000000-0000-4000-8000-000000000112', 'Rivaclav 228.5 mg/5 ml', 'Amoxicillin/Clavulanate', 'antibiotics', 'RIV-228', '', NULL, 0, 0, 'SSP', 0, 10, 90, '2028-12-31', '', '', NULL, NULL, true, now(), now()),
  ('00000000-0000-4000-8000-000000000113', 'AZEPRO-200 Suspension', 'Azithromycin', 'antibiotics', 'AZP-200', '', NULL, 0, 0, 'SSP', 0, 10, 90, '2028-12-31', '', '', NULL, NULL, true, now(), now()),
  ('00000000-0000-4000-8000-000000000114', 'Zinc Sulfate Oral Solution', 'Zinc Sulfate', 'vitamins', 'ZNS-OOS', '', NULL, 0, 0, 'SSP', 0, 10, 90, '2028-12-31', '', '', NULL, NULL, true, now(), now()),
  ('00000000-0000-4000-8000-000000000115', 'L-Trim Oral Suspension BP', 'Multivitamin', 'other', 'LTRM-SUS', '', NULL, 0, 0, 'SSP', 0, 10, 90, '2028-12-31', '', '', NULL, NULL, true, now(), now()),
  ('00000000-0000-4000-8000-000000000116', 'Co-Trimoxazole Paediatric Oral Suspension', 'Co-trimoxazole', 'antibiotics', 'CTX-PED', '', NULL, 0, 0, 'SSP', 0, 10, 90, '2028-12-31', '', '', NULL, NULL, true, now(), now()),
  ('00000000-0000-4000-8000-000000000117', 'Polygel', 'Antacid Gel', 'gastrointestinal', 'PLYGEL', '', NULL, 0, 0, 'SSP', 0, 10, 90, '2028-12-31', '', '', NULL, NULL, true, now(), now()),
  ('00000000-0000-4000-8000-000000000118', 'Eau Digestive', 'Digestive Aid', 'gastrointestinal', 'EAU-DIG', '', NULL, 0, 0, 'SSP', 0, 10, 90, '2028-12-31', '', '', NULL, NULL, true, now(), now()),
  ('00000000-0000-4000-8000-000000000119', 'Sonidex Oral Syrup', 'Dexamethasone', 'other', 'SONIDX', '', NULL, 0, 0, 'SSP', 0, 10, 90, '2028-12-31', '', '', NULL, NULL, true, now(), now()),
  ('00000000-0000-4000-8000-000000000120', 'Pulmocare', 'Respiratory Nutrition', 'respiratory', 'PLMCARE', '', NULL, 0, 0, 'SSP', 0, 10, 90, '2028-12-31', '', '', NULL, NULL, true, now(), now()),
  ('00000000-0000-4000-8000-000000000121', 'Coflex Cough Syrup', 'Cough Preparation', 'respiratory', 'CFLX-CGH', '', NULL, 0, 0, 'SSP', 0, 10, 90, '2028-12-31', '', '', NULL, NULL, true, now(), now()),
  ('00000000-0000-4000-8000-000000000122', 'Bronchophane Oral Solution', 'Bronchodilator', 'respiratory', 'BRNP-OOS', '', NULL, 0, 0, 'SSP', 0, 10, 90, '2028-12-31', '', '', NULL, NULL, true, now(), now())
ON CONFLICT (id) DO NOTHING;