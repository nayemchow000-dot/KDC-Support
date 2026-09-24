import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  User,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { auth } from './config';
import { upsertUserProfile, checkIsAdmin, bootstrapAdminDoc } from './firestoreService';
import { UserProfile, UserRole } from '../types';

/**
 * Formats a phone number or email into a Firebase Auth compatible email identifier
 */
export function formatAuthEmail(identifier: string, method: 'email' | 'phone'): string {
  if (method === 'email') {
    return identifier.trim().toLowerCase();
  }
  const digitsOnly = identifier.replace(/[^0-9]/g, '');
  return `phone_${digitsOnly || 'user'}@kdcsupport.local`;
}

/**
 * Authenticates or registers a user with email/phone and password
 */
export async function authenticateCustomer(params: {
  identifier: string;
  password: string;
  method: 'email' | 'phone';
  displayName?: string;
}): Promise<{ user: User; profile: UserProfile; isAdmin: boolean }> {
  const email = formatAuthEmail(params.identifier, params.method);
  const password = params.password.length >= 6 ? params.password : `${params.password}123456`.slice(0, 8);

  let userCredential;

  try {
    // Attempt sign in
    userCredential = await signInWithEmailAndPassword(auth, email, password);
  } catch (err: any) {
    // If user not found, automatically register as requested by the prompt
    if (
      err.code === 'auth/user-not-found' ||
      err.code === 'auth/invalid-credential' ||
      err.code === 'auth/invalid-login-credentials'
    ) {
      try {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
      } catch (createErr: any) {
        // If already exists under this email with different credential
        if (createErr.code === 'auth/email-already-in-use') {
          throw new Error('This account already exists with a different password. Please check your credentials.');
        }
        throw createErr;
      }
    } else {
      throw err;
    }
  }

  const user = userCredential.user;

  // Update display name if provided
  if (params.displayName && user.displayName !== params.displayName) {
    try {
      await updateProfile(user, { displayName: params.displayName });
    } catch {}
  }

  // Check admin status
  const isAdmin = await checkIsAdmin(user.uid, user.email);

  // Sync profile to Firestore users/{uid}
  const profile = await upsertUserProfile({
    uid: user.uid,
    email: params.method === 'email' ? params.identifier : user.email || '',
    phone: params.method === 'phone' ? params.identifier : '',
    displayName: params.displayName || user.displayName || (params.method === 'email' ? params.identifier.split('@')[0] : 'Customer'),
    role: isAdmin ? 'admin' : 'customer',
  });

  return { user, profile, isAdmin };
}

/**
 * Signs in as Admin with Google popup
 */
export async function signInWithGoogle(): Promise<{ user: User; isAdmin: boolean }> {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  const user = result.user;

  const isAdmin = await checkIsAdmin(user.uid, user.email);

  await upsertUserProfile({
    uid: user.uid,
    email: user.email || '',
    displayName: user.displayName || 'Admin',
    role: isAdmin ? 'admin' : 'customer',
  });

  return { user, isAdmin };
}

/**
 * Signs out current user
 */
export async function logoutUser(): Promise<void> {
  await signOut(auth);
}
