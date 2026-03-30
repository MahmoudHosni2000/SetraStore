'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
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

const categories = [
  { name: 'Makeup', href: '/products?category=Makeup' },
  { name: 'Skincare', href: '/products?category=Skincare' },
  { name: 'Haircare', href: '/products?category=Haircare' },
  { name: 'Fragrance', href: '/products?category=Fragrance' },
];

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, profile, signOut, isAdmin } = useAuth();
  const { cartCount } = useCart();
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              {/* <Sparkles className="h-6 w-6 text-primary" /> */}
              <Image src="/Logo.jpeg" alt="SetraStore" width={120} height={120} className="h-14 w-14 rounded-full" />
              <span className="text-2xl font-bold text-primary">SetraStore</span>
            </Link>

            <div className="hidden md:flex items-center gap-6">
              {categories.map((category) => (
                <Link
                  key={category.name}
                  href={category.href}
                  className={`text-sm font-medium transition-colors hover:text-primary ${pathname.includes(category.name) ? 'text-primary' : 'text-foreground'
                    }`}
                >
                  {category.name}
                </Link>
              ))}
            </div>
          </div>

          <div className="hidden md:flex items-center gap-4">
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
                      {profile?.full_name || 'User'}
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="cursor-pointer">
                        <UserCircle2 className="mr-2 h-4 w-4" />
                        My Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/orders" className="cursor-pointer">
                        <Package className="mr-2 h-4 w-4" />
                        My Orders
                      </Link>
                    </DropdownMenuItem>
                    {isAdmin && (
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="cursor-pointer">
                          <Settings className="mr-2 h-4 w-4" />
                          Admin Dashboard
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleSignOut}
                      className="cursor-pointer"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button variant="ghost">Sign In</Button>
                </Link>
                <Link href="/register">
                  <Button>Sign Up</Button>
                </Link>
              </div>
            )}
          </div>

          <div className="md:hidden">
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
                key={category.name}
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
                    Wishlist
                  </Link>
                  <Link
                    href="/cart"
                    className="flex items-center justify-between py-2 text-base font-medium hover:text-primary"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span>Cart</span>
                    {cartCount > 0 && (
                      <Badge variant="destructive">{cartCount}</Badge>
                    )}
                  </Link>
                  <Link
                    href="/profile"
                    className="block py-2 text-base font-medium hover:text-primary"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    My Profile
                  </Link>
                  <Link
                    href="/orders"
                    className="block py-2 text-base font-medium hover:text-primary"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    My Orders
                  </Link>
                  {isAdmin && (
                    <Link
                      href="/admin"
                      className="block py-2 text-base font-medium hover:text-primary"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Admin Dashboard
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      handleSignOut();
                      setMobileMenuOpen(false);
                    }}
                    className="block w-full text-left py-2 text-base font-medium hover:text-primary"
                  >
                    Sign Out
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
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="block py-2 text-base font-medium hover:text-primary"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
