import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { Linking } from 'react-native';
import { supabase } from '@/lib/supabase';
import { 
  signInWithGoogle as googleSignIn,
  signInWithPassword as passwordSignIn,
  signUpWithPassword as passwordSignUp,
  signInWithEmailOTP as emailSignIn,
  verifyEmailOTP as emailVerify
} from '@/lib/auth';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithPassword: (email: string, pass: string) => Promise<any>;
  signUpWithPassword: (email: string, pass: string, fullName?: string) => Promise<any>;
  signInWithEmailOTP: (email: string) => Promise<any>;
  verifyEmailOTP: (email: string, token: string) => Promise<any>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signInWithGoogle: async () => {},
  signInWithPassword: async () => {},
  signUpWithPassword: async () => {},
  signInWithEmailOTP: async () => {},
  verifyEmailOTP: async () => {},
  signOut: async () => {},
});

// Helper to extract tokens from redirect URL
function extractToken(url: string, param: string): string {
  const match = url.match(new RegExp(`[#?&]${param}=([^&]*)`));
  return match ? decodeURIComponent(match[1]) : '';
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Deep Link url handler
    const handleDeepLink = async (event: { url: string }) => {
      const url = event.url;
      if (url.includes('access_token')) {
        const accessToken = extractToken(url, 'access_token');
        const refreshToken = extractToken(url, 'refresh_token');

        if (accessToken && refreshToken) {
          setLoading(true);
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) {
            console.error("Deep link setSession error:", error.message);
          }
          setLoading(false);
        }
      }
    };

    const linkSubscription = Linking.addEventListener('url', handleDeepLink);

    // Also check if app was opened via a deep link initially
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink({ url });
    });

    return () => {
      subscription.unsubscribe();
      linkSubscription.remove();
    };
  }, []);

  const signInWithGoogle = async () => {
    await googleSignIn();
  };

  const signInWithPassword = async (email: string, pass: string) => {
    return await passwordSignIn(email, pass);
  };

  const signUpWithPassword = async (email: string, pass: string, fullName?: string) => {
    return await passwordSignUp(email, pass, fullName);
  };

  const signInWithEmailOTP = async (email: string) => {
    return await emailSignIn(email);
  };

  const verifyEmailOTP = async (email: string, token: string) => {
    return await emailVerify(email, token);
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn("Supabase signOut warning:", err);
    } finally {
      setUser(null);
      setSession(null);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      loading, 
      signInWithGoogle, 
      signInWithPassword,
      signUpWithPassword,
      signInWithEmailOTP, 
      verifyEmailOTP, 
      signOut 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
