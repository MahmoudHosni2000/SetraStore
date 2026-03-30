/*
  ============================================================
  SELF-CONTAINED SEED — E-Commerce Cosmetics Store (Supabase)
  ============================================================

  This file is fully self-contained:
    Step 1 — Create all schema objects (tables, indexes, triggers,
              RLS policies) — identical to the migration files.
    Step 2 — Insert realistic test data for every table so that
              all foreign-key relationships are visible in the
              Supabase Table Editor and Schema Visualizer.

  HOW TO RUN:
    Open Supabase Dashboard → SQL Editor, paste this entire file
    and click Run.  The script is idempotent (IF NOT EXISTS /
    ON CONFLICT DO NOTHING) and safe to run more than once.

  TEST CREDENTIALS (all accounts use password: Password123!)
    admin@glamstore.com       — admin account
    sarah.johnson@email.com   — customer
    emily.chen@email.com      — customer
    jessica.williams@email.com— customer
    olivia.martinez@email.com — customer
*/


-- ============================================================
-- STEP 1 : SCHEMA
-- ============================================================

-- ----------------------------------------------------------
-- profiles
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
  id         uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name  text,
  email      text UNIQUE NOT NULL,
  phone      text,
  address    text,
  is_admin   boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='profiles' AND policyname='Users can view own profile') THEN
    CREATE POLICY "Users can view own profile"   ON profiles FOR SELECT TO authenticated USING (auth.uid() = id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='profiles' AND policyname='Users can update own profile') THEN
    CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='profiles' AND policyname='Users can insert own profile') THEN
    CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- ----------------------------------------------------------
-- products
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  description   text NOT NULL,
  price         numeric NOT NULL CHECK (price >= 0),
  category      text NOT NULL CHECK (category IN ('Makeup','Skincare','Haircare','Fragrance')),
  brand         text NOT NULL,
  image_url     text NOT NULL,
  stock         integer DEFAULT 0 CHECK (stock >= 0),
  rating        numeric DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  total_reviews integer DEFAULT 0,
  is_featured   boolean DEFAULT false,
  created_at    timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='products' AND policyname='Anyone can view products') THEN
    CREATE POLICY "Anyone can view products" ON products FOR SELECT TO anon, authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='products' AND policyname='Admins can manage products') THEN
    CREATE POLICY "Admins can manage products" ON products FOR ALL TO authenticated
      USING      (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true))
      WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));
  END IF;
END $$;

-- ----------------------------------------------------------
-- orders
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  customer_name    text NOT NULL,
  customer_phone   text NOT NULL,
  customer_address text NOT NULL,
  total_amount     numeric NOT NULL CHECK (total_amount >= 0),
  discount_amount  numeric DEFAULT 0 CHECK (discount_amount >= 0),
  final_amount     numeric NOT NULL CHECK (final_amount >= 0),
  status           text DEFAULT 'pending' CHECK (status IN ('pending','processing','shipped','delivered','cancelled')),
  payment_method   text DEFAULT 'Cash on Delivery',
  coupon_code      text,
  created_at       timestamptz DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='orders' AND policyname='Users can view own orders') THEN
    CREATE POLICY "Users can view own orders"   ON orders FOR SELECT TO authenticated USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='orders' AND policyname='Users can create own orders') THEN
    CREATE POLICY "Users can create own orders" ON orders FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='orders' AND policyname='Admins can view all orders') THEN
    CREATE POLICY "Admins can view all orders"  ON orders FOR SELECT TO authenticated
      USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='orders' AND policyname='Admins can update orders') THEN
    CREATE POLICY "Admins can update orders"    ON orders FOR UPDATE TO authenticated
      USING      (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true))
      WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));
  END IF;
END $$;

-- ----------------------------------------------------------
-- order_items
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_items (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id     uuid NOT NULL REFERENCES orders(id)   ON DELETE CASCADE,
  product_id   uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity     integer NOT NULL CHECK (quantity > 0),
  price        numeric NOT NULL CHECK (price >= 0),
  product_name text NOT NULL
);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='order_items' AND policyname='Users can view own order items') THEN
    CREATE POLICY "Users can view own order items" ON order_items FOR SELECT TO authenticated
      USING (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='order_items' AND policyname='Users can create order items') THEN
    CREATE POLICY "Users can create order items"  ON order_items FOR INSERT TO authenticated
      WITH CHECK (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='order_items' AND policyname='Admins can view all order items') THEN
    CREATE POLICY "Admins can view all order items" ON order_items FOR SELECT TO authenticated
      USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));
  END IF;
END $$;

-- ----------------------------------------------------------
-- cart
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS cart (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity   integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, product_id)
);

ALTER TABLE cart ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='cart' AND policyname='Users can view own cart') THEN
    CREATE POLICY "Users can view own cart"       ON cart FOR SELECT TO authenticated USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='cart' AND policyname='Users can insert to own cart') THEN
    CREATE POLICY "Users can insert to own cart"  ON cart FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='cart' AND policyname='Users can update own cart') THEN
    CREATE POLICY "Users can update own cart"     ON cart FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='cart' AND policyname='Users can delete from own cart') THEN
    CREATE POLICY "Users can delete from own cart" ON cart FOR DELETE TO authenticated USING (auth.uid() = user_id);
  END IF;
END $$;

