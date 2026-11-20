-- =====================================================
-- LUMA PRESETS — Supabase Database Schema
-- Jalankan SQL ini di Supabase Dashboard > SQL Editor
-- =====================================================

-- 1. Tabel Produk
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  subtitle TEXT DEFAULT '',
  category TEXT DEFAULT 'General',
  price INTEGER NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'AVAILABLE',
  available BOOLEAN DEFAULT true,
  description TEXT DEFAULT '',
  image TEXT DEFAULT '',
  file TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Tabel Orders
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  amount INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'PENDING',
  access_code TEXT,
  midtrans_snap_token TEXT,
  midtrans_redirect_url TEXT,
  midtrans_transaction_id TEXT,
  payment_type TEXT,
  bundle_items TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  paid_at TIMESTAMPTZ
);

-- 3. Tabel Access Codes
CREATE TABLE IF NOT EXISTS access_codes (
  code TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  order_id TEXT REFERENCES orders(id) ON DELETE SET NULL,
  used BOOLEAN DEFAULT false,
  downloads_count INTEGER DEFAULT 0,
  bundle_items TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  used_at TIMESTAMPTZ
);

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_orders_product ON orders(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_access_codes_product ON access_codes(product_id);
CREATE INDEX IF NOT EXISTS idx_access_codes_order ON access_codes(order_id);

-- 5. Row Level Security (opsional, bisa diaktifkan sesuai kebutuhan)
-- ALTER TABLE products ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE access_codes ENABLE ROW LEVEL SECURITY;

-- Policy: products bisa dibaca publik
-- CREATE POLICY "Products are viewable by everyone" ON products FOR SELECT USING (true);
