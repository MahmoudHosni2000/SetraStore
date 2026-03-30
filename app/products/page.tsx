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

const categories = ['All', 'Makeup', 'Skincare', 'Haircare', 'Fragrance'];
const sortOptions = [
  { label: 'Newest', value: 'newest' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
  { label: 'Most Popular', value: 'popular' },
];

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">All Products</h1>
          <p className="text-muted-foreground">
            Discover our complete collection of premium beauty products
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
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </Button>

              <div
                className={`space-y-6 ${showFilters ? 'block' : 'hidden lg:block'
                  }`}
              >
                <div>
                  <h3 className="font-semibold mb-3">Search</h3>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search products..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Category</h3>
                  <div className="space-y-2">
                    {categories.map((category) => (
                      <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={`block w-full text-left px-3 py-2 rounded-lg transition-colors ${selectedCategory === category
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-secondary'
                          }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Price Range</h3>
                  <div className="space-y-2">
                    <Input
                      type="number"
                      placeholder="Min price"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                    />
                    <Input
                      type="number"
                      placeholder="Max price"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
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
                  Reset Filters
                </Button>
              </div>
            </div>
          </aside>

          <main className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <p className="text-muted-foreground">
                {filteredProducts.length} product
                {filteredProducts.length !== 1 ? 's' : ''} found
              </p>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Sort by" />
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
                  No products found matching your criteria
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
                  Clear Filters
                </Button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
