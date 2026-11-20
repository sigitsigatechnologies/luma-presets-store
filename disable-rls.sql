-- ========================================================
-- LUMA PRESETS — Jalankan ini di Supabase SQL Editor
-- Dashboard > SQL Editor > New Query > Paste & Run
-- Link: https://supabase.com/dashboard/project/qtykwunkobhycvbdcoqp/sql/new
-- ========================================================

-- 1. Tambahkan kolom bundle_items jika belum ada
ALTER TABLE orders ADD COLUMN IF NOT EXISTS bundle_items TEXT;
ALTER TABLE access_codes ADD COLUMN IF NOT EXISTS bundle_items TEXT;

-- 2. Nonaktifkan Row Level Security (RLS) agar backend bisa simpan & update data
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE access_codes DISABLE ROW LEVEL SECURITY;
