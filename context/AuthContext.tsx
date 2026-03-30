'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, Profile } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, avatarFile?: File) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  async function checkUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        await fetchProfile(user.id);
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  }

  async function refreshProfile() {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (currentUser) await fetchProfile(currentUser.id);
  }

  async function signUp(email: string, password: string, fullName: string, avatarFile?: File) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        let avatarUrl: string | null = null;

        // Upload avatar if provided
        if (avatarFile) {
          try {
            const ext = avatarFile.name.split('.').pop();
            const filePath = `${data.user.id}/avatar.${ext}`;
            const { error: uploadError } = await supabase.storage
              .from('avatars')
              .upload(filePath, avatarFile, { upsert: true, contentType: avatarFile.type });

            if (!uploadError) {
              const { data: urlData } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);
              avatarUrl = urlData.publicUrl;
            }
          } catch {
            // Avatar upload failing should not block account creation
          }
        }

        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email,
            full_name: fullName,
            is_admin: false,
            ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
          });

        if (profileError) throw profileError;
      }
    } catch (error: any) {
      throw new Error(error.message || 'Error signing up');
    }
  }

  async function signIn(email: string, password: string) {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
    } catch (error: any) {
      throw new Error(error.message || 'Error signing in');
    }
  }

  async function signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      setProfile(null);
      router.push('/');
    } catch (error: any) {
      throw new Error(error.message || 'Error signing out');
    }
  }

  const isAdmin = profile?.is_admin ?? false;

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signUp,
        signIn,
        signOut,
        refreshProfile,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