-- ----------------------------------------------------------
-- wishlist
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS wishlist (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, product_id)
);

ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='wishlist' AND policyname='Users can view own wishlist') THEN
    CREATE POLICY "Users can view own wishlist"       ON wishlist FOR SELECT TO authenticated USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='wishlist' AND policyname='Users can insert to own wishlist') THEN
    CREATE POLICY "Users can insert to own wishlist"  ON wishlist FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='wishlist' AND policyname='Users can delete from own wishlist') THEN
    CREATE POLICY "Users can delete from own wishlist" ON wishlist FOR DELETE TO authenticated USING (auth.uid() = user_id);
  END IF;
END $$;

-- ----------------------------------------------------------
-- reviews
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS reviews (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating     integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment    text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(product_id, user_id)
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='reviews' AND policyname='Anyone can view reviews') THEN
    CREATE POLICY "Anyone can view reviews"     ON reviews FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='reviews' AND policyname='Users can create own reviews') THEN
    CREATE POLICY "Users can create own reviews" ON reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='reviews' AND policyname='Users can update own reviews') THEN
    CREATE POLICY "Users can update own reviews" ON reviews FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='reviews' AND policyname='Users can delete own reviews') THEN
    CREATE POLICY "Users can delete own reviews" ON reviews FOR DELETE TO authenticated USING (auth.uid() = user_id);
  END IF;
END $$;

-- ----------------------------------------------------------
-- coupons
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS coupons (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code                text UNIQUE NOT NULL,
  discount_percentage integer NOT NULL CHECK (discount_percentage > 0 AND discount_percentage <= 100),
  active              boolean DEFAULT true,
  expires_at          timestamptz,
  created_at          timestamptz DEFAULT now()
);

ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='coupons' AND policyname='Anyone can view active coupons') THEN
    CREATE POLICY "Anyone can view active coupons" ON coupons FOR SELECT TO authenticated
      USING (active = true AND (expires_at IS NULL OR expires_at > now()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='coupons' AND policyname='Admins can manage coupons') THEN
    CREATE POLICY "Admins can manage coupons" ON coupons FOR ALL TO authenticated
      USING      (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true))
      WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));
  END IF;
END $$;

