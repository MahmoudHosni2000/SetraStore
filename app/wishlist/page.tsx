'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { supabase, WishlistItem, Product } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import ProductCard from '@/components/ProductCard';
import Loading from '@/components/Loading';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';

export default function WishlistPage() {
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState<(WishlistItem & { products: Product })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchWishlist();
    }
  }, [user]);

  async function fetchWishlist() {
    try {
      const { data, error } = await supabase
        .from('wishlist')
        .select('*, products(*)')
        .eq('user_id', user!.id);

      if (error) throw error;
      setWishlist(data || []);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    } finally {
      setLoading(false);
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-12 text-center">
          <Heart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">Please sign in</h2>
          <p className="text-muted-foreground mb-6">
            Sign in to view your wishlist
          </p>
          <Link href="/login">
            <Button>Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Wishlist</h1>
          <p className="text-muted-foreground">
            {wishlist.length} {wishlist.length === 1 ? 'item' : 'items'} saved for later
          </p>
        </div>

        {loading ? (
          <Loading />
        ) : wishlist.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {wishlist.map((item) => (
              <ProductCard
                key={item.id}
                product={item.products}
                isInWishlist={true}
                onWishlistUpdate={fetchWishlist}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Heart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Your wishlist is empty</h2>
            <p className="text-muted-foreground mb-6">
              Save your favorite products for later
            </p>
            <Link href="/products">
              <Button>Discover Products</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
