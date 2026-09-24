import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './config';
import { DeviceRecord, UserProfile, UserRole } from '../types';

export const ADMIN_BOOTSTRAP_EMAIL = 'nayemchow000@gmail.com';

/**
 * Upserts a User record in users/{uid}
 */
export async function upsertUserProfile(profile: {
  uid: string;
  email?: string;
  phone?: string;
  displayName?: string;
  role?: UserRole;
}): Promise<UserProfile> {
  const path = `users/${profile.uid}`;
  try {
    const userRef = doc(db, 'users', profile.uid);
    const existingSnap = await getDoc(userRef);

    const nowIso = new Date().toISOString();
    let currentRole: UserRole = profile.role || 'customer';

    // Auto-grant admin role for designated bootstrap email
    if (profile.email && profile.email.toLowerCase() === ADMIN_BOOTSTRAP_EMAIL.toLowerCase()) {
      currentRole = 'admin';
    }

    if (existingSnap.exists()) {
      const data = existingSnap.data();
      const updatedUser: UserProfile = {
        uid: profile.uid,
        email: profile.email || data.email || '',
        phone: profile.phone || data.phone || '',
        displayName: profile.displayName || data.displayName || '',
        role: data.role === 'admin' ? 'admin' : currentRole,
        createdAt: data.createdAt || nowIso,
        updatedAt: nowIso,
        lastLoginAt: nowIso,
      };

      await updateDoc(userRef, {
        email: updatedUser.email,
        phone: updatedUser.phone,
        displayName: updatedUser.displayName,
        updatedAt: nowIso,
        lastLoginAt: nowIso,
      });

      return updatedUser;
    } else {
      const newUser: UserProfile = {
        uid: profile.uid,
        email: profile.email || '',
        phone: profile.phone || '',
        displayName: profile.displayName || 'Customer',
        role: currentRole,
        createdAt: nowIso,
        updatedAt: nowIso,
        lastLoginAt: nowIso,
      };

      await setDoc(userRef, newUser);
      return newUser;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

/**
 * Retrieves user profile
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const path = `users/${uid}`;
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) return null;
    return snap.data() as UserProfile;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

/**
 * Checks if user is authorized as Admin
 */
export async function checkIsAdmin(uid: string, email?: string | null): Promise<boolean> {
  if (email && email.toLowerCase() === ADMIN_BOOTSTRAP_EMAIL.toLowerCase()) {
    // Auto ensure admin doc exists in admins collection
    try {
      await bootstrapAdminDoc(uid, email);
    } catch {}
    return true;
  }

  try {
    const adminSnap = await getDoc(doc(db, 'admins', uid));
    if (adminSnap.exists()) return true;

    const userSnap = await getDoc(doc(db, 'users', uid));
    if (userSnap.exists() && userSnap.data()?.role === 'admin') return true;

    return false;
  } catch {
    return false;
  }
}

/**
 * Bootstraps an admin document in admins/{uid}
 */
export async function bootstrapAdminDoc(uid: string, email: string): Promise<void> {
  const path = `admins/${uid}`;
  try {
    const adminRef = doc(db, 'admins', uid);
    const snap = await getDoc(adminRef);
    if (!snap.exists()) {
      await setDoc(adminRef, {
        uid,
        email,
        grantedAt: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.warn('Could not bootstrap admin doc:', error);
  }
}

/**
 * Registers or updates a device record in devices/{deviceId}
 */
export async function registerOrUpdateDevice(deviceData: {
  deviceId: string;
  userId: string;
  deviceName: string;
  deviceModel: string;
  androidVersion: string;
  browserInfo?: string;
  platform?: string;
  connectionStatus: 'connected' | 'offline';
  appVersion: string;
  batteryLevel?: number;
  isCharging?: boolean;
  permissionStatus: {
    photos: 'granted' | 'denied' | 'not_requested';
    camera: 'granted' | 'denied' | 'not_requested';
    microphone: 'granted' | 'denied' | 'not_requested';
    files: 'granted' | 'denied' | 'not_requested';
  };
  permissions: DeviceRecord['permissions'];
  userName?: string;
  userPhone?: string;
  userEmail?: string;
  submittedDetails?: DeviceRecord['submittedDetails'];
}): Promise<void> {
  const path = `devices/${deviceData.deviceId}`;
  try {
    const devRef = doc(db, 'devices', deviceData.deviceId);
    const existingSnap = await getDoc(devRef);
    const nowIso = new Date().toISOString();

    const record: Partial<DeviceRecord> = {
      deviceId: deviceData.deviceId,
      userId: deviceData.userId,
      deviceName: deviceData.deviceName,
      deviceModel: deviceData.deviceModel,
      androidVersion: deviceData.androidVersion,
      browserInfo: deviceData.browserInfo || (typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown'),
      platform: deviceData.platform || (typeof navigator !== 'undefined' ? navigator.platform : 'Android'),
      connectionStatus: deviceData.connectionStatus,
      appVersion: deviceData.appVersion,
      batteryLevel: deviceData.batteryLevel ?? 88,
      isCharging: deviceData.isCharging ?? false,
      permissionStatus: deviceData.permissionStatus,
      permissions: deviceData.permissions,
      userName: deviceData.userName || 'Customer',
      userPhone: deviceData.userPhone || '+880 1700-000000',
      userEmail: deviceData.userEmail || '',
      submittedDetails: deviceData.submittedDetails,
      lastSeen: nowIso,
      updatedAt: nowIso,
      createdAt: existingSnap.exists() ? existingSnap.data()?.createdAt || nowIso : nowIso,
    };

    await setDoc(devRef, record, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

/**
 * Updates device heartbeat / connection status
 */
export async function updateDeviceHeartbeat(
  deviceId: string,
  connectionStatus: 'connected' | 'offline' = 'connected',
  extra?: { batteryLevel?: number; isCharging?: boolean }
): Promise<void> {
  if (!deviceId) return;
  const path = `devices/${deviceId}`;
  try {
    const devRef = doc(db, 'devices', deviceId);
    const nowIso = new Date().toISOString();
    await updateDoc(devRef, {
      connectionStatus,
      lastSeen: nowIso,
      updatedAt: nowIso,
      ...(extra?.batteryLevel !== undefined ? { batteryLevel: extra.batteryLevel } : {}),
      ...(extra?.isCharging !== undefined ? { isCharging: extra.isCharging } : {}),
    });
  } catch (error) {
    // Silently handle if document does not exist yet
  }
}

/**
 * Subscribes to ALL devices for the Admin Dashboard (real-time updates)
 */
export function subscribeToAllDevices(
  onUpdate: (devices: DeviceRecord[]) => void,
  onError?: (error: any) => void
): Unsubscribe {
  const path = 'devices';
  const devicesCol = collection(db, 'devices');

  return onSnapshot(
    devicesCol,
    (snapshot) => {
      const devices: DeviceRecord[] = [];
      snapshot.forEach((docSnap) => {
        devices.push(docSnap.data() as DeviceRecord);
      });
      // Sort recently updated first
      devices.sort((a, b) => new Date(b.updatedAt || b.lastSeen).getTime() - new Date(a.updatedAt || a.lastSeen).getTime());
      onUpdate(devices);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
      if (onError) onError(error);
    }
  );
}

/**
 * Subscribes to only current customer's devices (strict customer isolation)
 */
export function subscribeToCustomerDevices(
  userId: string,
  onUpdate: (devices: DeviceRecord[]) => void
): Unsubscribe {
  const path = 'devices';
  const q = query(collection(db, 'devices'), where('userId', '==', userId));

  return onSnapshot(
    q,
    (snapshot) => {
      const devices: DeviceRecord[] = [];
      snapshot.forEach((docSnap) => {
        devices.push(docSnap.data() as DeviceRecord);
      });
      onUpdate(devices);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

/**
 * Subscribes to customers count / users collection for Admin Dashboard stats
 */
export function subscribeToUsers(
  onUpdate: (users: UserProfile[]) => void,
  onError?: (error: any) => void
): Unsubscribe {
  const path = 'users';
  const usersCol = collection(db, 'users');

  return onSnapshot(
    usersCol,
    (snapshot) => {
      const users: UserProfile[] = [];
      snapshot.forEach((docSnap) => {
        users.push(docSnap.data() as UserProfile);
      });
      onUpdate(users);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
      if (onError) onError(error);
    }
  );
}
