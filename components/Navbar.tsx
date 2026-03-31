'use client';

import React, { useState } from 'react';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useTranslations, useLocale } from 'next-intl';
import {
  ShoppingCart,
  Heart,
  User,
  Menu,
  X,
  LogOut,
  Package,
  Settings,
  Sparkles,
  UserCircle2,
  Languages,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, profile, signOut, isAdmin } = useAuth();
  const { cartCount } = useCart();
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations('nav');
  const tc = useTranslations('common');
  const locale = useLocale();

  const categories = [
    { name: t('makeup'), href: '/products?category=Makeup', key: 'Makeup' },
    { name: t('skincare'), href: '/products?category=Skincare', key: 'Skincare' },
    { name: t('haircare'), href: '/products?category=Haircare', key: 'Haircare' },
    { name: t('fragrance'), href: '/products?category=Fragrance', key: 'Fragrance' },
  ];

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const toggleLanguage = () => {
    const nextLocale = locale === 'en' ? 'ar' : 'en';
    router.replace(pathname, { locale: nextLocale });
  };

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/Logo.jpeg" alt="SetraStore" width={120} height={120} className="h-14 w-14 rounded-full" />
              <span className="text-2xl font-bold text-primary">SetraStore</span>
            </Link>

            <div className="hidden md:flex items-center gap-6">
              {categories.map((category) => (
                <Link
                  key={category.key}
                  href={category.href}
                  className={`text-sm font-medium transition-colors hover:text-primary ${pathname.includes(category.key) ? 'text-primary' : 'text-foreground'
                    }`}
                >
                  {category.name}
                </Link>
              ))}
            </div>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleLanguage}
              className="gap-2 font-medium"
            >
              <Languages className="h-4 w-4" />
              {locale === 'en' ? 'العربية' : 'English'}
            </Button>

            {user ? (
              <>
                <Link href="/wishlist">
                  <Button variant="ghost" size="icon" className="relative">
                    <Heart className="h-5 w-5" />
                  </Button>
                </Link>

                <Link href="/cart">
                  <Button variant="ghost" size="icon" className="relative">
                    <ShoppingCart className="h-5 w-5" />
                    {cartCount > 0 && (
                      <Badge
                        variant="destructive"
                        className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                      >
                        {cartCount}
                      </Badge>
                    )}
                  </Button>
                </Link>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <User className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <div className="px-2 py-1.5 text-sm font-semibold">
                      {profile?.full_name || tc('notSet')}
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="cursor-pointer">
                        <UserCircle2 className="mr-2 h-4 w-4" />
                        {t('myProfile')}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/orders" className="cursor-pointer">
                        <Package className="mr-2 h-4 w-4" />
                        {t('myOrders')}
                      </Link>
                    </DropdownMenuItem>
                    {isAdmin && (
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="cursor-pointer">
                          <Settings className="mr-2 h-4 w-4" />
                          {t('adminDashboard')}
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleSignOut}
                      className="cursor-pointer"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      {tc('signOut')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button variant="ghost">{tc('signIn')}</Button>
                </Link>
                <Link href="/register">
                  <Button>{tc('signUp')}</Button>
                </Link>
              </div>
            )}
          </div>

          <div className="md:hidden flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleLanguage}
              className="px-2"
            >
              {locale === 'en' ? 'AR' : 'EN'}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border">
          <div className="px-4 py-4 space-y-3">
            {categories.map((category) => (
              <Link
                key={category.key}
                href={category.href}
                className="block py-2 text-base font-medium hover:text-primary"
                onClick={() => setMobileMenuOpen(false)}
              >
                {category.name}
              </Link>
            ))}

            {user ? (
              <>
                <div className="border-t border-border pt-3 mt-3 space-y-3">
                  <Link
                    href="/wishlist"
                    className="block py-2 text-base font-medium hover:text-primary"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t('wishlist')}
                  </Link>
                  <Link
                    href="/cart"
                    className="flex items-center justify-between py-2 text-base font-medium hover:text-primary"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span>{t('cart')}</span>
                    {cartCount > 0 && (
                      <Badge variant="destructive">{cartCount}</Badge>
                    )}
                  </Link>
                  <Link
                    href="/profile"
                    className="block py-2 text-base font-medium hover:text-primary"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t('myProfile')}
                  </Link>
                  <Link
                    href="/orders"
                    className="block py-2 text-base font-medium hover:text-primary"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t('myOrders')}
                  </Link>
                  {isAdmin && (
                    <Link
                      href="/admin"
                      className="block py-2 text-base font-medium hover:text-primary"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {t('adminDashboard')}
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      handleSignOut();
                      setMobileMenuOpen(false);
                    }}
                    className="block w-full text-left py-2 text-base font-medium hover:text-primary"
                  >
                    {tc('signOut')}
                  </button>
                </div>
              </>
            ) : (
              <div className="border-t border-border pt-3 mt-3 space-y-3">
                <Link
                  href="/login"
                  className="block py-2 text-base font-medium hover:text-primary"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {tc('signIn')}
                </Link>
                <Link
                  href="/register"
                  className="block py-2 text-base font-medium hover:text-primary"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {tc('signUp')}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

