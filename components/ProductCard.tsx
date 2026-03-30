'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/lib/supabase';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { ShoppingCart, Heart, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface ProductCardProps {
  product: Product;
  onWishlistUpdate?: () => void;
  isInWishlist?: boolean;
}

export default function ProductCard({
  product,
  onWishlistUpdate,
  isInWishlist = false,
}: ProductCardProps) {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [isWishlisted, setIsWishlisted] = useState(isInWishlist);
  const [loading, setLoading] = useState(false);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    await addToCart(product.id);
  };

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error('Please sign in to add to wishlist');
      return;
    }

    setLoading(true);
    try {
      if (isWishlisted) {
        const { error } = await supabase
          .from('wishlist')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', product.id);

        if (error) throw error;
        setIsWishlisted(false);
        toast.success('Removed from wishlist');
      } else {
        const { error } = await supabase.from('wishlist').insert({
          user_id: user.id,
          product_id: product.id,
        });

        if (error) throw error;
        setIsWishlisted(true);
        toast.success('Added to wishlist');
      }

      if (onWishlistUpdate) {
        onWishlistUpdate();
      }
    } catch (error: any) {
      toast.error(error.message || 'Error updating wishlist');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Link href={`/products/${product.id}`}>
      <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 border-border h-full">
        <div className="relative aspect-square overflow-hidden bg-secondary">
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {product.stock === 0 && (
            <Badge
              variant="destructive"
              className="absolute top-2 left-2 z-10"
            >
              Out of Stock
            </Badge>
          )}
          {product.is_featured && product.stock > 0 && (
            <Badge className="absolute top-2 left-2 z-10 bg-primary">
              Featured
            </Badge>
          )}
          <Button
            size="icon"
            variant={isWishlisted ? 'default' : 'secondary'}
            className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleToggleWishlist}
            disabled={loading}
          >
            <Heart
              className={`h-4 w-4 ${isWishlisted ? 'fill-current' : ''}`}
            />
          </Button>
        </div>

        <CardContent className="p-4">
          <div className="space-y-2">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                {product.brand}
              </p>
              <h3 className="font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                {product.name}
              </h3>
            </div>

            <div className="flex items-center gap-1">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3 w-3 ${
                      i < Math.round(product.rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">
                ({product.total_reviews})
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xl font-bold text-primary">
                ${product.price.toFixed(2)}
              </span>
              {product.stock > 0 && (
                <Button
                  size="sm"
                  onClick={handleAddToCart}
                  className="gap-1"
                >
                  <ShoppingCart className="h-4 w-4" />
                  Add
                </Button>
              )}
            </div>

            {product.stock > 0 && product.stock <= 10 && (
              <p className="text-xs text-orange-500">
                Only {product.stock} left in stock
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
