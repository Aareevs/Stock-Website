import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';

export interface Profile {
  id: string;
  username: string;
  display_name: string;
  role: 'admin' | 'participant';
  cash_balance: number;
  starting_capital: number;
}

interface AuthContextValue {
  user: { id: string } | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (username: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = 'vsx_user_id';

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for saved session on mount
  useEffect(() => {
    const savedUserId = localStorage.getItem(STORAGE_KEY);
    if (savedUserId) {
      // Fetch profile by ID
      supabase
        .from('profiles')
        .select('*')
        .eq('id', savedUserId)
        .single()
        .then(({ data, error }) => {
          if (!error && data) {
            setProfile(data as Profile);
            setUser({ id: data.id });
          } else {
            // Invalid saved session, clear it
            localStorage.removeItem(STORAGE_KEY);
          }
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  // Poll to refresh profile every 3 seconds (for balance updates after trades)
  useEffect(() => {
    if (!user) return;
    
    const interval = setInterval(async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (data) {
        setProfile(prev => {
          // Only update if cash_balance changed
          if (prev?.cash_balance !== data.cash_balance) {
            return data as Profile;
          }
          return prev;
        });
      }
    }, 3000);
    
    return () => clearInterval(interval);
  }, [user]);

  const signIn = async (username: string, password: string) => {
    // Look up user by username and password
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username.toLowerCase())
      .eq('password', password)
      .single();

    if (error || !data) {
      return { error: 'Invalid username or password' };
    }

    // Save session
    setProfile(data as Profile);
    setUser({ id: data.id });
    localStorage.setItem(STORAGE_KEY, data.id);
    
    return { error: null };
  };

  const signOut = async () => {
    localStorage.removeItem(STORAGE_KEY);
    setProfile(null);
    setUser(null);
  };

  const refreshProfile = async () => {
    if (user) {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (data) {
        setProfile(data as Profile);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signIn,
        signOut,
        refreshProfile,
        isAdmin: profile?.role === 'admin',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
