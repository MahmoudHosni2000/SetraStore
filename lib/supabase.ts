import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Profile {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  address: string | null;
  avatar_url: string | null;
  is_admin: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'Makeup' | 'Skincare' | 'Haircare' | 'Fragrance';
  brand: string;
  image_url: string;
  stock: number;
  rating: number;
  total_reviews: number;
  is_featured: boolean;
  created_at: string;
}

export interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
  products?: Product;
}

export interface WishlistItem {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
  products?: Product;
}

export interface Order {
  id: string;
  user_id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  total_amount: number;
  discount_amount: number;
  final_amount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  payment_method: string;
  coupon_code: string | null;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
  product_name: string;
}

export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  profiles?: {
    full_name: string | null;
  };
}

export interface Coupon {
  id: string;
  code: string;
  discount_percentage: number;
  active: boolean;
  expires_at: string | null;
  created_at: string;
}
