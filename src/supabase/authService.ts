import { User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured, ADMIN_BOOTSTRAP_EMAIL } from './config';
import { upsertUserProfile, checkIsAdmin, getUserProfile } from './databaseService';
import { UserProfile } from '../types';

/**
 * Formats a phone number or email into a Supabase Auth compatible email identifier
 */
export function formatAuthEmail(identifier: string, method: 'email' | 'phone'): string {
  if (method === 'email') {
    return identifier.trim().toLowerCase();
  }
  const digitsOnly = identifier.replace(/[^0-9]/g, '');
  return `phone_${digitsOnly || 'user'}@kdcsupport.local`;
}

export interface SupabaseAuthResult {
  user: {
    id: string;
    email?: string;
    user_metadata?: Record<string, any>;
  };
  profile: UserProfile;
  isAdmin: boolean;
}

/**
 * Authenticates or registers a user via Supabase Auth
 */
export async function authenticateCustomer(params: {
  identifier: string;
  password: string;
  method: 'email' | 'phone';
  displayName?: string;
}): Promise<SupabaseAuthResult> {
  const email = formatAuthEmail(params.identifier, params.method);
  const password = params.password.length >= 6 ? params.password : `${params.password}123456`.slice(0, 8);
  const isBootstrap = email.toLowerCase() === ADMIN_BOOTSTRAP_EMAIL.toLowerCase();

  // If Supabase is not yet configured with real API keys in this environment, provide graceful local authentication
  if (!isSupabaseConfigured) {
    const mockUid = 'usr-' + Math.random().toString(36).substring(2, 10);
    const mockProfile = await upsertUserProfile({
      uid: mockUid,
      email: params.method === 'email' ? params.identifier : email,
      phone: params.method === 'phone' ? params.identifier : '',
      displayName: params.displayName || (params.method === 'email' ? params.identifier.split('@')[0] : 'Customer'),
      role: isBootstrap ? 'admin' : 'customer',
    });

    return {
      user: { id: mockUid, email },
      profile: mockProfile,
      isAdmin: isBootstrap,
    };
  }

  // 1. Attempt Sign In with Supabase Auth
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  let authUser: User | null = signInData?.user || null;

  if (signInError) {
    // If user does not exist or credentials invalid, attempt auto-signup
    const isUserNotFound =
      signInError.message?.toLowerCase().includes('invalid login credentials') ||
      signInError.message?.toLowerCase().includes('user not found');

    if (isUserNotFound) {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: params.displayName || 'Customer',
            phone: params.method === 'phone' ? params.identifier : '',
            role: isBootstrap ? 'admin' : 'customer',
          },
        },
      });

      if (signUpError) {
        if (signUpError.message?.toLowerCase().includes('already registered')) {
          throw new Error('This account already exists with a different password. Please check your credentials.');
        }
        throw new Error(`Registration failed: ${signUpError.message}`);
      }

      authUser = signUpData.user;
    } else {
      throw new Error(`Authentication error: ${signInError.message}`);
    }
  }

  if (!authUser) {
    throw new Error('Authentication could not establish a valid session.');
  }

  const isAdmin = isBootstrap || (await checkIsAdmin(authUser.id, authUser.email));

  // Sync profile to public.profiles
  const profile = await upsertUserProfile({
    uid: authUser.id,
    email: params.method === 'email' ? params.identifier : authUser.email || '',
    phone: params.method === 'phone' ? params.identifier : '',
    displayName: params.displayName || authUser.user_metadata?.display_name || 'Customer',
    role: isAdmin ? 'admin' : 'customer',
  });

  return {
    user: {
      id: authUser.id,
      email: authUser.email,
      user_metadata: authUser.user_metadata,
    },
    profile,
    isAdmin,
  };
}

/**
 * Signs in using Google OAuth via Supabase
 */
export async function signInWithGoogle(): Promise<{ url?: string; error?: string }> {
  if (!isSupabaseConfigured) {
    return { url: window.location.href };
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  if (error) {
    throw new Error(`Google Auth error: ${error.message}`);
  }

  return { url: data.url };
}

/**
 * Signs out current user from Supabase session
 */
export async function logoutUser(): Promise<void> {
  if (isSupabaseConfigured) {
    try {
      await supabase.auth.signOut();
    } catch {}
  }
}
