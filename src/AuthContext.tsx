import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, type Profile } from './lib/supabase';
import { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Safety timeout: If auth hasn't resolved in 10 seconds, force loading to false
    const safetyTimer = setTimeout(() => {
      if (loading) {
        console.warn('Auth initialization timed out. Forcing loading to false.');
        setLoading(false);
      }
    }, 10000);

    // Check active sessions and subscribe to auth changes
    try {
      supabase.auth.getSession().then(({ data: { session } }) => {
        clearTimeout(safetyTimer);
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchProfile(session.user.id);
        } else {
          setLoading(false);
        }
      }).catch(err => {
        console.error('Supabase session error:', err);
        if (err.message === 'Failed to fetch') {
          console.error('NETWORK ERROR: Supabase is unreachable. Check your VITE_SUPABASE_URL and internet connection.');
        } else if (err.message?.includes('Supabase configuration missing')) {
          console.warn('Supabase keys are not set yet.');
        }
        clearTimeout(safetyTimer);
        setLoading(false);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchProfile(session.user.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
      });

      return () => {
        clearTimeout(safetyTimer);
        subscription.unsubscribe();
      };
    } catch (err) {
      console.error('Supabase initialization error in AuthProvider:', err);
      clearTimeout(safetyTimer);
      setLoading(false);
    }
  }, []);

  const fetchingRef = React.useRef<string | null>(null);

  async function fetchProfile(userId: string, retryCount = 0) {
    if (fetchingRef.current === userId && retryCount === 0) return;
    fetchingRef.current = userId;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile from Supabase:', error);
        
        // If table doesn't exist (42P01) or RLS error (42501), don't keep user in loading
        if (error.code === '42P01' || error.code === '42501') {
          console.warn('Profile table issue detected. Stopping loading.');
          setProfile(null);
          setLoading(false);
          return;
        }
        throw error;
      }
      
      if (data) {
        setProfile(data);
        setLoading(false);
      } else if (retryCount < 3) {
        // Retry after a short delay (2s, 4s, 6s)
        console.log(`Profile not found, retrying... (${retryCount + 1}/3)`);
        setTimeout(() => fetchProfile(userId, retryCount + 1), 2000 * (retryCount + 1));
      } else {
        console.warn('Profile not found for user after retries:', userId);
        setProfile(null);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setProfile(null);
      setLoading(false);
    } finally {
      fetchingRef.current = null;
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = React.useMemo(() => ({
    user,
    profile,
    loading,
    signOut
  }), [user, profile, loading]);

  return (
    <AuthContext.Provider value={value}>
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
