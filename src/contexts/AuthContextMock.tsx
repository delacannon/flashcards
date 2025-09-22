import React, { createContext, useContext, useState } from 'react';

interface MockUser {
  id: string;
  email: string | null;
}

interface AuthContextType {
  user: MockUser | null;
  session: any | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
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

// Mock auth provider for testing without Supabase
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<MockUser | null>(null);
  const [loading] = useState(false);

  const signUp = async (email: string, password: string) => {
    // Simulate signup
    console.log('Mock signup:', email);
    setUser({
      id: 'mock-user-id',
      email: email,
    });
    alert('Mock signup successful! You are now "logged in" for testing.');
    return { error: null };
  };

  const signIn = async (email: string, password: string) => {
    // Simulate signin
    console.log('Mock signin:', email);
    setUser({
      id: 'mock-user-id',
      email: email,
    });
    return { error: null };
  };

  const signOut = async () => {
    setUser(null);
    return { error: null };
  };

  const resetPassword = async (email: string) => {
    console.log('Mock reset password for:', email);
    alert('Mock: Password reset email "sent" to ' + email);
    return { error: null };
  };

  const updatePassword = async (newPassword: string) => {
    console.log('Mock update password');
    return { error: null };
  };

  const value: AuthContextType = {
    user,
    session: user ? { user } : null,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};