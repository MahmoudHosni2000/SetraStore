'use client';

import React, { useEffect, useState } from 'react';
import { Link } from '@/i18n/navigation';
import { supabase, Product } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import ProductCard from '@/components/ProductCard';
import Loading from '@/components/Loading';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles, Star, TrendingUp, Gift, ShoppingBag, Heart, Award, Tag } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const t = useTranslations('home');
  const tc = useTranslations('common');
  const locale = useLocale();

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

      <section className="relative bg-gradient-to-br from-primary/5 via-background to-secondary/5 overflow-hidden">
        <div className="absolute inset-0 bg-primary/5 opacity-30"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary">
                <Sparkles className="h-4 w-4" />
                <span className="text-sm font-medium">{t('premiumBeauty')}</span>
              </div>

              <h1 className="text-5xl md:text-6xl font-bold leading-tight">
                {t('heroTitlePart1')}
                <span className="block text-primary">{t('heroTitlePart2')}</span>
              </h1>

              <p className="text-lg text-muted-foreground max-w-md">
                {t('heroDescription')}
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/products">
                  <Button size="lg" className="gap-2">
                    {t('shopNow')}
                    <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                  </Button>
                </Link>
                <Link href="/products?category=Skincare">
                  <Button size="lg" variant="outline">
                    {t('exploreSkincare')}
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
                  <p className="text-sm text-muted-foreground">{t('starsRated')}</p>
                </div>
                <div className="h-12 w-px bg-border" />
                <div>
                  <p className="text-2xl font-bold text-primary">1000+</p>
                  <p className="text-sm text-muted-foreground">{t('happyCustomers')}</p>
                </div>
              </div>
            </div>

            <div className="relative hidden lg:block">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-3xl blur-3xl"></div>
              <div className="relative grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="h-48 rounded-2xl bg-card border border-border shadow-lg p-6 flex items-center justify-center">
                    <div className="text-center">
                      <Tag className="h-8 w-8 text-primary mx-auto mb-2 opacity-50" />
                      <p className="text-4xl font-bold text-primary mb-2">30%</p>
                      <p className="text-sm text-muted-foreground">{t('offFirstOrder')}</p>
                    </div>
                  </div>
                  <div className="h-64 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/30 shadow-lg flex items-center justify-center">
                    <Heart className="h-16 w-16 text-primary/40 animate-pulse" />
                  </div>
                </div>
                <div className="space-y-4 pt-12">
                  <div className="h-64 rounded-2xl bg-gradient-to-br from-accent/10 to-accent/30 shadow-lg flex items-center justify-center">
                    <ShoppingBag className="h-16 w-16 text-accent-foreground/40 animate-bounce" />
                  </div>
                  <div className="h-48 rounded-2xl bg-card border border-border shadow-lg p-6 flex items-center justify-center">
                    <div className="text-center">
                      <Award className="h-8 w-8 text-primary mx-auto mb-2" />
                      <p className="text-sm font-medium">{t('premiumQuality')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t('featuredProducts')}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t('featuredDescription')}
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
              <p className="text-muted-foreground">{tc('noProducts')}</p>
            </div>
          )}

          <div className="text-center">
            <Link href="/products">
              <Button variant="outline" size="lg" className="gap-2">
                {t('viewAll')}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" />
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
                <h2 className="text-3xl md:text-4xl font-bold">{t('bestSellers')}</h2>
              </div>
              <p className="text-muted-foreground">
                {t('bestSellersDescription')}
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
              <p className="text-muted-foreground">{tc('noProducts')}</p>
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
              <h3 className="text-xl font-semibold mb-2">{t('premiumQuality')}</h3>
              <p className="text-muted-foreground">
                {t('trustedBrands')}
              </p>
            </div>

            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <Star className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{t('customerReviews')}</h3>
              <p className="text-muted-foreground">
                {t('realReviews')}
              </p>
            </div>

            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{t('fastDelivery')}</h3>
              <p className="text-muted-foreground">
                {t('fastDeliveryDescription')}
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-card text-foreground border-t border-border py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="h-6 w-6 text-primary" />
              <span className="text-2xl font-bold">SetraStore</span>
            </div>
            <p className="text-muted-foreground mb-4">
              {t('footerDescription')}
            </p>
            <p className="text-xs text-muted-foreground">
              {t('allRightsReserved', { year: new Date().getFullYear() })}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