-- ----------------------------------------------------------
-- Indexes
-- ----------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_products_category    ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_brand       ON products(brand);
CREATE INDEX IF NOT EXISTS idx_products_featured    ON products(is_featured);
CREATE INDEX IF NOT EXISTS idx_orders_user_id       ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status        ON orders(status);
CREATE INDEX IF NOT EXISTS idx_cart_user_id         ON cart(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_user_id     ON wishlist(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product_id   ON reviews(product_id);

-- ----------------------------------------------------------
-- Trigger: auto-update product rating on review insert/update
-- ----------------------------------------------------------
CREATE OR REPLACE FUNCTION update_product_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE products
  SET
    rating        = (SELECT COALESCE(AVG(rating), 0) FROM reviews WHERE product_id = NEW.product_id),
    total_reviews = (SELECT COUNT(*)                  FROM reviews WHERE product_id = NEW.product_id)
  WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_product_rating_trigger') THEN
    CREATE TRIGGER update_product_rating_trigger
    AFTER INSERT OR UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_product_rating();
  END IF;
END $$;

-- Trigger: auto-update product rating on review delete
CREATE OR REPLACE FUNCTION update_product_rating_on_delete()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE products
  SET
    rating        = (SELECT COALESCE(AVG(rating), 0) FROM reviews WHERE product_id = OLD.product_id),
    total_reviews = (SELECT COUNT(*)                  FROM reviews WHERE product_id = OLD.product_id)
  WHERE id = OLD.product_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_product_rating_on_delete_trigger') THEN
    CREATE TRIGGER update_product_rating_on_delete_trigger
    AFTER DELETE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_product_rating_on_delete();
  END IF;
END $$;


-- ============================================================
-- STEP 2 : SEED DATA
-- ============================================================

-- ----------------------------------------------------------
-- 1. auth.users  (fake test accounts)
--    The SQL Editor in the Supabase dashboard runs as the
--    postgres / service role, so direct inserts into auth.users
--    are permitted. All passwords below hash to "Password123!"
-- ----------------------------------------------------------
INSERT INTO auth.users (
  id, instance_id, aud, role,
  email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
)
VALUES
  (
    '11111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'admin@glamstore.com',
    '$2a$10$PdEBtJyMPaFZoHMGzXQMD.Bb5BRl1mQlUcMTGV7K0sJCiKsQZO1bC',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Store Admin"}',
    now(), now()
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'sarah.johnson@email.com',
    '$2a$10$PdEBtJyMPaFZoHMGzXQMD.Bb5BRl1mQlUcMTGV7K0sJCiKsQZO1bC',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Sarah Johnson"}',
    now(), now()
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'emily.chen@email.com',
    '$2a$10$PdEBtJyMPaFZoHMGzXQMD.Bb5BRl1mQlUcMTGV7K0sJCiKsQZO1bC',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Emily Chen"}',
    now(), now()
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'jessica.williams@email.com',
    '$2a$10$PdEBtJyMPaFZoHMGzXQMD.Bb5BRl1mQlUcMTGV7K0sJCiKsQZO1bC',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Jessica Williams"}',
    now(), now()
  ),
  (
    '55555555-5555-5555-5555-555555555555',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'olivia.martinez@email.com',
    '$2a$10$PdEBtJyMPaFZoHMGzXQMD.Bb5BRl1mQlUcMTGV7K0sJCiKsQZO1bC',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Olivia Martinez"}',
    now(), now()
  )
ON CONFLICT (id) DO NOTHING;


-- ----------------------------------------------------------
-- 2. profiles
-- ----------------------------------------------------------
INSERT INTO profiles (id, full_name, email, phone, address, is_admin, created_at)
VALUES
  (
    '11111111-1111-1111-1111-111111111111',
    'Store Admin', 'admin@glamstore.com',
    '+1-555-000-0001',
    '100 Admin Plaza, Suite 1, New York, NY 10001',
    true,  now() - interval '180 days'
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'Sarah Johnson', 'sarah.johnson@email.com',
    '+1-555-210-4831',
    '42 Maple Street, Apt 3B, Brooklyn, NY 11201',
    false, now() - interval '120 days'
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    'Emily Chen', 'emily.chen@email.com',
    '+1-555-374-9920',
    '7 Sunset Boulevard, Los Angeles, CA 90028',
    false, now() - interval '90 days'
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    'Jessica Williams', 'jessica.williams@email.com',
    '+1-555-561-7732',
    '18 Oak Lane, Austin, TX 78701',
    false, now() - interval '60 days'
  ),
  (
    '55555555-5555-5555-5555-555555555555',
    'Olivia Martinez', 'olivia.martinez@email.com',
    '+1-555-893-2244',
    '305 Cherry Blossom Drive, Chicago, IL 60601',
    false, now() - interval '30 days'
  )
ON CONFLICT (email) DO NOTHING;


-- ----------------------------------------------------------
-- 3. products
-- ----------------------------------------------------------

-- Makeup
INSERT INTO products (id, name, description, price, category, brand, image_url, stock, is_featured, created_at)
VALUES
  ('a1a1a1a1-0000-0000-0000-000000000001', 'Velvet Matte Lipstick',
   'Long-lasting matte lipstick with rich, vibrant color. Infused with vitamin E for soft, smooth lips.',
   24.99, 'Makeup', 'Luxe Beauty',
   'https://images.pexels.com/photos/2533266/pexels-photo-2533266.jpeg?auto=compress&cs=tinysrgb&w=800',
   150, true,  now() - interval '150 days'),
  ('a1a1a1a1-0000-0000-0000-000000000002', 'Flawless Foundation',
   'Full coverage liquid foundation with natural finish. Available in 40 shades.',
   42.00, 'Makeup', 'Perfect Skin',
   'https://images.pexels.com/photos/3762879/pexels-photo-3762879.jpeg?auto=compress&cs=tinysrgb&w=800',
   200, true,  now() - interval '148 days'),
  ('a1a1a1a1-0000-0000-0000-000000000003', 'Glamour Eyeshadow Palette',
   '12-shade eyeshadow palette with matte and shimmer finishes. Highly pigmented.',
   38.50, 'Makeup', 'Color Maven',
   'https://images.pexels.com/photos/2113855/pexels-photo-2113855.jpeg?auto=compress&cs=tinysrgb&w=800',
   100, false, now() - interval '146 days'),
  ('a1a1a1a1-0000-0000-0000-000000000004', 'Volume Max Mascara',
   'Dramatic volume mascara that lengthens and thickens lashes without clumping.',
   19.99, 'Makeup', 'Lash Queen',
   'https://images.pexels.com/photos/3782786/pexels-photo-3782786.jpeg?auto=compress&cs=tinysrgb&w=800',
   180, false, now() - interval '144 days'),
  ('a1a1a1a1-0000-0000-0000-000000000005', 'Radiant Blush Duo',
   'Silky powder blush duo for a natural, healthy glow. Buildable colour.',
   28.00, 'Makeup', 'Bloom Beauty',
   'https://images.pexels.com/photos/3373714/pexels-photo-3373714.jpeg?auto=compress&cs=tinysrgb&w=800',
   120, true,  now() - interval '142 days'),
  ('a1a1a1a1-0000-0000-0000-000000000006', 'Precision Eyeliner Pen',
   'Waterproof liquid eyeliner with ultra-fine tip for precise, smudge-proof lines.',
   16.50, 'Makeup', 'Line & Define',
   'https://images.pexels.com/photos/3764548/pexels-photo-3764548.jpeg?auto=compress&cs=tinysrgb&w=800',
   160, false, now() - interval '140 days'),
  ('a1a1a1a1-0000-0000-0000-000000000007', 'Nude Lip Gloss',
   'Non-sticky lip gloss with high-shine finish. Enriched with nourishing oils.',
   14.99, 'Makeup', 'Glossy Girl',
   'https://images.pexels.com/photos/3785147/pexels-photo-3785147.jpeg?auto=compress&cs=tinysrgb&w=800',
   140, false, now() - interval '138 days'),
  ('a1a1a1a1-0000-0000-0000-000000000008', 'Highlighter Glow Stick',
   'Creamy highlighter stick for instant radiance. Blends seamlessly for a natural glow.',
   22.00, 'Makeup', 'Glow Up',
   'https://images.pexels.com/photos/3373725/pexels-photo-3373725.jpeg?auto=compress&cs=tinysrgb&w=800',
   90, false, now() - interval '136 days'),
  ('a1a1a1a1-0000-0000-0000-000000000009', 'Contour & Sculpt Kit',
   'Professional contouring palette: 3 sculpting shades + highlighter. Long-wear formula.',
   44.00, 'Makeup', 'Color Maven',
   'https://images.pexels.com/photos/2533266/pexels-photo-2533266.jpeg?auto=compress&cs=tinysrgb&w=800',
   75, true,  now() - interval '100 days')
ON CONFLICT (id) DO NOTHING;

-- Skincare
INSERT INTO products (id, name, description, price, category, brand, image_url, stock, is_featured, created_at)
VALUES
  ('b2b2b2b2-0000-0000-0000-000000000001', 'Hydrating Face Serum',
   'Lightweight hyaluronic acid serum that deeply hydrates and plumps skin.',
   45.00, 'Skincare', 'Pure Radiance',
   'https://images.pexels.com/photos/3785147/pexels-photo-3785147.jpeg?auto=compress&cs=tinysrgb&w=800',
   80, true,  now() - interval '130 days'),
  ('b2b2b2b2-0000-0000-0000-000000000002', 'Vitamin C Brightening Cream',
   'Antioxidant cream that brightens and evens skin tone. Reduces dark spots.',
   52.99, 'Skincare', 'Glow Labs',
   'https://images.pexels.com/photos/3735657/pexels-photo-3735657.jpeg?auto=compress&cs=tinysrgb&w=800',
   95, true,  now() - interval '128 days'),
  ('b2b2b2b2-0000-0000-0000-000000000003', 'Gentle Foaming Cleanser',
   'pH-balanced cleanser that removes makeup and impurities without stripping skin.',
   28.50, 'Skincare', 'Clean Beauty',
   'https://images.pexels.com/photos/4041279/pexels-photo-4041279.jpeg?auto=compress&cs=tinysrgb&w=800',
   150, false, now() - interval '126 days'),
  ('b2b2b2b2-0000-0000-0000-000000000004', 'Retinol Night Treatment',
   'Advanced retinol formula that reduces fine lines and improves skin texture.',
   68.00, 'Skincare', 'Youth Restore',
   'https://images.pexels.com/photos/4041392/pexels-photo-4041392.jpeg?auto=compress&cs=tinysrgb&w=800',
   60, false, now() - interval '124 days'),
  ('b2b2b2b2-0000-0000-0000-000000000005', 'Nourishing Eye Cream',
   'Rich eye cream targeting dark circles, puffiness and fine lines.',
   39.99, 'Skincare', 'Bright Eyes',
   'https://images.pexels.com/photos/3785147/pexels-photo-3785147.jpeg?auto=compress&cs=tinysrgb&w=800',
   110, false, now() - interval '122 days'),
  ('b2b2b2b2-0000-0000-0000-000000000006', 'Exfoliating Face Mask',
   'Clay mask with gentle exfoliants that purifies pores and reveals smoother skin.',
   32.00, 'Skincare', 'Spa Luxe',
   'https://images.pexels.com/photos/3762882/pexels-photo-3762882.jpeg?auto=compress&cs=tinysrgb&w=800',
   85, false, now() - interval '120 days'),
  ('b2b2b2b2-0000-0000-0000-000000000007', 'SPF 50 Sunscreen',
   'Broad-spectrum sunscreen with lightweight texture. Protects against UVA and UVB.',
   35.50, 'Skincare', 'Sun Shield',
   'https://images.pexels.com/photos/4041392/pexels-photo-4041392.jpeg?auto=compress&cs=tinysrgb&w=800',
   200, true,  now() - interval '118 days'),
  ('b2b2b2b2-0000-0000-0000-000000000008', 'Rosewater Toner',
   'Alcohol-free toner that balances pH and preps skin for serum.',
   24.99, 'Skincare', 'Botanical Beauty',
   'https://images.pexels.com/photos/3735657/pexels-photo-3735657.jpeg?auto=compress&cs=tinysrgb&w=800',
   130, false, now() - interval '116 days'),
  ('b2b2b2b2-0000-0000-0000-000000000009', 'Niacinamide Pore Minimizer',
   '10% niacinamide serum that visibly reduces pore size and controls shine.',
   36.00, 'Skincare', 'Pure Radiance',
   'https://images.pexels.com/photos/3735657/pexels-photo-3735657.jpeg?auto=compress&cs=tinysrgb&w=800',
   110, false, now() - interval '85 days')
ON CONFLICT (id) DO NOTHING;

-- Haircare
INSERT INTO products (id, name, description, price, category, brand, image_url, stock, is_featured, created_at)
VALUES
  ('c3c3c3c3-0000-0000-0000-000000000001', 'Repair Shampoo',
   'Sulfate-free shampoo that repairs damaged hair and restores shine. Infused with keratin.',
   26.99, 'Haircare', 'Silk & Shine',
   'https://images.pexels.com/photos/3993449/pexels-photo-3993449.jpeg?auto=compress&cs=tinysrgb&w=800',
   140, false, now() - interval '110 days'),
  ('c3c3c3c3-0000-0000-0000-000000000002', 'Deep Conditioning Mask',
   'Intensive treatment mask for dry, damaged hair. Restores moisture and elasticity.',
   34.50, 'Haircare', 'Hair Therapy',
   'https://images.pexels.com/photos/3735657/pexels-photo-3735657.jpeg?auto=compress&cs=tinysrgb&w=800',
   100, false, now() - interval '108 days'),
  ('c3c3c3c3-0000-0000-0000-000000000003', 'Argan Oil Hair Serum',
   'Lightweight serum that tames frizz and adds shine. Non-greasy pure argan oil formula.',
   29.99, 'Haircare', 'Moroccan Gold',
   'https://images.pexels.com/photos/3993449/pexels-photo-3993449.jpeg?auto=compress&cs=tinysrgb&w=800',
   120, true,  now() - interval '106 days'),
  ('c3c3c3c3-0000-0000-0000-000000000004', 'Volumizing Mousse',
   'Lightweight mousse that adds body and volume. Long-lasting hold.',
   18.50, 'Haircare', 'Volume Pro',
   'https://images.pexels.com/photos/3735657/pexels-photo-3735657.jpeg?auto=compress&cs=tinysrgb&w=800',
   90, false, now() - interval '104 days'),
  ('c3c3c3c3-0000-0000-0000-000000000005', 'Heat Protection Spray',
   'Thermal spray that protects hair from heat styling up to 450°F. Silk proteins.',
   22.00, 'Haircare', 'Style Guard',
   'https://images.pexels.com/photos/3993449/pexels-photo-3993449.jpeg?auto=compress&cs=tinysrgb&w=800',
   150, false, now() - interval '102 days'),
  ('c3c3c3c3-0000-0000-0000-000000000006', 'Color Safe Conditioner',
   'Nourishing conditioner for color-treated hair. Extends vibrancy and prevents fading.',
   28.99, 'Haircare', 'Color Lock',
   'https://images.pexels.com/photos/3735657/pexels-photo-3735657.jpeg?auto=compress&cs=tinysrgb&w=800',
   110, false, now() - interval '100 days'),
  ('c3c3c3c3-0000-0000-0000-000000000007', 'Scalp Revival Serum',
   'Revitalising scalp serum with salicylic acid and peppermint oil. Targets dandruff.',
   31.50, 'Haircare', 'Hair Therapy',
   'https://images.pexels.com/photos/3993449/pexels-photo-3993449.jpeg?auto=compress&cs=tinysrgb&w=800',
   65, false, now() - interval '70 days')
ON CONFLICT (id) DO NOTHING;

-- Fragrance
INSERT INTO products (id, name, description, price, category, brand, image_url, stock, is_featured, created_at)
VALUES
  ('d4d4d4d4-0000-0000-0000-000000000001', 'Midnight Rose Perfume',
   'Elegant floral fragrance with notes of rose, jasmine, and sandalwood.',
   78.00, 'Fragrance', 'Essence Luxe',
   'https://images.pexels.com/photos/3738386/pexels-photo-3738386.jpeg?auto=compress&cs=tinysrgb&w=800',
   70, true,  now() - interval '95 days'),
  ('d4d4d4d4-0000-0000-0000-000000000002', 'Ocean Breeze Cologne',
   'Fresh aquatic scent with citrus and marine notes. Light for daily wear.',
   65.00, 'Fragrance', 'Azure Scent',
   'https://images.pexels.com/photos/3738386/pexels-photo-3738386.jpeg?auto=compress&cs=tinysrgb&w=800',
   85, false, now() - interval '93 days'),
  ('d4d4d4d4-0000-0000-0000-000000000003', 'Vanilla Musk Eau de Parfum',
   'Warm and sensual fragrance with vanilla, amber, and white musk.',
   82.50, 'Fragrance', 'Velvet Scents',
   'https://images.pexels.com/photos/3738386/pexels-photo-3738386.jpeg?auto=compress&cs=tinysrgb&w=800',
   60, false, now() - interval '91 days'),
  ('d4d4d4d4-0000-0000-0000-000000000004', 'Citrus Burst Body Spray',
   'Energizing body spray with grapefruit, orange, and bergamot.',
   24.99, 'Fragrance', 'Fresh Start',
   'https://images.pexels.com/photos/3738386/pexels-photo-3738386.jpeg?auto=compress&cs=tinysrgb&w=800',
   150, false, now() - interval '89 days'),
  ('d4d4d4d4-0000-0000-0000-000000000005', 'Lavender Dreams Perfume Oil',
   'Concentrated perfume oil with calming lavender and vanilla. Roll-on application.',
   32.00, 'Fragrance', 'Natural Scents',
   'https://images.pexels.com/photos/3738386/pexels-photo-3738386.jpeg?auto=compress&cs=tinysrgb&w=800',
   100, false, now() - interval '87 days'),
  ('d4d4d4d4-0000-0000-0000-000000000006', 'Exotic Spice Fragrance',
   'Bold oriental fragrance with cardamom, cinnamon, and amber.',
   88.00, 'Fragrance', 'Spice Route',
   'https://images.pexels.com/photos/3738386/pexels-photo-3738386.jpeg?auto=compress&cs=tinysrgb&w=800',
   45, false, now() - interval '85 days'),
  ('d4d4d4d4-0000-0000-0000-000000000007', 'Oud & Amber Intense',
   'Rich, smoky oud blended with amber and patchouli for a deep, long-lasting impression.',
   110.00, 'Fragrance', 'Spice Route',
   'https://images.pexels.com/photos/3738386/pexels-photo-3738386.jpeg?auto=compress&cs=tinysrgb&w=800',
   30, true,  now() - interval '50 days')
ON CONFLICT (id) DO NOTHING;


-- ----------------------------------------------------------
-- 4. coupons
-- ----------------------------------------------------------
INSERT INTO coupons (id, code, discount_percentage, active, expires_at, created_at)
VALUES
  ('cc000001-0000-0000-0000-000000000001', 'WELCOME10', 10, true,  now() + interval '30 days',  now() - interval '60 days'),
  ('cc000002-0000-0000-0000-000000000002', 'BEAUTY20',  20, true,  now() + interval '60 days',  now() - interval '45 days'),
  ('cc000003-0000-0000-0000-000000000003', 'SPRING25',  25, true,  now() + interval '90 days',  now() - interval '30 days'),
  ('cc000004-0000-0000-0000-000000000004', 'FREESHIP',  15, true,  now() + interval '45 days',  now() - interval '20 days'),
  ('cc000005-0000-0000-0000-000000000005', 'GLAM15',    15, true,  now() + interval '45 days',  now() - interval '10 days'),
  ('cc000006-0000-0000-0000-000000000006', 'VIP30',     30, true,  now() + interval '120 days', now() - interval '20 days'),
  ('cc000007-0000-0000-0000-000000000007', 'SUMMER50',  50, true,  now() + interval '180 days', now() - interval '5 days'),
  ('cc000008-0000-0000-0000-000000000008', 'EXPIRED5',   5, false, now() - interval '1 day',    now() - interval '60 days')
ON CONFLICT (code) DO NOTHING;


-- ----------------------------------------------------------
-- 5. orders  (multiple statuses, multiple users)
-- ----------------------------------------------------------
INSERT INTO orders (
  id, user_id, customer_name, customer_phone, customer_address,
  total_amount, discount_amount, final_amount,
  status, payment_method, coupon_code, created_at
)
VALUES
  -- Sarah Johnson — delivered
  (
    'oo000001-0000-0000-0000-000000000001',
    '22222222-2222-2222-2222-222222222222',
    'Sarah Johnson', '+1-555-210-4831', '42 Maple Street, Apt 3B, Brooklyn, NY 11201',
    107.49, 10.75, 96.74, 'delivered', 'Credit Card', 'WELCOME10',
    now() - interval '100 days'
  ),
  -- Sarah Johnson — shipped
  (
    'oo000002-0000-0000-0000-000000000002',
    '22222222-2222-2222-2222-222222222222',
    'Sarah Johnson', '+1-555-210-4831', '42 Maple Street, Apt 3B, Brooklyn, NY 11201',
    78.00, 0.00, 78.00, 'shipped', 'Cash on Delivery', NULL,
    now() - interval '10 days'
  ),
  -- Emily Chen — processing
  (
    'oo000003-0000-0000-0000-000000000003',
    '33333333-3333-3333-3333-333333333333',
    'Emily Chen', '+1-555-374-9920', '7 Sunset Boulevard, Los Angeles, CA 90028',
    170.99, 34.20, 136.79, 'processing', 'Credit Card', 'BEAUTY20',
    now() - interval '5 days'
  ),
  -- Jessica Williams — delivered
  (
    'oo000004-0000-0000-0000-000000000004',
    '44444444-4444-4444-4444-444444444444',
    'Jessica Williams', '+1-555-561-7732', '18 Oak Lane, Austin, TX 78701',
    62.98, 0.00, 62.98, 'delivered', 'PayPal', NULL,
    now() - interval '55 days'
  ),
  -- Jessica Williams — pending
  (
    'oo000005-0000-0000-0000-000000000005',
    '44444444-4444-4444-4444-444444444444',
    'Jessica Williams', '+1-555-561-7732', '18 Oak Lane, Austin, TX 78701',
    130.50, 19.58, 110.92, 'pending', 'Credit Card', 'GLAM15',
    now() - interval '1 day'
  ),
  -- Olivia Martinez — cancelled
  (
    'oo000006-0000-0000-0000-000000000006',
    '55555555-5555-5555-5555-555555555555',
    'Olivia Martinez', '+1-555-893-2244', '305 Cherry Blossom Drive, Chicago, IL 60601',
    44.00, 0.00, 44.00, 'cancelled', 'Cash on Delivery', NULL,
    now() - interval '20 days'
  )
ON CONFLICT (id) DO NOTHING;


-- ----------------------------------------------------------
-- 6. order_items
-- ----------------------------------------------------------
INSERT INTO order_items (id, order_id, product_id, quantity, price, product_name)
VALUES
  -- Order oo000001 (Sarah, delivered): lipstick ×2, serum ×1, mascara ×1
  ('oi000001-0000-0000-0000-000000000001','oo000001-0000-0000-0000-000000000001','a1a1a1a1-0000-0000-0000-000000000001',2,24.99,'Velvet Matte Lipstick'),
  ('oi000002-0000-0000-0000-000000000002','oo000001-0000-0000-0000-000000000001','b2b2b2b2-0000-0000-0000-000000000001',1,45.00,'Hydrating Face Serum'),
  ('oi000003-0000-0000-0000-000000000003','oo000001-0000-0000-0000-000000000001','a1a1a1a1-0000-0000-0000-000000000004',1,19.99,'Volume Max Mascara'),

  -- Order oo000002 (Sarah, shipped): Midnight Rose ×1
  ('oi000004-0000-0000-0000-000000000004','oo000002-0000-0000-0000-000000000002','d4d4d4d4-0000-0000-0000-000000000001',1,78.00,'Midnight Rose Perfume'),

  -- Order oo000003 (Emily, processing): retinol, foundation, niacinamide, vitamin C
  ('oi000005-0000-0000-0000-000000000005','oo000003-0000-0000-0000-000000000003','b2b2b2b2-0000-0000-0000-000000000004',1,68.00,'Retinol Night Treatment'),
  ('oi000006-0000-0000-0000-000000000006','oo000003-0000-0000-0000-000000000003','a1a1a1a1-0000-0000-0000-000000000002',1,42.00,'Flawless Foundation'),
  ('oi000007-0000-0000-0000-000000000007','oo000003-0000-0000-0000-000000000003','b2b2b2b2-0000-0000-0000-000000000009',1,36.00,'Niacinamide Pore Minimizer'),
  ('oi000008-0000-0000-0000-000000000008','oo000003-0000-0000-0000-000000000003','b2b2b2b2-0000-0000-0000-000000000002',1,52.99,'Vitamin C Brightening Cream'),

  -- Order oo000004 (Jessica, delivered): argan oil, shampoo, heat spray
  ('oi000009-0000-0000-0000-000000000009','oo000004-0000-0000-0000-000000000004','c3c3c3c3-0000-0000-0000-000000000003',1,29.99,'Argan Oil Hair Serum'),
  ('oi000010-0000-0000-0000-000000000010','oo000004-0000-0000-0000-000000000004','c3c3c3c3-0000-0000-0000-000000000001',1,26.99,'Repair Shampoo'),
  ('oi000011-0000-0000-0000-000000000011','oo000004-0000-0000-0000-000000000004','c3c3c3c3-0000-0000-0000-000000000005',1,22.00,'Heat Protection Spray'),

  -- Order oo000005 (Jessica, pending): Oud & Amber, deep conditioning mask
  ('oi000012-0000-0000-0000-000000000012','oo000005-0000-0000-0000-000000000005','d4d4d4d4-0000-0000-0000-000000000007',1,110.00,'Oud & Amber Intense'),
  ('oi000013-0000-0000-0000-000000000013','oo000005-0000-0000-0000-000000000005','c3c3c3c3-0000-0000-0000-000000000002',1,34.50,'Deep Conditioning Mask'),

  -- Order oo000006 (Olivia, cancelled): contour kit
  ('oi000014-0000-0000-0000-000000000014','oo000006-0000-0000-0000-000000000006','a1a1a1a1-0000-0000-0000-000000000009',1,44.00,'Contour & Sculpt Kit')
ON CONFLICT (id) DO NOTHING;


-- ----------------------------------------------------------
-- 7. cart  (active sessions)
-- ----------------------------------------------------------
INSERT INTO cart (id, user_id, product_id, quantity, created_at)
VALUES
  -- Emily Chen
  ('ca000001-0000-0000-0000-000000000001','33333333-3333-3333-3333-333333333333','b2b2b2b2-0000-0000-0000-000000000007',2, now() - interval '2 days'),
  ('ca000002-0000-0000-0000-000000000002','33333333-3333-3333-3333-333333333333','b2b2b2b2-0000-0000-0000-000000000008',1, now() - interval '2 days'),
  -- Jessica Williams
  ('ca000003-0000-0000-0000-000000000003','44444444-4444-4444-4444-444444444444','a1a1a1a1-0000-0000-0000-000000000005',1, now() - interval '1 day'),
  -- Olivia Martinez
  ('ca000004-0000-0000-0000-000000000004','55555555-5555-5555-5555-555555555555','d4d4d4d4-0000-0000-0000-000000000001',1, now() - interval '3 hours'),
  ('ca000005-0000-0000-0000-000000000005','55555555-5555-5555-5555-555555555555','a1a1a1a1-0000-0000-0000-000000000001',3, now() - interval '3 hours')
ON CONFLICT (user_id, product_id) DO NOTHING;


-- ----------------------------------------------------------
-- 8. wishlist
-- ----------------------------------------------------------
INSERT INTO wishlist (id, user_id, product_id, created_at)
VALUES
  -- Sarah Johnson
  ('wl000001-0000-0000-0000-000000000001','22222222-2222-2222-2222-222222222222','b2b2b2b2-0000-0000-0000-000000000002', now() - interval '80 days'),
  ('wl000002-0000-0000-0000-000000000002','22222222-2222-2222-2222-222222222222','d4d4d4d4-0000-0000-0000-000000000007', now() - interval '40 days'),
  -- Emily Chen
  ('wl000003-0000-0000-0000-000000000003','33333333-3333-3333-3333-333333333333','a1a1a1a1-0000-0000-0000-000000000003', now() - interval '30 days'),
  ('wl000004-0000-0000-0000-000000000004','33333333-3333-3333-3333-333333333333','d4d4d4d4-0000-0000-0000-000000000003', now() - interval '15 days'),
  -- Jessica Williams
  ('wl000005-0000-0000-0000-000000000005','44444444-4444-4444-4444-444444444444','b2b2b2b2-0000-0000-0000-000000000009', now() - interval '10 days'),
  -- Olivia Martinez
  ('wl000006-0000-0000-0000-000000000006','55555555-5555-5555-5555-555555555555','b2b2b2b2-0000-0000-0000-000000000004', now() - interval '5 days'),
  ('wl000007-0000-0000-0000-000000000007','55555555-5555-5555-5555-555555555555','c3c3c3c3-0000-0000-0000-000000000007', now() - interval '2 days')
ON CONFLICT (user_id, product_id) DO NOTHING;


-- ----------------------------------------------------------
-- 9. reviews  (trigger auto-updates products.rating /
--              products.total_reviews after each insert)
-- ----------------------------------------------------------
INSERT INTO reviews (id, product_id, user_id, rating, comment, created_at)
VALUES
  -- Velvet Matte Lipstick
  ('rv000001-0000-0000-0000-000000000001','a1a1a1a1-0000-0000-0000-000000000001','22222222-2222-2222-2222-222222222222',5,
   'Absolutely love this! The colour payoff is incredible and it lasts all day without drying my lips.',
   now() - interval '95 days'),
  ('rv000002-0000-0000-0000-000000000002','a1a1a1a1-0000-0000-0000-000000000001','33333333-3333-3333-3333-333333333333',4,
   'Great formula and beautiful shades. Slightly hard to remove but worth it.',
   now() - interval '60 days'),

  -- Hydrating Face Serum
  ('rv000003-0000-0000-0000-000000000003','b2b2b2b2-0000-0000-0000-000000000001','22222222-2222-2222-2222-222222222222',5,
   'My skin has never looked this plump and dewy. A total game-changer in my morning routine.',
   now() - interval '90 days'),
  ('rv000004-0000-0000-0000-000000000004','b2b2b2b2-0000-0000-0000-000000000001','44444444-4444-4444-4444-444444444444',4,
   'Works really well under makeup. Absorbed quickly and left my skin smooth.',
   now() - interval '45 days'),

  -- Flawless Foundation
  ('rv000005-0000-0000-0000-000000000005','a1a1a1a1-0000-0000-0000-000000000002','33333333-3333-3333-3333-333333333333',5,
   'Found my perfect shade on the first try! Full coverage but still looks natural.',
   now() - interval '3 days'),

  -- Argan Oil Hair Serum
  ('rv000006-0000-0000-0000-000000000006','c3c3c3c3-0000-0000-0000-000000000003','44444444-4444-4444-4444-444444444444',5,
   'My frizzy hair is finally tamed! A tiny drop goes a long way and the scent is divine.',
   now() - interval '50 days'),

  -- Midnight Rose Perfume
  ('rv000007-0000-0000-0000-000000000007','d4d4d4d4-0000-0000-0000-000000000001','22222222-2222-2222-2222-222222222222',4,
   'Smells absolutely stunning — gets me compliments every time. Lasts around 6 hours.',
   now() - interval '8 days'),
  ('rv000008-0000-0000-0000-000000000008','d4d4d4d4-0000-0000-0000-000000000001','55555555-5555-5555-5555-555555555555',3,
   'Beautiful scent but I wish it lasted longer. Might try layering it with a body lotion.',
   now() - interval '4 days'),

  -- Retinol Night Treatment
  ('rv000009-0000-0000-0000-000000000009','b2b2b2b2-0000-0000-0000-000000000004','33333333-3333-3333-3333-333333333333',5,
   'Two months in and my fine lines are noticeably reduced. Start slow — totally worth it.',
   now() - interval '2 days'),

  -- Repair Shampoo
  ('rv000010-0000-0000-0000-000000000010','c3c3c3c3-0000-0000-0000-000000000001','44444444-4444-4444-4444-444444444444',4,
   'My damaged hair feels so much softer after just 2 weeks. Great sulfate-free option.',
   now() - interval '48 days'),

  -- Contour & Sculpt Kit
  ('rv000011-0000-0000-0000-000000000011','a1a1a1a1-0000-0000-0000-000000000009','55555555-5555-5555-5555-555555555555',5,
   'Professional-quality contour kit. Perfectly suited for medium skin tones.',
   now() - interval '1 day'),

  -- Oud & Amber Intense
  ('rv000012-0000-0000-0000-000000000012','d4d4d4d4-0000-0000-0000-000000000007','22222222-2222-2222-2222-222222222222',5,
   'A masterpiece in a bottle. Rich, complex, and incredibly long-lasting. Worth every penny.',
   now() - interval '15 days')
ON CONFLICT (product_id, user_id) DO NOTHING;


-- ----------------------------------------------------------
-- 10. Recalculate all product ratings for consistency
-- ----------------------------------------------------------
UPDATE products p
SET
  rating        = sub.avg_rating,
  total_reviews = sub.review_count
FROM (
  SELECT
    product_id,
    ROUND(AVG(rating)::numeric, 2) AS avg_rating,
    COUNT(*) AS review_count
  FROM reviews
  GROUP BY product_id
) sub
WHERE p.id = sub.product_id;


/*
  ============================================================
  SEED COMPLETE
  ============================================================
  Table         | Rows
  --------------|------
  auth.users    |  5  (1 admin + 4 customers)
  profiles      |  5
  products      | 30  (9 Makeup, 9 Skincare, 7 Haircare, 7 Fragrance)
  coupons       |  8  (7 active, 1 expired)
  orders        |  6  (all 5 statuses covered)
  order_items   | 14
  cart          |  5
  wishlist      |  7
  reviews       | 12  (trigger updates rating automatically)
  ============================================================
*/
