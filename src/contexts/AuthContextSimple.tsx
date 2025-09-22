import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { queryClient } from '@/lib/query-client';
import { flashcardKeys } from '@/hooks/useFlashcards';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signInWithDiscord: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<{ error: Error | null }>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

// Simplified version without database profile management
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const prevUserRef = React.useRef<User | null>(null);

  useEffect(() => {
    let mounted = true;
    
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          prevUserRef.current = session?.user ?? null;
        }
      } catch (error) {
        console.error('Error fetching session:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log('Auth event:', event);
      
      if (!mounted) return;
      
      const prevUser = prevUserRef.current;
      const newUser = newSession?.user ?? null;
      
      // Check if user actually changed (login, logout, or different user)
      const userChanged = prevUser?.id !== newUser?.id;
      
      // Only update if session actually changed
      setSession((prevSession) => {
        // Check if session actually changed
        if (prevSession?.access_token === newSession?.access_token) {
          return prevSession;
        }
        return newSession;
      });
      
      setUser(newUser);
      prevUserRef.current = newUser;
      
      // If user changed (login/logout/switch), invalidate all caches
      if (userChanged) {
        console.log('User changed, invalidating caches', { 
          event, 
          prevUserId: prevUser?.id, 
          newUserId: newUser?.id 
        });
        
        // Clear React Query cache for flashcard data
        queryClient.invalidateQueries({ queryKey: flashcardKeys.all });
        queryClient.removeQueries({ queryKey: flashcardKeys.all });
        
        // Clear UnifiedStorageService cache
        const { UnifiedStorageService } = await import('@/services/unified-storage');
        UnifiedStorageService.invalidateUserCache();
      }
      
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      return { error: null };
    } catch (error) {
      console.error('Signup error:', error);
      return { error: error as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      return { error: null };
    } catch (error) {
      console.error('Login error:', error);
      return { error: error as Error };
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });

      if (error) throw error;

      return { error: null };
    } catch (error) {
      console.error('Google login error:', error);
      return { error: error as Error };
    }
  };

  const signInWithDiscord = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'discord',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });

      if (error) throw error;

      return { error: null };
    } catch (error) {
      console.error('Discord login error:', error);
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Clear all caches
      // 1. Clear React Query cache
      queryClient.invalidateQueries({ queryKey: flashcardKeys.all });
      queryClient.removeQueries({ queryKey: flashcardKeys.all });
      queryClient.clear(); // Clear entire cache to ensure clean state
      
      // 2. Clear UnifiedStorageService cache
      const { UnifiedStorageService } = await import('@/services/unified-storage');
      UnifiedStorageService.invalidateUserCache();
      
      return { error: null };
    } catch (error) {
      console.error('Signout error:', error);
      return { error: error as Error };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      return { error: null };
    } catch (error) {
      console.error('Reset password error:', error);
      return { error: error as Error };
    }
  };

  const updatePassword = async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      return { error: null };
    } catch (error) {
      console.error('Update password error:', error);
      return { error: error as Error };
    }
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signInWithDiscord,
    signOut,
    resetPassword,
    updatePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};