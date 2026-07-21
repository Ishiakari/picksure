import { Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { supabase } from '@/lib/supabase';

WebBrowser.maybeCompleteAuthSession();

// Helper to prevent infinite loading if network request hangs
function withTimeout<T>(
  promise: Promise<T>, 
  ms = 10000, 
  errorMsg = "Connection timed out. Please check your internet/Wi-Fi connection."
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(errorMsg)), ms)
    )
  ]);
}

// Helper to extract tokens from hash fragment or query string
function extractToken(url: string, param: string): string {
  const match = url.match(new RegExp(`[#?&]${param}=([^&]*)`));
  return match ? decodeURIComponent(match[1]) : '';
}

/**
 * Official Supabase + Expo Google OAuth Handler with Android Dismiss Fallback.
 */
export async function signInWithGoogle() {
  const redirectUri = AuthSession.makeRedirectUri({
    scheme: 'picksure',
    preferLocalhost: false,
  });

  const { data, error } = await withTimeout(
    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUri,
        skipBrowserRedirect: true,
      },
    })
  );

  if (error) {
    Alert.alert("OAuth Error", error.message);
    throw error;
  }

  if (data?.url) {
    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);
    
    // 1. If WebBrowser returned success with URL, extract tokens directly
    if (result.type === 'success' && result.url) {
      const accessToken = extractToken(result.url, 'access_token');
      const refreshToken = extractToken(result.url, 'refresh_token');

      if (accessToken && refreshToken) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (sessionError) throw sessionError;
        return;
      }
    }

    // 2. Fallback check: On Android, Chrome tabs may dismiss before resolving result.url.
    // Check if Supabase session was established in background.
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData?.session) {
      return;
    }
  }
}

/**
 * Explicit Email & Password Sign In with 10-second timeout guard
 */
export async function signInWithPassword(email: string, pass: string) {
  const cleanEmail = email.trim().toLowerCase();
  
  const { data, error } = await withTimeout(
    supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: pass,
    }),
    10000,
    "Sign-in timed out. Please check your internet connection."
  );

  if (error) throw error;
  return data;
}

/**
 * Explicit Email & Password Registration with 10-second timeout guard
 */
export async function signUpWithPassword(email: string, pass: string, fullName?: string) {
  const cleanEmail = email.trim().toLowerCase();
  
  const { data, error } = await withTimeout(
    supabase.auth.signUp({
      email: cleanEmail,
      password: pass,
      options: {
        data: {
          full_name: fullName || 'PickSure Creator',
        }
      }
    }),
    10000,
    "Registration timed out. Please check your internet connection."
  );

  if (error) throw error;
  return data;
}

/**
 * Initiates Supabase Email OTP (One-Time Password / Magic Code).
 */
export async function signInWithEmailOTP(email: string) {
  const { data, error } = await withTimeout(
    supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        shouldCreateUser: true,
      }
    })
  );

  if (error) throw error;
  return data;
}

/**
 * Verifies the 6-digit OTP code sent to the user's email.
 */
export async function verifyEmailOTP(email: string, token: string) {
  const { data, error } = await withTimeout(
    supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: token.trim(),
      type: 'email',
    })
  );

  if (error) throw error;
  return data;
}