'use client';

import React from 'react';
import { Link, useRouter } from '@/i18n/navigation';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function CartPage() {
  const { cart, updateQuantity, removeFromCart, cartTotal, loading } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const t = useTranslations('cart');
  const tc = useTranslations('common');

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-12 text-center">
          <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">{t('signInRequired')}</h2>
          <p className="text-muted-foreground mb-6">
            {t('signInDescription')}
          </p>
          <Link href="/login">
            <Button>{tc('signIn')}</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-12 text-center">
          <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">{t('emptyCart')}</h2>
          <p className="text-muted-foreground mb-6">
            {t('emptyDescription')}
          </p>
          <Link href="/products">
            <Button>{tc('continueShopping')}</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-8">{t('title')}</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {cart.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <Link
                      href={`/products/${item.product_id}`}
                      className="relative w-24 h-24 rounded-lg overflow-hidden bg-secondary flex-shrink-0"
                    >
                      <Image
                        src={item.products.image_url}
                        alt={item.products.name}
                        fill
                        className="object-cover"
                      />
                    </Link>

                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/products/${item.product_id}`}
                        className="hover:text-primary transition-colors"
                      >
                        <h3 className="font-semibold truncate">
                          {item.products.name}
                        </h3>
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        {item.products.brand}
                      </p>
                      <p className="text-lg font-bold text-primary mt-2">
                        ${item.products.price.toFixed(2)}
                      </p>
                    </div>

                    <div className="flex flex-col items-end justify-between">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFromCart(item.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() =>
                            updateQuantity(item.id, item.quantity - 1)
                          }
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center font-medium">
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() =>
                            updateQuantity(item.id, item.quantity + 1)
                          }
                          disabled={item.quantity >= item.products.stock}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div>
            <Card className="sticky top-20">
              <CardContent className="p-6 space-y-4">
                <h2 className="text-xl font-bold">{t('orderSummary')}</h2>

                <div className="space-y-2 py-4 border-y border-border">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('subtotal')}</span>
                    <span className="font-medium">${cartTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('shipping')}</span>
                    <span className="font-medium">{t('shippingFree')}</span>
                  </div>
                </div>

                <div className="flex justify-between text-lg font-bold">
                  <span>{t('total')}</span>
                  <span className="text-primary">${cartTotal.toFixed(2)}</span>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => router.push('/checkout')}
                  disabled={loading}
                >
                  {t('checkoutBtn')}
                </Button>

                <Link href="/products" className="block text-center">
                  <Button variant="outline" className="w-full">
                    {tc('continueShopping')}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

