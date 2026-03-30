'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { supabase, Order } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import Loading from '@/components/Loading';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package } from 'lucide-react';

const statusColors = {
  pending: 'bg-yellow-500',
  processing: 'bg-blue-500',
  shipped: 'bg-purple-500',
  delivered: 'bg-green-500',
  cancelled: 'bg-red-500',
};

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  async function fetchOrders() {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-12 text-center">
          <p className="text-lg text-muted-foreground">Please sign in to view orders</p>
          <Link href="/login">
            <Button className="mt-4">Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-8">My Orders</h1>

        {loading ? (
          <Loading />
        ) : orders.length > 0 ? (
          <div className="space-y-4">
            {orders.map((order) => (
              <Link key={order.id} href={`/orders/${order.id}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Order #{order.id.slice(0, 8)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge className={statusColors[order.status]}>
                        {order.status.toUpperCase()}
                      </Badge>
                    </div>

                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold">{order.customer_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {order.payment_method}
                        </p>
                      </div>
                      <p className="text-2xl font-bold text-primary">
                        ${order.final_amount.toFixed(2)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No orders yet</h2>
            <p className="text-muted-foreground mb-6">
              Start shopping to see your orders here
            </p>
            <Link href="/products">
              <Button>Shop Now</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
