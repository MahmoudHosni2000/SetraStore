'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase, Product } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import ProductCard from '@/components/ProductCard';
import Loading from '@/components/Loading';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles, Star, TrendingUp } from 'lucide-react';

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    try {
      const { data: featured } = await supabase
        .from('products')
        .select('*')
        .eq('is_featured', true)
        .limit(4);

      const { data: sellers } = await supabase
        .from('products')
        .select('*')
        .order('total_reviews', { ascending: false })
        .limit(8);

      setFeaturedProducts(featured || []);
      setBestSellers(sellers || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="relative bg-gradient-to-br from-pink-50 via-white to-beige-50 overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnoiIHN0cm9rZT0iI2Y5YThjZiIgc3Ryb2tlLXdpZHRoPSIyIiBvcGFjaXR5PSIuMiIvPjwvZz48L3N2Zz4=')] opacity-30"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary">
                <Sparkles className="h-4 w-4" />
                <span className="text-sm font-medium">Premium Beauty Products</span>
              </div>

              <h1 className="text-5xl md:text-6xl font-bold leading-tight">
                Discover Your
                <span className="block text-primary">Natural Glow</span>
              </h1>

              <p className="text-lg text-muted-foreground max-w-md">
                Shop the latest in makeup, skincare, haircare, and fragrances from top beauty brands.
                Transform your beauty routine with premium products.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/products">
                  <Button size="lg" className="gap-2">
                    Shop Now
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/products?category=Skincare">
                  <Button size="lg" variant="outline">
                    Explore Skincare
                  </Button>
                </Link>
              </div>

              <div className="flex items-center gap-8 pt-4">
                <div>
                  <div className="flex items-center gap-1 text-yellow-500 mb-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">5-Star Rated Products</p>
                </div>
                <div className="h-12 w-px bg-border" />
                <div>
                  <p className="text-2xl font-bold text-primary">1000+</p>
                  <p className="text-sm text-muted-foreground">Happy Customers</p>
                </div>
              </div>
            </div>

            <div className="relative hidden lg:block">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-3xl blur-3xl"></div>
              <div className="relative grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="h-48 rounded-2xl bg-white shadow-lg p-6 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-4xl font-bold text-primary mb-2">30%</p>
                      <p className="text-sm text-muted-foreground">OFF First Order</p>
                    </div>
                  </div>
                  <div className="h-64 rounded-2xl bg-gradient-to-br from-pink-100 to-pink-200 shadow-lg"></div>
                </div>
                <div className="space-y-4 pt-12">
                  <div className="h-64 rounded-2xl bg-gradient-to-br from-amber-100 to-amber-200 shadow-lg"></div>
                  <div className="h-48 rounded-2xl bg-white shadow-lg p-6 flex items-center justify-center">
                    <div className="text-center">
                      <Sparkles className="h-8 w-8 text-primary mx-auto mb-2" />
                      <p className="text-sm font-medium">Premium Quality</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Featured Products
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Handpicked favorites that our customers love. These are our top-rated
              beauty essentials for your perfect routine.
            </p>
          </div>

          {loading ? (
            <Loading />
          ) : featuredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No featured products available</p>
            </div>
          )}

          <div className="text-center">
            <Link href="/products">
              <Button variant="outline" size="lg" className="gap-2">
                View All Products
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-20 bg-secondary/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-12">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-6 w-6 text-primary" />
                <h2 className="text-3xl md:text-4xl font-bold">Best Sellers</h2>
              </div>
              <p className="text-muted-foreground">
                Most popular products loved by our community
              </p>
            </div>
          </div>

          {loading ? (
            <Loading />
          ) : bestSellers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {bestSellers.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No products available</p>
            </div>
          )}
        </div>
      </section>

      <section className="py-20 bg-gradient-to-r from-primary/10 to-accent/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Premium Quality</h3>
              <p className="text-muted-foreground">
                Authentic products from trusted brands
              </p>
            </div>

            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <Star className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Customer Reviews</h3>
              <p className="text-muted-foreground">
                Real reviews from real customers
              </p>
            </div>

            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Fast Delivery</h3>
              <p className="text-muted-foreground">
                Quick and reliable shipping
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-foreground text-background py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="h-6 w-6" />
              <span className="text-2xl font-bold">SetraStore</span>
            </div>
            <p className="text-background/80 mb-4">
              Your destination for premium beauty products
            </p>
            <p className="text-sm text-background/60">
              © {new Date().getFullYear()} SetraStore. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
