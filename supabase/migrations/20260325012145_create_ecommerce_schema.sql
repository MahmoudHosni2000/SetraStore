/*
  # E-Commerce Cosmetics Store Database Schema

  ## Tables Created:
  
  1. **profiles**
     - `id` (uuid, references auth.users)
     - `full_name` (text)
     - `email` (text)
     - `phone` (text)
     - `address` (text)
     - `is_admin` (boolean, default false)
     - `created_at` (timestamptz)

  2. **products**
     - `id` (uuid, primary key)
     - `name` (text)
     - `description` (text)
     - `price` (numeric)
     - `category` (text: Makeup, Skincare, Haircare, Fragrance)
     - `brand` (text)
     - `image_url` (text)
     - `stock` (integer)
     - `rating` (numeric, default 0)
     - `total_reviews` (integer, default 0)
     - `is_featured` (boolean, default false)
     - `created_at` (timestamptz)

  3. **orders**
     - `id` (uuid, primary key)
     - `user_id` (uuid, references profiles)
     - `customer_name` (text)
     - `customer_phone` (text)
     - `customer_address` (text)
     - `total_amount` (numeric)
     - `discount_amount` (numeric, default 0)
     - `final_amount` (numeric)
     - `status` (text: pending, processing, shipped, delivered, cancelled)
     - `payment_method` (text, default 'Cash on Delivery')
     - `coupon_code` (text)
     - `created_at` (timestamptz)

  4. **order_items**
     - `id` (uuid, primary key)
     - `order_id` (uuid, references orders)
     - `product_id` (uuid, references products)
     - `quantity` (integer)
     - `price` (numeric)
     - `product_name` (text)

  5. **cart**
     - `id` (uuid, primary key)
     - `user_id` (uuid, references profiles)
     - `product_id` (uuid, references products)
     - `quantity` (integer)
     - `created_at` (timestamptz)

  6. **wishlist**
     - `id` (uuid, primary key)
     - `user_id` (uuid, references profiles)
     - `product_id` (uuid, references products)
     - `created_at` (timestamptz)

  7. **reviews**
     - `id` (uuid, primary key)
     - `product_id` (uuid, references products)
     - `user_id` (uuid, references profiles)
     - `rating` (integer, 1-5)
     - `comment` (text)
     - `created_at` (timestamptz)

  8. **coupons**
     - `id` (uuid, primary key)
     - `code` (text, unique)
     - `discount_percentage` (integer)
     - `active` (boolean, default true)
     - `expires_at` (timestamptz)
     - `created_at` (timestamptz)

  ## Security:
  - RLS enabled on all tables
  - Policies created for authenticated users to manage their own data
  - Admin-only policies for product and order management
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name text,
  email text UNIQUE NOT NULL,
  phone text,
  address text,
  is_admin boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  price numeric NOT NULL CHECK (price >= 0),
  category text NOT NULL CHECK (category IN ('Makeup', 'Skincare', 'Haircare', 'Fragrance')),
  brand text NOT NULL,
  image_url text NOT NULL,
  stock integer DEFAULT 0 CHECK (stock >= 0),
  rating numeric DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  total_reviews integer DEFAULT 0,
  is_featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view products"
  ON products FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage products"
  ON products FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  customer_address text NOT NULL,
  total_amount numeric NOT NULL CHECK (total_amount >= 0),
  discount_amount numeric DEFAULT 0 CHECK (discount_amount >= 0),
  final_amount numeric NOT NULL CHECK (final_amount >= 0),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  payment_method text DEFAULT 'Cash on Delivery',
  coupon_code text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all orders"
  ON orders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can update orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity integer NOT NULL CHECK (quantity > 0),
  price numeric NOT NULL CHECK (price >= 0),
  product_name text NOT NULL
);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own order items"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create order items"
  ON order_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all order items"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Create cart table
CREATE TABLE IF NOT EXISTS cart (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, product_id)
);

ALTER TABLE cart ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own cart"
  ON cart FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert to own cart"
  ON cart FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cart"
  ON cart FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete from own cart"
  ON cart FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create wishlist table
CREATE TABLE IF NOT EXISTS wishlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, product_id)
);

ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wishlist"
  ON wishlist FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert to own wishlist"
  ON wishlist FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete from own wishlist"
  ON wishlist FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(product_id, user_id)
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reviews"
  ON reviews FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create own reviews"
  ON reviews FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews"
  ON reviews FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own reviews"
  ON reviews FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create coupons table
CREATE TABLE IF NOT EXISTS coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  discount_percentage integer NOT NULL CHECK (discount_percentage > 0 AND discount_percentage <= 100),
  active boolean DEFAULT true,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active coupons"
  ON coupons FOR SELECT
  TO authenticated
  USING (active = true AND (expires_at IS NULL OR expires_at > now()));

CREATE POLICY "Admins can manage coupons"
  ON coupons FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_cart_user_id ON cart(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_user_id ON wishlist(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);

-- Function to update product rating when a review is added/updated
CREATE OR REPLACE FUNCTION update_product_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE products
  SET rating = (
    SELECT COALESCE(AVG(rating), 0)
    FROM reviews
    WHERE product_id = NEW.product_id
  ),
  total_reviews = (
    SELECT COUNT(*)
    FROM reviews
    WHERE product_id = NEW.product_id
  )
  WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update product rating
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_product_rating_trigger'
  ) THEN
    CREATE TRIGGER update_product_rating_trigger
    AFTER INSERT OR UPDATE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_product_rating();
  END IF;
END $$;

-- Function to update product rating when a review is deleted
CREATE OR REPLACE FUNCTION update_product_rating_on_delete()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE products
  SET rating = (
    SELECT COALESCE(AVG(rating), 0)
    FROM reviews
    WHERE product_id = OLD.product_id
  ),
  total_reviews = (
    SELECT COUNT(*)
    FROM reviews
    WHERE product_id = OLD.product_id
  )
  WHERE id = OLD.product_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update rating on review deletion
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_product_rating_on_delete_trigger'
  ) THEN
    CREATE TRIGGER update_product_rating_on_delete_trigger
    AFTER DELETE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_product_rating_on_delete();
  END IF;
END $$;