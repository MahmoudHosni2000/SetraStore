'use client';

import React, { useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShoppingBag, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

export default function CheckoutPage() {
  const { cart, cartTotal, clearCart } = useCart();
  const { user, profile } = useAuth();
  const router = useRouter();
  const t = useTranslations('checkout');
  const tc = useTranslations('common');
  const tcart = useTranslations('cart');

  const [name, setName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [address, setAddress] = useState(profile?.address || '');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState<any[]>([]);

  React.useEffect(() => {
    fetchAvailableCoupons();
  }, []);

  async function fetchAvailableCoupons() {
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('active', true)
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);

      if (error) throw error;
      setAvailableCoupons(data || []);
    } catch (error) {
      console.error('Error fetching coupons:', error);
    }
  }

  if (!user || cart.length === 0) {
    router.push('/cart');
    return null;
  }

  const discountAmount = appliedCoupon
    ? (cartTotal * appliedCoupon.discount_percentage) / 100
    : 0;
  const finalAmount = cartTotal - discountAmount;

  async function handleApplyCoupon(code?: string) {
    const codeToApply = code || couponCode;
    if (!codeToApply) return;

    setApplyingCoupon(true);
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', codeToApply.toUpperCase())
        .eq('active', true)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        toast.error(t('invalidCoupon'));
        return;
      }

      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        toast.error(t('expiredCoupon'));
        return;
      }

      setAppliedCoupon(data);
      setCouponCode(data.code);
      toast.success(t('couponApplied', { percent: data.discount_percentage }));
    } catch (error: any) {
      toast.error(t('couponError'));
    } finally {
      setApplyingCoupon(false);
    }
  }

  async function handlePlaceOrder(e: React.FormEvent) {
    e.preventDefault();

    if (!user) {
      toast.error(t('signInToast'));
      return;
    }

    if (!name || !phone || !address) {
      toast.error(t('fillFieldsToast'));
      return;
    }

    setLoading(true);
    try {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          customer_name: name,
          customer_phone: phone,
          customer_address: address,
          total_amount: cartTotal,
          discount_amount: discountAmount,
          final_amount: finalAmount,
          status: 'pending',
          payment_method: 'Cash on Delivery',
          coupon_code: appliedCoupon?.code || null,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = cart.map((item) => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.products.price,
        product_name: item.products.name,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      for (const item of cart) {
        await supabase
          .from('products')
          .update({ stock: item.products.stock - item.quantity })
          .eq('id', item.product_id);
      }

      await clearCart();
      toast.success(t('orderSuccess'));
      router.push(`/orders/${order.id}`);
    } catch (error: any) {
      toast.error(error.message || t('orderError'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-8">{t('title')}</h1>

        <form onSubmit={handlePlaceOrder}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t('deliveryInfo')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">{t('fullName')} *</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">{t('phone')} *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">{t('address')} *</Label>
                    <Input
                      id="address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder={t('addressPlaceholder')}
                      required
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('paymentMethod')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 p-4 border border-border rounded-lg bg-muted/30">
                    <ShoppingBag className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium text-foreground">{t('cod')}</p>
                      <p className="text-sm text-muted-foreground">
                        {t('codDescription')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="h-5 w-5" />
                    {t('applyCoupon')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Input
                      placeholder={t('couponPlaceholder')}
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      disabled={!!appliedCoupon}
                    />
                    {appliedCoupon ? (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setAppliedCoupon(null);
                          setCouponCode('');
                        }}
                      >
                        {t('removeCoupon')}
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        onClick={() => handleApplyCoupon()}
                        disabled={applyingCoupon || !couponCode}
                      >
                        {t('apply')}
                      </Button>
                    )}
                  </div>
                  {appliedCoupon && (
                    <div className="mt-2 text-sm text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
                      <Tag className="h-4 w-4" />
                      {t('alreadyApplied')}! {appliedCoupon.discount_percentage}% OFF
                    </div>
                  )}

                  {availableCoupons.length > 0 && (
                    <div className="mt-6 space-y-3">
                      <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                        {t('availableCoupons')}
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {availableCoupons.map((coupon) => (
                          <div
                            key={coupon.id}
                            className={`p-3 border-2 rounded-xl transition-all cursor-pointer relative overflow-hidden group ${
                              appliedCoupon?.code === coupon.code
                                ? 'border-primary bg-primary/10'
                                : 'border-dashed border-border hover:border-primary/50 bg-muted/20'
                            }`}
                            onClick={() => !appliedCoupon && handleApplyCoupon(coupon.code)}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-bold text-lg text-primary">{coupon.code}</p>
                                <p className="text-sm font-medium">{coupon.discount_percentage}% OFF</p>
                              </div>
                              {appliedCoupon?.code === coupon.code ? (
                                <Badge variant="default" className="text-[10px] h-5">
                                  {t('alreadyApplied')}
                                </Badge>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                                  disabled={!!appliedCoupon}
                                >
                                  {t('apply')}
                                </Button>
                              )}
                            </div>
                            <div className="absolute -right-2 -bottom-2 opacity-5 group-hover:opacity-10 transition-opacity">
                              <Tag className="h-12 w-12 rotate-12" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div>
              <Card className="sticky top-20">
                <CardHeader>
                  <CardTitle>{tcart('orderSummary')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {cart.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between text-sm"
                      >
                        <span className="text-muted-foreground">
                          {item.products.name} x{item.quantity}
                        </span>
                        <span>
                          {tc('currencySymbol')} {(item.products.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2 py-4 border-y border-border">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{tcart('subtotal')}</span>
                      <span>{tc('currencySymbol')} {cartTotal.toFixed(2)}</span>
                    </div>
                    {appliedCoupon && (
                      <div className="flex justify-between text-green-600 dark:text-green-400">
                        <span>{t('discount')} ({appliedCoupon.discount_percentage}%)</span>
                        <span>-{tc('currencySymbol')} {discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{tcart('shipping')}</span>
                      <span>{tcart('shippingFree')}</span>
                    </div>
                  </div>

                  <div className="flex justify-between text-lg font-bold">
                    <span>{tcart('total')}</span>
                    <span className="text-primary">{tc('currencySymbol')} {finalAmount.toFixed(2)}</span>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={loading}
                  >
                    {loading ? tc('loading') : t('placeOrderBtn')}
                  </Button>

                  <p className="text-xs text-muted-foreground text-center">
                    {t('termsText')}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

