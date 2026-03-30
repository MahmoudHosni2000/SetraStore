'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase, Order, OrderItem } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import Loading from '@/components/Loading';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MapPin, Phone, User } from 'lucide-react';

const statusColors = {
  pending: 'bg-yellow-500',
  processing: 'bg-blue-500',
  shipped: 'bg-purple-500',
  delivered: 'bg-green-500',
  cancelled: 'bg-red-500',
};

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchOrderDetails();
    }
  }, [user, params.id]);

  async function fetchOrderDetails() {
    try {
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', params.id)
        .eq('user_id', user!.id)
        .maybeSingle();

      if (orderError) throw orderError;
      if (!orderData) {
        router.push('/orders');
        return;
      }

      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', params.id);

      if (itemsError) throw itemsError;

      setOrder(orderData);
      setOrderItems(itemsData || []);
    } catch (error) {
      console.error('Error fetching order:', error);
    } finally {
      setLoading(false);
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

  if (!order) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-12 text-center">
          <p className="text-lg text-muted-foreground">Order not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button variant="ghost" onClick={() => router.back()} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Orders
        </Button>

        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Order #{order.id.slice(0, 8)}
            </h1>
            <p className="text-muted-foreground">
              Placed on {new Date(order.created_at).toLocaleDateString()}
            </p>
          </div>
          <Badge className={statusColors[order.status]}>
            {order.status.toUpperCase()}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer Information
              </h3>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="text-muted-foreground">Name:</span>{' '}
                  {order.customer_name}
                </p>
                <p className="flex items-start gap-2">
                  <Phone className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  {order.customer_phone}
                </p>
                <p className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  {order.customer_address}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Order Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span>${order.total_amount.toFixed(2)}</span>
                </div>
                {order.discount_amount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount:</span>
                    <span>-${order.discount_amount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping:</span>
                  <span>Free</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-border font-bold text-base">
                  <span>Total:</span>
                  <span className="text-primary">
                    ${order.final_amount.toFixed(2)}
                  </span>
                </div>
                <p className="text-muted-foreground pt-2">
                  Payment: {order.payment_method}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">Order Items</h3>
            <div className="space-y-4">
              {orderItems.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center py-4 border-b border-border last:border-0"
                >
                  <div>
                    <p className="font-medium">{item.product_name}</p>
                    <p className="text-sm text-muted-foreground">
                      Quantity: {item.quantity}
                    </p>
                  </div>
                  <p className="font-semibold">
                    ${(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
