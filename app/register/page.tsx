'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, Sparkles, X } from 'lucide-react';
import { toast } from 'sonner';

export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    e.target.value = '';
  };

  const removeAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await signUp(email, password, fullName, avatarFile ?? undefined);
      toast.success('Account created successfully! Please sign in.');
      router.push('/login');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const displayInitial = (fullName || email || '?')[0].toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl">Create Account</CardTitle>
            <CardDescription>
              Join SetraStore and start shopping premium beauty products
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Avatar Picker */}
              <div className="flex flex-col items-center gap-2 pb-2">
                <Label className="text-sm font-medium self-start">
                  Profile Picture <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="group relative w-24 h-24 rounded-full border-2 border-dashed border-border hover:border-primary overflow-hidden flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  >
                    {avatarPreview ? (
                      <Image
                        src={avatarPreview}
                        alt="Avatar preview"
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div
                        className="w-full h-full flex flex-col items-center justify-center gap-1"
                        style={{
                          background: 'linear-gradient(135deg, hsl(340,75%,95%), hsl(20,70%,95%))',
                        }}
                      >
                        {fullName ? (
                          <span className="text-3xl font-bold text-primary">{displayInitial}</span>
                        ) : (
                          <Camera className="h-7 w-7 text-muted-foreground" />
                        )}
                        <span className="text-[9px] text-muted-foreground font-medium">ADD PHOTO</span>
                      </div>
                    )}
                    {/* Hover overlay */}
                    {avatarPreview && (
                      <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="h-6 w-6 text-white mb-1" />
                        <span className="text-white text-[10px]">Change</span>
                      </div>
                    )}
                  </button>

                  {/* Remove button */}
                  {avatarPreview && (
                    <button
                      type="button"
                      onClick={removeAvatar}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-white rounded-full flex items-center justify-center hover:bg-destructive/90 transition-colors shadow-md"
                      title="Remove photo"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">JPG, PNG or WebP · Max 5 MB</p>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarSelect}
                />
              </div>

              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Jane Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Creating account…' : 'Sign Up'}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">Already have an account? </span>
              <Link href="/login" className="text-primary font-medium hover:underline">
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
