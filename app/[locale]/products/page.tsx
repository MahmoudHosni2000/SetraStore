'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase, Product } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import ProductCard from '@/components/ProductCard';
import Loading from '@/components/Loading';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, SlidersHorizontal } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const t = useTranslations('products');
  const tc = useTranslations('common');
  const tn = useTranslations('nav');

  const categories = ['All', 'Makeup', 'Skincare', 'Haircare', 'Fragrance', 'Bath & Body', 'Men\'s Grooming', 'Tools & Accessories', 'Wellness', 'Sun Care'];
  const sortOptions = [
    { label: t('sort.newest'), value: 'newest' },
    { label: t('sort.priceAsc'), value: 'price_asc' },
    { label: t('sort.priceDesc'), value: 'price_desc' },
    { label: t('sort.popular'), value: 'popular' },
  ];

  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get('category') || 'All'
  );
  const [sortBy, setSortBy] = useState('newest');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [products, searchQuery, selectedCategory, sortBy, minPrice, maxPrice]);

  async function fetchProducts() {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  }

  function applyFilters() {
    let filtered = [...products];

    if (selectedCategory !== 'All') {
      filtered = filtered.filter((p) => p.category === selectedCategory);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.brand.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query)
      );
    }

    if (minPrice) {
      filtered = filtered.filter((p) => p.price >= parseFloat(minPrice));
    }

    if (maxPrice) {
      filtered = filtered.filter((p) => p.price <= parseFloat(maxPrice));
    }

    switch (sortBy) {
      case 'price_asc':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price_desc':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'popular':
        filtered.sort((a, b) => b.total_reviews - a.total_reviews);
        break;
      case 'newest':
      default:
        filtered.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        break;
    }

    setFilteredProducts(filtered);
  }

  const getCategoryName = (cat: string) => {
    if (cat === 'All') return tc('allProducts');
    return tn(cat.toLowerCase() as any);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{t('title')}</h1>
          <p className="text-muted-foreground">
            {t('description')}
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-64 space-y-6">
            <div>
              <Button
                variant="outline"
                className="w-full lg:hidden mb-4"
                onClick={() => setShowFilters(!showFilters)}
              >
                <SlidersHorizontal className="h-4 w-4 me-2" />
                {showFilters ? t('hideFilters') : t('showFilters')}
              </Button>

              <div
                className={`space-y-6 ${showFilters ? 'block' : 'hidden lg:block'
                  }`}
              >
                <div>
                  <h3 className="font-semibold mb-3">{tc('search')}</h3>
                  <div className="relative">
                    <Search className="absolute start-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder={t('searchPlaceholder')}
                      value={searchQuery}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                      className="ps-9"
                    />
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">{tc('category')}</h3>
                  <div className="space-y-2">
                    {categories.map((category) => (
                      <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={`block w-full text-start px-3 py-2 rounded-lg transition-colors ${selectedCategory === category
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-secondary'
                          }`}
                      >
                        {getCategoryName(category)}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">{tc('priceRange')}</h3>
                  <div className="space-y-2">
                    <Input
                      type="number"
                      placeholder={t('minPrice')}
                      value={minPrice}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMinPrice(e.target.value)}
                    />
                    <Input
                      type="number"
                      placeholder={t('maxPrice')}
                      value={maxPrice}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMaxPrice(e.target.value)}
                    />
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('All');
                    setMinPrice('');
                    setMaxPrice('');
                  }}
                >
                  {tc('resetFilters')}
                </Button>
              </div>
            </div>
          </aside>

          <main className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <p className="text-muted-foreground">
                {t('foundCount', { count: filteredProducts.length })}
              </p>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder={t('sortBy')} />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {loading ? (
              <Loading />
            ) : filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-secondary/20 rounded-lg">
                <p className="text-lg text-muted-foreground">
                  {t('noMatching')}
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('All');
                    setMinPrice('');
                    setMaxPrice('');
                  }}
                >
                  {t('clearFilters')}
                </Button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

