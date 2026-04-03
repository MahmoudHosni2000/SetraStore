'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Link, useRouter } from '@/i18n/navigation';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import Loading from '@/components/Loading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Edit3,
  Save,
  X,
  Shield,
  Calendar,
  Package,
  ShoppingBag,
  CheckCircle,
  AlertCircle,
  Lock,
  Camera,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations, useLocale } from 'next-intl';

interface ProfileForm {
  full_name: string;
  phone: string;
  address: string;
}

interface PasswordForm {
  newPassword: string;
  confirmPassword: string;
}

export default function ProfilePage() {
  const { user, profile, loading, refreshProfile, signOut } = useAuth();
  const router = useRouter();
  const t = useTranslations('profile');
  const tc = useTranslations('common');
  const tnav = useTranslations('nav');
  const locale = useLocale();

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [orderCount, setOrderCount] = useState<number>(0);

  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<ProfileForm>({
    full_name: '',
    phone: '',
    address: '',
  });

  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    newPassword: '',
    confirmPassword: '',
  });

  // Populate form when profile loads
  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        address: profile.address || '',
      });
      setAvatarPreview(profile.avatar_url || null);
    }
  }, [profile]);

  // Fetch order count
  useEffect(() => {
    if (user) {
      supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .then(({ count }) => setOrderCount(count ?? 0));
    }
  }, [user]);

  // ---------- Avatar Upload ----------
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate
    if (!file.type.startsWith('image/')) {
      toast.error(t('invalidImageToast') || 'Please select a valid image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('imageSizeToast') || 'Image must be smaller than 5 MB');
      return;
    }

    // Local preview immediately
    const objectUrl = URL.createObjectURL(file);
    setAvatarPreview(objectUrl);

    setIsUploadingAvatar(true);
    try {
      const ext = file.name.split('.').pop();
      const filePath = `${user.id}/avatar.${ext}`;

      // Upsert into storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true, contentType: file.type });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`; // cache-bust

      // Persist in profile row
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setAvatarPreview(publicUrl);
      await refreshProfile();
      toast.success(t('avatarSuccess') || 'Profile picture updated!');
    } catch (err: any) {
      toast.error(err.message || t('avatarError') || 'Failed to upload avatar');
      setAvatarPreview(profile?.avatar_url || null);
    } finally {
      setIsUploadingAvatar(false);
      // Reset input so same file can be re-selected
      e.target.value = '';
    }
  };

  // ---------- Profile Save ----------
  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: form.full_name,
          phone: form.phone,
          address: form.address,
        })
        .eq('id', user.id);

      if (error) throw error;
      await refreshProfile();
      toast.success(t('profileSuccess') || 'Profile updated successfully!');
      setIsEditing(false);
    } catch (err: any) {
      toast.error(err.message || t('profileError') || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setForm({
      full_name: profile?.full_name || '',
      phone: profile?.phone || '',
      address: profile?.address || '',
    });
    setIsEditing(false);
  };

  // ---------- Password Change ----------
  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error(t('passwordsDontMatch') || 'New passwords do not match');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error(t('passwordShort') || 'Password must be at least 6 characters');
      return;
    }

    setIsSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword,
      });
      if (error) throw error;
      toast.success(t('passwordSuccess') || 'Password changed successfully!');
      setPasswordForm({ newPassword: '', confirmPassword: '' });
      setIsChangingPassword(false);
    } catch (err: any) {
      toast.error(err.message || t('passwordError') || 'Failed to change password');
    } finally {
      setIsSavingPassword(false);
    }
  };

  // ---------- Delete Account ----------
  const handleDeleteAccount = async () => {
    if (!confirm(t('deleteConfirm') || 'Are you sure you want to delete your account? This action cannot be undone.')) return;
    if (!user) return;

    try {
      const { error } = await supabase.rpc('delete_own_user');
      if (error) throw error;
      await signOut();
      toast.success(t('deleteSuccess') || 'Account deleted successfully');
    } catch (err: any) {
      toast.error(err.message || t('deleteError') || 'Failed to delete account');
    }
  };

  // ---------- Render ----------
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <Loading />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-5xl mx-auto px-4 py-24 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-accent mb-6">
            <User className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-2">{t('signInPrompt')}</h2>
          <p className="text-muted-foreground mb-8">
            {t('signInDescription')}
          </p>
          <Link href="/login">
            <Button size="lg">{tc('signIn')}</Button>
          </Link>
        </div>
      </div>
    );
  }

  const memberSince = user.created_at
    ? new Date(user.created_at).toLocaleDateString(locale, { year: 'numeric', month: 'long' })
    : 'N/A';

  const displayInitial = (form.full_name || user.email || '?')[0].toUpperCase();
  console.log(profile)
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Banner */}
      <div
        className="relative h-48 md:h-56 overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, hsl(340,75%,65%) 0%, hsl(20,70%,70%) 100%)',
        }}
      >
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Avatar + Name Row */}
        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-16 mb-8">
          {/* Clickable avatar */}
          <div className="relative flex-shrink-0">
            <button
              onClick={() => avatarInputRef.current?.click()}
              disabled={isUploadingAvatar}
              className="group relative block w-28 h-28 md:w-32 md:h-32 rounded-full border-4 border-background shadow-xl overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              title={t('clickToChange')}
            >
              {avatarPreview ? (
                <Image
                  src={avatarPreview}
                  alt={t('profilePicture')}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center text-4xl font-bold text-white"
                  style={{
                    background: 'linear-gradient(135deg, hsl(340,75%,60%), hsl(20,70%,65%))',
                  }}
                >
                  {displayInitial}
                </div>
              )}
              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {isUploadingAvatar ? (
                  <Loader2 className="h-7 w-7 text-white animate-spin" />
                ) : (
                  <>
                    <Camera className="h-6 w-6 text-white mb-1" />
                    <span className="text-white text-[10px] font-medium">{t('changePhoto')}</span>
                  </>
                )}
              </div>
            </button>

            {/* Hidden file input */}
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />

            {/* Camera badge */}
            <button
              onClick={() => avatarInputRef.current?.click()}
              disabled={isUploadingAvatar}
              className={`absolute bottom-1 end-1 w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center shadow-md hover:bg-primary/90 transition-colors border-2 border-background`}
              title={t('changePhoto')}
            >
              {isUploadingAvatar ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Camera className="h-3.5 w-3.5" />
              )}
            </button>
          </div>

          <div className="text-center sm:text-start pb-2">
            <h1 className="text-2xl md:text-3xl font-bold">
              {profile?.full_name || t('welcomeHome')}
            </h1>
            <p className="text-muted-foreground text-sm">{user.email}</p>
            <div className="flex items-center justify-center sm:justify-start gap-2 mt-2 flex-wrap">
              {profile?.is_admin && (
                <Badge className="bg-primary text-white text-xs">
                  <Shield className="h-3 w-3 me-1" /> {t('admin')}
                </Badge>
              )}
              <Badge variant="secondary" className="text-xs">
                <Calendar className="h-3 w-3 me-1" /> {tc('memberSince', { date: memberSince })}
              </Badge>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <Card className="text-center py-6 hover:shadow-md transition-shadow">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-accent mb-3">
              <Package className="h-6 w-6 text-primary" />
            </div>
            <p className="text-3xl font-bold text-primary">{orderCount}</p>
            <p className="text-sm text-muted-foreground mt-1">{tc('totalOrders')}</p>
          </Card>
          <Card className="text-center py-6 hover:shadow-md transition-shadow">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-accent mb-3">
              <ShoppingBag className="h-6 w-6 text-primary" />
            </div>
            <p className="text-3xl font-bold text-primary">{profile?.is_admin ? t('admin') : t('member')}</p>
            <p className="text-sm text-muted-foreground mt-1">{tc('accountType')}</p>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
          {/* Personal Info + Password */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Info Card */}
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    {t('personalInfo')}
                  </CardTitle>
                  {!isEditing ? (
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="gap-1.5">
                      <Edit3 className="h-4 w-4" /> {t('edit')}
                    </Button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={handleCancel} className="gap-1.5 text-muted-foreground">
                        <X className="h-4 w-4" /> {t('cancel')}
                      </Button>
                      <Button size="sm" onClick={handleSave} disabled={isSaving} className="gap-1.5">
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        {isSaving ? t('saving') : t('save')}
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="pt-6 space-y-5">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="full_name" className="flex items-center gap-2 text-sm font-medium">
                    <User className="h-4 w-4 text-muted-foreground" /> {t('fullName')}
                  </Label>
                  {isEditing ? (
                    <Input
                      id="full_name"
                      value={form.full_name}
                      onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                      placeholder={t('fullNamePlaceholder')}
                    />
                  ) : (
                    <p className="text-sm py-2 px-3 bg-muted/40 rounded-md">
                      {profile?.full_name || <span className="text-muted-foreground italic">{tc('notSet')}</span>}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-2 text-sm font-medium">
                    <Mail className="h-4 w-4 text-muted-foreground" /> {t('email')}
                  </Label>
                  <div className="flex items-center gap-2">
                    <p className="flex-1 text-sm py-2 px-3 bg-muted/40 rounded-md">{user.email}</p>
                    <Badge variant="outline" className="text-xs shrink-0 gap-1 text-green-600 border-green-200 bg-green-50">
                      <CheckCircle className="h-3 w-3" /> {tc('verified')}
                    </Badge>
                  </div>
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="flex items-center gap-2 text-sm font-medium">
                    <Phone className="h-4 w-4 text-muted-foreground" /> {t('phone')}
                  </Label>
                  {isEditing ? (
                    <Input
                      id="phone"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="+1 (555) 000-0000"
                    />
                  ) : (
                    <p className="text-sm py-2 px-3 bg-muted/40 rounded-md">
                      {profile?.phone || <span className="text-muted-foreground italic">{tc('notSet')}</span>}
                    </p>
                  )}
                </div>

                {/* Address */}
                <div className="space-y-1.5">
                  <Label htmlFor="address" className="flex items-center gap-2 text-sm font-medium">
                    <MapPin className="h-4 w-4 text-muted-foreground" /> {t('address')}
                  </Label>
                  {isEditing ? (
                    <Input
                      id="address"
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      placeholder={t('addressPlaceholder')}
                    />
                  ) : (
                    <p className="text-sm py-2 px-3 bg-muted/40 rounded-md">
                      {profile?.address || <span className="text-muted-foreground italic">{tc('notSet')}</span>}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Password Card */}
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Lock className="h-5 w-5 text-primary" /> {t('passwordSecurity')}
                  </CardTitle>
                  {!isChangingPassword && (
                    <Button variant="outline" size="sm" onClick={() => setIsChangingPassword(true)} className="gap-1.5">
                      <Edit3 className="h-4 w-4" /> {t('change')}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="pt-6">
                {!isChangingPassword ? (
                  <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-md">
                    <AlertCircle className="h-5 w-5 text-muted-foreground shrink-0" />
                    <p className="text-sm text-muted-foreground">
                      {t('passwordHint')}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="new_password">{t('newPassword')}</Label>
                      <Input
                        id="new_password"
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                        placeholder={t('passwordLengthHint')}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="confirm_password">{t('confirmNewPassword')}</Label>
                      <Input
                        id="confirm_password"
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                        placeholder={t('confirmNewPasswordPlaceholder')}
                      />
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setIsChangingPassword(false);
                          setPasswordForm({ newPassword: '', confirmPassword: '' });
                        }}
                        className="gap-1.5 text-muted-foreground"
                      >
                        <X className="h-4 w-4" /> {t('cancel')}
                      </Button>
                      <Button size="sm" onClick={handlePasswordChange} disabled={isSavingPassword} className="gap-1.5">
                        {isSavingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        {isSavingPassword ? t('saving') : t('updatePassword')}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Avatar hint card */}
            <Card className="shadow-sm bg-gradient-to-br from-accent/60 to-accent/20">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start gap-3">
                  <Camera className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium mb-1">{t('profilePicture')}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {t('avatarHint')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Links */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{t('quickLinks')}</CardTitle>
              </CardHeader>
              <Separator />
              <CardContent className="pt-4 space-y-2">
                <Link href="/orders">
                  <Button variant="ghost" className="w-full justify-start gap-3 h-10 hover:bg-accent">
                    <Package className="h-4 w-4 text-primary" /> {tnav('myOrders')}
                  </Button>
                </Link>
                <Link href="/wishlist">
                  <Button variant="ghost" className="w-full justify-start gap-3 h-10 hover:bg-accent">
                    <ShoppingBag className="h-4 w-4 text-primary" /> {t('wishlist')}
                  </Button>
                </Link>
                {profile?.is_admin && (
                  <Link href="/admin">
                    <Button variant="ghost" className="w-full justify-start gap-3 h-10 hover:bg-accent">
                      <Shield className="h-4 w-4 text-primary" /> {tnav('adminDashboard')}
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>

            {/* Sign Out */}
            <Card className="shadow-sm border-destructive/20 bg-destructive/5">
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-muted-foreground mb-1 font-medium">{t('signedInAs')}</p>
                <p className="text-xs text-foreground font-medium mb-3 truncate">{user.email}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-destructive/30 text-destructive hover:bg-destructive hover:text-white transition-colors"
                  onClick={async () => {
                    await supabase.auth.signOut();
                    router.push('/');
                  }}
                >
                  {tc('signOut')}
                </Button>
              </CardContent>
            </Card>

            {/* Delete Account */}
            {!profile?.is_admin && (
              <Card className="shadow-sm border-destructive/20 bg-destructive/5 mt-4">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-destructive flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" /> {t('dangerZone')}
                  </CardTitle>
                </CardHeader>
                <Separator className="bg-destructive/10" />
                <CardContent className="pt-4 pb-4">
                  <p className="text-xs text-muted-foreground mb-4">
                    {t('deleteAccountDescription')}
                  </p>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-full"
                    onClick={handleDeleteAccount}
                  >
                    {t('deleteAccount')}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

