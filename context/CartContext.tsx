'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, Product, CartItem } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

interface CartContextType {
  cart: (CartItem & { products: Product })[];
  loading: boolean;
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  removeFromCart: (cartItemId: string) => Promise<void>;
  updateQuantity: (cartItemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  cartTotal: number;
  cartCount: number;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<(CartItem & { products: Product })[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const t = useTranslations('cart');

  useEffect(() => {
    if (user) {
      fetchCart();
    } else {
      setCart([]);
    }
  }, [user]);

  async function fetchCart() {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('cart')
        .select('*, products(*)')
        .eq('user_id', user.id);

      if (error) throw error;
      setCart(data || []);
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  }

  async function addToCart(productId: string, quantity: number = 1) {
    if (!user) {
      toast.error(t('signInRequired'));
      return;
    }

    try {
      const existingItem = cart.find((item) => item.product_id === productId);

      if (existingItem) {
        await updateQuantity(existingItem.id, existingItem.quantity + quantity);
      } else {
        const { error } = await supabase.from('cart').insert({
          user_id: user.id,
          product_id: productId,
          quantity,
        });

        if (error) throw error;
        await fetchCart();
        toast.success(t('addedToCart'));
      }
    } catch (error: any) {
      toast.error(error.message || t('errorAdding'));
    }
  }

  async function removeFromCart(cartItemId: string) {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('cart')
        .delete()
        .eq('id', cartItemId);

      if (error) throw error;
      await fetchCart();
      toast.success(t('removedFromCart'));
    } catch (error: any) {
      toast.error(error.message || t('errorRemoving'));
    }
  }

  async function updateQuantity(cartItemId: string, quantity: number) {
    if (!user) return;

    if (quantity < 1) {
      await removeFromCart(cartItemId);
      return;
    }

    try {
      const { error } = await supabase
        .from('cart')
        .update({ quantity })
        .eq('id', cartItemId);

      if (error) throw error;
      await fetchCart();
    } catch (error: any) {
      toast.error(error.message || t('errorUpdating'));
    }
  }

  async function clearCart() {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('cart')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;
      await fetchCart();
    } catch (error: any) {
      toast.error(error.message || t('errorClearing'));
    }
  }

  async function refreshCart() {
    await fetchCart();
  }

  const cartTotal = cart.reduce(
    (total, item) => total + item.products.price * item.quantity,
    0
  );

  const cartCount = cart.reduce((count, item) => count + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartTotal,
        cartCount,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
