'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase, Product, Order, Profile, Coupon } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import Loading from '@/components/Loading';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useTranslations } from 'next-intl';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Package, ShoppingBag, DollarSign, Users, Plus, CreditCard as Edit, Trash2, LayoutDashboard, Camera, Loader2, Tag } from 'lucide-react';
import { DashboardCharts } from './DashboardCharts';
import { toast } from 'sonner';

export default function DashboardClient() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const tc = useTranslations('common');
  const to = useTranslations('orders');
  const tdashboard = useTranslations('dashboard');
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [stats, setStats] = useState({ totalProducts: 0, totalOrders: 0, revenue: 0, customers: 0 });
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isProductsLoading, setIsProductsLoading] = useState(false);
  const [isCouponsLoading, setIsCouponsLoading] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [productPage, setProductPage] = useState(1);
  const [totalProductCount, setTotalProductCount] = useState(0);
  const itemsPerPage = 5;
  const [dialogOpen, setDialogOpen] = useState(false);
  const [couponDialogOpen, setCouponDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Makeup' as 'Makeup' | 'Skincare' | 'Haircare' | 'Fragrance' | 'Bath & Body' | 'Men\'s Grooming' | 'Tools & Accessories' | 'Wellness' | 'Sun Care',
    brand: '',
    image_url: '',
    stock: '',
    is_featured: false,
  });

  const [couponFormData, setCouponFormData] = useState({
    code: '',
    discount_percentage: '',
    active: true,
    expires_at: '',
  });

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      router.push('/');
    } else if (user && isAdmin) {
      fetchData();
    }
  }, [user, isAdmin, authLoading]);

  async function fetchData(page: number = 1) {
    try {
      const from = (page - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      const [productsRes, allProductsRes, ordersRes, profilesRes, couponsRes] = await Promise.all([
        supabase.from('products').select('*', { count: 'exact' }).order('created_at', { ascending: false }).range(from, to),
        supabase.from('products').select('*').order('created_at', { ascending: false }),
        supabase.from('orders').select('*').order('created_at', { ascending: false }),
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('coupons').select('*').order('created_at', { ascending: false }),
      ]);

      const productsData = productsRes.data || [];
      const allProductsData = allProductsRes.data || [];
      const ordersData = ordersRes.data || [];
      const totalCount = productsRes.count || 0;
      const revenue = ordersData.reduce((sum, order) => sum + order.final_amount, 0);

      setProducts(productsData);
      setAllProducts(allProductsData);
      setOrders(ordersData);
      setProfiles(profilesRes.data || []);
      setCoupons(couponsRes.data || []);
      setTotalProductCount(totalCount);
      setStats({
        totalProducts: totalCount,
        totalOrders: ordersData.length,
        revenue,
        customers: profilesRes.data?.length || 0,
      });
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsInitialLoading(false);
      setIsProductsLoading(false);
    }
  }

  async function fetchProductsOnly(page: number) {
    setIsProductsLoading(true);
    try {
      const from = (page - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      const { data, count, error } = await supabase
        .from('products')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;
      setProducts(data || []);
      if (count !== null) {
        setTotalProductCount(count);
        setStats(prev => ({ ...prev, totalProducts: count }));
        // Also refresh allProducts if a change might have happened
        const { data: allData } = await supabase.from('products').select('*').order('created_at', { ascending: false });
        if (allData) setAllProducts(allData);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setIsProductsLoading(false);
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be smaller than 5 MB');
      return;
    }

    setIsUploadingImage(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `${Date.now()}.${ext}`;
      const filePath = `${fileName}`; // Upload directly to bucket root

      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('products')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, image_url: publicUrl }));
      toast.success('Image uploaded successfully');
    } catch (error: any) {
      toast.error(error.message || 'Error uploading image');
    } finally {
      setIsUploadingImage(false);
    }
  }

  async function handleSaveProduct() {
    try {
      const productData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        category: formData.category,
        brand: formData.brand,
        image_url: formData.image_url,
        stock: parseInt(formData.stock),
        is_featured: formData.is_featured,
      };

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);
        if (error) throw error;
        toast.success('Product updated successfully');
      } else {
        const { error } = await supabase.from('products').insert(productData);
        if (error) throw error;
        toast.success('Product created successfully');
      }

      setDialogOpen(false);
      resetForm();
      fetchData(productPage);
    } catch (error: any) {
      toast.error(error.message || 'Error saving product');
    }
  }

  async function handleDeleteProduct(id: string) {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      toast.success('Product deleted successfully');
      fetchData(productPage);
    } catch (error: any) {
      toast.error(error.message || 'Error deleting product');
    }
  }

  async function handleUpdateOrderStatus(orderId: string, status: string) {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);
      if (error) throw error;
      toast.success('Order status updated');
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Error updating order');
    }
  }

  async function handleDeleteUser(profileId: string) {
    const targetProfile = profiles.find(p => p.id === profileId);
    if (targetProfile?.is_admin) {
      toast.error('Admin accounts cannot be deleted');
      return;
    }

    if (!confirm('Are you sure you want to delete this user profile?')) return;

    try {
      const { error } = await supabase.rpc('delete_user_by_admin', { target_user_id: profileId });
      if (error) throw error;
      toast.success('User account deleted successfully');
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Error deleting user account');
    }
  }

  async function handleSaveCoupon() {
    try {
      const couponData = {
        code: couponFormData.code.toUpperCase(),
        discount_percentage: parseInt(couponFormData.discount_percentage),
        active: couponFormData.active,
        expires_at: couponFormData.expires_at || null,
      };

      if (editingCoupon) {
        const { error } = await supabase
          .from('coupons')
          .update(couponData)
          .eq('id', editingCoupon.id);
        if (error) throw error;
        toast.success('Coupon updated successfully');
      } else {
        const { error } = await supabase.from('coupons').insert(couponData);
        if (error) throw error;
        toast.success('Coupon created successfully');
      }

      setCouponDialogOpen(false);
      resetCouponForm();
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Error saving coupon');
    }
  }

  async function handleDeleteCoupon(id: string) {
    if (!confirm('Are you sure you want to delete this coupon?')) return;

    try {
      const { error } = await supabase.from('coupons').delete().eq('id', id);
      if (error) throw error;
      toast.success('Coupon deleted successfully');
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Error deleting coupon');
    }
  }

  function resetCouponForm() {
    setCouponFormData({
      code: '',
      discount_percentage: '',
      active: true,
      expires_at: '',
    });
    setEditingCoupon(null);
  }

  function openEditDialog(product?: Product) {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        description: product.description,
        price: product.price.toString(),
        category: product.category,
        brand: product.brand,
        image_url: product.image_url,
        stock: product.stock.toString(),
        is_featured: product.is_featured,
      });
    } else {
      resetForm();
    }
    setDialogOpen(true);
  }

  function resetForm() {
    setEditingProduct(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      category: 'Makeup',
      brand: '',
      image_url: '',
      stock: '',
      is_featured: false,
    });
  }

  if (authLoading || isInitialLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <Loading />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-8">{tdashboard('title')}</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{tdashboard('stats.totalProducts')}</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProducts}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{tdashboard('stats.totalOrders')}</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalOrders}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{tdashboard('stats.revenue')}</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tc('currencySymbol')} {stats.revenue.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{tdashboard('stats.customers')}</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.customers}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="products">{tdashboard('tabs.products')}</TabsTrigger>
            <TabsTrigger value="orders">{tdashboard('tabs.orders')}</TabsTrigger>
            <TabsTrigger value="users">{tdashboard('tabs.users')}</TabsTrigger>
            <TabsTrigger value="coupons">{tdashboard('tabs.coupons')}</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <DashboardCharts orders={orders} products={allProducts} />
          </TabsContent>

          <TabsContent value="products" className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">{tdashboard('management.products')}</h2>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => { setEditingProduct(null); resetForm(); }} className="gap-2">
                    <Plus className="h-4 w-4" />
                    {tdashboard('actions.addProduct')}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingProduct ? tdashboard('actions.editProduct') : tdashboard('actions.addProduct')}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>{tdashboard('products.name')}</Label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>{tc('description' as any)}</Label>
                      <Textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={3}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>{tdashboard('products.price')}</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>{tdashboard('products.stock')}</Label>
                        <Input
                          type="number"
                          value={formData.stock}
                          onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>{tdashboard('products.category')}</Label>
                        <Select
                          value={formData.category}
                          onValueChange={(value: any) =>
                            setFormData({ ...formData, category: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Makeup">Makeup</SelectItem>
                            <SelectItem value="Skincare">Skincare</SelectItem>
                            <SelectItem value="Haircare">Haircare</SelectItem>
                            <SelectItem value="Fragrance">Fragrance</SelectItem>
                            <SelectItem value="Bath & Body">Bath & Body</SelectItem>
                            <SelectItem value="Men's Grooming">Men's Grooming</SelectItem>
                            <SelectItem value="Tools & Accessories">Tools & Accessories</SelectItem>
                            <SelectItem value="Wellness">Wellness</SelectItem>
                            <SelectItem value="Sun Care">Sun Care</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>{tdashboard('products.brand')}</Label>
                        <Input
                          value={formData.brand}
                          onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                        />
                      </div>
                    </div>
                    <div>
                      <Label>{tdashboard('products.image')}</Label>
                      <div className="mt-2 space-y-4">
                        {formData.image_url && (
                          <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-secondary border border-border">
                            <img
                              src={formData.image_url}
                              alt="Preview"
                              className="object-cover w-full h-full"
                            />
                            <Button
                              variant="destructive"
                              size="icon"
                              className="absolute top-2 right-2 h-8 w-8"
                              onClick={() => setFormData(prev => ({ ...prev, image_url: '' }))}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Input
                            value={formData.image_url}
                            onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                            placeholder="Image URL or upload from device"
                            className="flex-1"
                          />
                          <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleImageUpload}
                          />
                          <Button
                            type="button"
                            variant="secondary"
                            className="shrink-0"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploadingImage}
                          >
                            {isUploadingImage ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Camera className="h-4 w-4 mr-2" />
                            )}
                            {isUploadingImage ? tc('loading') : tdashboard('products.uploadImage')}
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="featured"
                        checked={formData.is_featured}
                        onChange={(e) =>
                          setFormData({ ...formData, is_featured: e.target.checked })
                        }
                      />
                      <Label htmlFor="featured">{tdashboard('products.isFeatured')}</Label>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleSaveProduct} className="flex-1">
                        {tc('save' as any)}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setDialogOpen(false)}
                        className="flex-1"
                      >
                        {tc('cancel' as any)}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className={`grid gap-4 transition-opacity ${isProductsLoading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
              {products.map((product) => (
                <Card key={product.id}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-secondary rounded-lg overflow-hidden">
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <h3 className="font-semibold">{product.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {product.brand} • {product.category}
                        </p>
                        <p className="text-sm mt-1">
                          <span className="font-bold text-primary">
                            {tc('currencySymbol')} {product.price.toFixed(2)}
                          </span>{' '}
                          • Stock: {product.stock}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => openEditDialog(product)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDeleteProduct(product.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalProductCount > 0 && (
              <div className="flex items-center justify-between mt-8 border-t border-border pt-4 px-1">
                <Button
                  variant="outline"
                  onClick={() => {
                    const newPage = Math.max(1, productPage - 1);
                    setProductPage(newPage);
                    fetchProductsOnly(newPage);
                  }}
                  disabled={productPage === 1}
                >
                  Previous
                </Button>
                <div className="text-sm text-muted-foreground font-medium">
                  Page {productPage} of {Math.ceil(totalProductCount / itemsPerPage)}
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    const newPage = Math.min(Math.ceil(totalProductCount / itemsPerPage), productPage + 1);
                    setProductPage(newPage);
                    fetchProductsOnly(newPage);
                  }}
                  disabled={productPage === Math.ceil(totalProductCount / itemsPerPage)}
                >
                  Next
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="orders" className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">{tdashboard('management.orders')}</h2>

            <div className="space-y-4">
              {orders.map((order) => (
                <Card key={order.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="font-semibold">{to('orderNum', { id: order.id.slice(0, 8) })}</p>
                        <p className="text-sm text-muted-foreground">
                          {order.customer_name} • {order.customer_phone}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(order.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        {tc('actions')}
                        <p className="text-xl font-bold text-primary">
                          {tc('currencySymbol')} {order.final_amount.toFixed(2)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {order.payment_method}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <Select
                        value={order.status}
                        onValueChange={(value) =>
                          handleUpdateOrderStatus(order.id, value)
                        }
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">{to('status.pending')}</SelectItem>
                          <SelectItem value="processing">{to('status.processing')}</SelectItem>
                          <SelectItem value="shipped">{to('status.shipped')}</SelectItem>
                          <SelectItem value="delivered">{to('status.delivered')}</SelectItem>
                          <SelectItem value="cancelled">{to('status.cancelled')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-muted-foreground">
                        {order.customer_address}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">{tdashboard('management.users')}</h2>
            <div className="grid gap-4">
              {profiles.map((profile) => (
                <Card key={profile.id}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center overflow-hidden">
                        {profile.avatar_url ? (
                          <img
                            src={profile.avatar_url}
                            alt={profile.full_name || ''}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Users className="h-6 w-6 text-primary" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold flex items-center gap-2">
                          {profile.full_name || tc('noName')}
                          {profile.is_admin && (
                            <Badge variant="secondary">{tc('profile.admin' as any)}</Badge>
                          )}
                        </h3>
                        <p className="text-sm text-muted-foreground">{profile.email}</p>
                        <p className="text-xs text-muted-foreground">
                          {tc('joined', { date: new Date(profile.created_at).toLocaleDateString() })}
                        </p>
                      </div>
                    </div>
                    {!profile.is_admin ? (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDeleteUser(profile.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground border-muted-foreground/20">
                        {tc('systemProtected')}
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="coupons" className="space-y-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">{tdashboard('management.coupons')}</h2>
              <Button onClick={() => { resetCouponForm(); setCouponDialogOpen(true); }} className="gap-2">
                <Plus className="h-4 w-4" />
                {tdashboard('actions.addCoupon')}
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {coupons.map((coupon) => (
                <Card key={coupon.id} className={!coupon.active ? 'opacity-60' : ''}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold text-primary">{coupon.code}</h3>
                          {!coupon.active && <Badge variant="secondary">Inactive</Badge>}
                          {coupon.expires_at && new Date(coupon.expires_at) < new Date() && (
                            <Badge variant="destructive">Expired</Badge>
                          )}
                        </div>
                        <p className="text-2xl font-bold mt-1">{coupon.discount_percentage}% OFF</p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingCoupon(coupon);
                            setCouponFormData({
                              code: coupon.code,
                              discount_percentage: coupon.discount_percentage.toString(),
                              active: coupon.active,
                              expires_at: coupon.expires_at ? new Date(coupon.expires_at).toISOString().split('T')[0] : '',
                            });
                            setCouponDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => handleDeleteCoupon(coupon.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>Created: {new Date(coupon.created_at).toLocaleDateString()}</p>
                      {coupon.expires_at && (
                        <p className={new Date(coupon.expires_at) < new Date() ? 'text-destructive' : ''}>
                          Expires: {new Date(coupon.expires_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Dialog open={couponDialogOpen} onOpenChange={setCouponDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingCoupon ? tdashboard('actions.editCoupon') : tdashboard('actions.addCoupon')}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="code">Coupon Code</Label>
                    <Input
                      id="code"
                      placeholder="SUMMER20"
                      value={couponFormData.code}
                      onChange={(e) => setCouponFormData({ ...couponFormData, code: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="discount">Discount Percentage (%)</Label>
                    <Input
                      id="discount"
                      type="number"
                      placeholder="20"
                      value={couponFormData.discount_percentage}
                      onChange={(e) => setCouponFormData({ ...couponFormData, discount_percentage: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expiry">Expiry Date (Optional)</Label>
                    <Input
                      id="expiry"
                      type="date"
                      value={couponFormData.expires_at}
                      onChange={(e) => setCouponFormData({ ...couponFormData, expires_at: e.target.value })}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="coupon-active"
                      checked={couponFormData.active}
                      onChange={(e) => setCouponFormData({ ...couponFormData, active: e.target.checked })}
                    />
                    <Label htmlFor="coupon-active">{tdashboard('actions.active' as any)}</Label>
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleSaveCoupon} className="flex-1">
                      {editingCoupon ? tdashboard('actions.saveChanges') : tc('add' as any)}
                    </Button>
                    <Button variant="outline" onClick={() => setCouponDialogOpen(false)} className="flex-1">
                      {tc('cancel' as any)}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
