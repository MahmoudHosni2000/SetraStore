'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Link, useRouter } from '@/i18n/navigation';
import Image from 'next/image';
import { supabase, Product, Review } from '@/lib/supabase';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import Loading from '@/components/Loading';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShoppingCart, Heart, Star, ArrowLeft, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations, useLocale } from 'next-intl';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  
  const t = useTranslations('productDetails');
  const tcard = useTranslations('productCard');
  const tc = useTranslations('common');
  const locale = useLocale();

  useEffect(() => {
    fetchProduct();
    fetchReviews();
    checkWishlist();
  }, [params.id]);

  async function fetchProduct() {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', params.id)
        .maybeSingle();

      if (error) throw error;
      setProduct(data);
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error(t('notFound'));
    } finally {
      setLoading(false);
    }
  }

  async function fetchReviews() {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*, profiles(full_name)')
        .eq('product_id', params.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  }

  async function checkWishlist() {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('wishlist')
        .select('id')
        .eq('user_id', user.id)
        .eq('product_id', params.id)
        .maybeSingle();

      setIsWishlisted(!!data);
    } catch (error) {
      console.error('Error checking wishlist:', error);
    }
  }

  async function handleToggleWishlist() {
    if (!user) {
      toast.error(tcard('signInRequired'));
      return;
    }

    try {
      if (isWishlisted) {
        await supabase
          .from('wishlist')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', params.id);
        setIsWishlisted(false);
        toast.success(tcard('removedFromWishlist'));
      } else {
        await supabase.from('wishlist').insert({
          user_id: user.id,
          product_id: params.id as string,
        });
        setIsWishlisted(true);
        toast.success(tcard('addedToWishlist'));
      }
    } catch (error: any) {
      toast.error(error.message || tcard('wishlistError'));
    }
  }

  async function handleSubmitReview() {
    if (!user) {
      toast.error(t('signInToReview'));
      return;
    }

    setSubmittingReview(true);
    try {
      const { error } = await supabase.from('reviews').insert({
        product_id: params.id as string,
        user_id: user.id,
        rating,
        comment,
      });

      if (error) throw error;
      toast.success(t('reviewSuccess'));
      setComment('');
      setRating(5);
      fetchReviews();
      fetchProduct();
    } catch (error: any) {
      toast.error(error.message || t('reviewError'));
    } finally {
      setSubmittingReview(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <Loading />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-12 text-center">
          <p className="text-lg text-muted-foreground">{t('notFound')}</p>
          <Link href="/products">
            <Button className="mt-4">
              {t('backToProducts')}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-6"
        >
          {<ArrowLeft className="h-4 w-4 me-2 rtl:rotate-180" />}
          {t('back')}
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-muted/30 border border-border/50">
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className="object-cover"
            />
          </div>

          <div className="space-y-6">
            <div>
              <p className="text-sm text-muted-foreground uppercase tracking-wide mb-2">
                {product.brand}
              </p>
              <h1 className="text-4xl font-bold mb-4">{product.name}</h1>
              <Badge>{product.category}</Badge>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      i < Math.round(product.rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-muted-foreground/30'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                {product.rating.toFixed(1)} ({t('reviewsCount', { count: product.total_reviews })})
              </span>
            </div>

            <p className="text-4xl font-bold text-primary">
              {tc('currencySymbol')} {product.price.toFixed(2)}
            </p>

            <p className="text-muted-foreground leading-relaxed">
              {product.description}
            </p>

            {product.stock > 0 ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t('quantity')}
                  </label>
                  <Select
                    value={quantity.toString()}
                    onValueChange={(value) => setQuantity(parseInt(value))}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[...Array(Math.min(product.stock, 10))].map((_, i) => (
                        <SelectItem key={i + 1} value={(i + 1).toString()}>
                          {i + 1}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-3">
                  <Button
                    size="lg"
                    className="flex-1"
                    onClick={() => addToCart(product.id, quantity)}
                  >
                    <ShoppingCart className="h-5 w-5 me-2" />
                    {tcard('add')}
                  </Button>
                  <Button
                    size="lg"
                    variant={isWishlisted ? 'default' : 'outline'}
                    onClick={handleToggleWishlist}
                  >
                    <Heart
                      className={`h-5 w-5 ${isWishlisted ? 'fill-current' : ''}`}
                    />
                  </Button>
                </div>

                {product.stock <= 10 && (
                  <p className="text-sm text-amber-600 dark:text-amber-400">
                    {tcard('onlyLeft', { count: product.stock })}
                  </p>
                )}
              </div>
            ) : (
              <Badge variant="destructive" className="text-lg py-2 px-4">
                {tcard('outOfStock')}
              </Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-6">{t('customerReviews')}</h2>

              {user && (
                <Card className="mb-6">
                  <CardContent className="pt-6 space-y-4">
                    <h3 className="font-semibold">{t('writeReview')}</h3>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        {t('rating')}
                      </label>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => setRating(star)}
                            className="hover:scale-110 transition-transform"
                          >
                            <Star
                              className={`h-6 w-6 ${
                                star <= rating
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-muted-foreground/30'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        {t('comment')}
                      </label>
                      <Textarea
                        placeholder={t('commentPlaceholder')}
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        rows={4}
                      />
                    </div>
                    <Button
                      onClick={handleSubmitReview}
                      disabled={submittingReview || !comment}
                    >
                      {submittingReview ? tc('loading') : t('submitBtn')}
                    </Button>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-4">
                {reviews.length > 0 ? (
                  reviews.map((review) => (
                    <Card key={review.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-semibold">
                              {review.profiles?.full_name || t('anonymous')}
                            </p>
                            <div className="flex items-center gap-1 mt-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < review.rating
                                      ? 'fill-yellow-400 text-yellow-400'
                                      : 'text-muted-foreground/30'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {new Date(review.created_at).toLocaleDateString(locale)}
                          </p>
                        </div>
                        {review.comment && (
                          <p className="text-muted-foreground mt-2">
                            {review.comment}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    {t('noReviews')}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div>
            <Card>
              <CardContent className="pt-6 space-y-4">
                <h3 className="font-semibold">{t('productInfo')}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('brand')}:</span>
                    <span className="font-medium">{product.brand}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('category')}:</span>
                    <span className="font-medium">{product.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('availability')}:</span>
                    <span className="font-medium">
                      {product.stock > 0 ? t('inStock') : tcard('outOfStock')}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

