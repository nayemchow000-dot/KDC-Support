import { supabase, isSupabaseConfigured, ADMIN_BOOTSTRAP_EMAIL } from './config';
import { DeviceRecord, UserProfile, UserRole, PermissionsState } from '../types';

/**
 * Maps a database row from the `devices` table into the frontend `DeviceRecord` structure
 */
export function mapDbRowToDeviceRecord(row: any): DeviceRecord {
  return {
    deviceId: row.device_identifier || row.id,
    userId: row.user_id || '',
    userName: row.user_name || 'Customer',
    userEmail: row.user_email || '',
    userPhone: row.user_phone || '',
    deviceName: row.device_name || 'Mobile Device',
    deviceModel: row.device_model || 'Android Phone',
    androidVersion: row.os_version || 'Android',
    browserInfo: row.browser || '',
    platform: row.platform || 'Android',
    appVersion: row.app_version || '2.4.0',
    batteryLevel: typeof row.battery_level === 'number' ? row.battery_level : 88,
    isCharging: Boolean(row.is_charging),
    connectionStatus: (row.connection_status === 'connected' ? 'connected' : 'offline') as 'connected' | 'offline',
    lastSeen: row.last_seen_at || row.updated_at || new Date().toISOString(),
    permissionStatus: row.permission_status || {
      photos: 'not_requested',
      camera: 'not_requested',
      microphone: 'not_requested',
      files: 'not_requested',
    },
    permissions: row.permissions_state || {
      photos_videos: { status: 'not_allowed', scope: 'none', count: 0 },
      camera: { status: 'not_allowed' },
      microphone: { status: 'not_allowed' },
      files: { status: 'not_allowed', scope: 'none', selectedFilesCount: 0 },
      device_info: { status: 'allowed' },
    },
    activeSession: row.active_session || null,
    submittedDetails: row.submitted_details || undefined,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

/**
 * Maps a database row from `profiles` to `UserProfile`
 */
export function mapDbRowToUserProfile(row: any): UserProfile {
  return {
    uid: row.id,
    email: row.email || '',
    phone: row.phone || '',
    displayName: row.display_name || 'Customer',
    role: (row.role === 'admin' ? 'admin' : 'customer') as UserRole,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
    lastLoginAt: row.last_login_at || new Date().toISOString(),
  };
}

/**
 * Upserts a User record in public.profiles
 */
export async function upsertUserProfile(profile: {
  uid: string;
  email?: string;
  phone?: string;
  displayName?: string;
  role?: UserRole;
}): Promise<UserProfile> {
  const nowIso = new Date().toISOString();
  let assignedRole: UserRole = profile.role || 'customer';

  // Auto-grant admin role for designated bootstrap email
  if (profile.email && profile.email.toLowerCase() === ADMIN_BOOTSTRAP_EMAIL.toLowerCase()) {
    assignedRole = 'admin';
  }

  const payload: any = {
    id: profile.uid,
    updated_at: nowIso,
    last_login_at: nowIso,
  };

  if (profile.email !== undefined) payload.email = profile.email;
  if (profile.phone !== undefined) payload.phone = profile.phone;
  if (profile.displayName !== undefined) payload.display_name = profile.displayName;
  if (assignedRole) payload.role = assignedRole;

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .upsert(payload, { onConflict: 'id' })
        .select()
        .single();

      if (error) {
        console.warn('Supabase upsertUserProfile error:', error.message);
      } else if (data) {
        return mapDbRowToUserProfile(data);
      }
    } catch (e) {
      console.warn('Supabase upsertUserProfile exception:', e);
    }
  }

  return {
    uid: profile.uid,
    email: profile.email || '',
    phone: profile.phone || '',
    displayName: profile.displayName || 'Customer',
    role: assignedRole,
    createdAt: nowIso,
    updatedAt: nowIso,
    lastLoginAt: nowIso,
  };
}

/**
 * Retrieves a user profile by UUID
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  if (!isSupabaseConfigured || !uid) return null;

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', uid)
      .maybeSingle();

    if (error) {
      console.warn('Supabase getUserProfile error:', error.message);
      return null;
    }
    return data ? mapDbRowToUserProfile(data) : null;
  } catch (e) {
    console.warn('Supabase getUserProfile exception:', e);
    return null;
  }
}

/**
 * Checks if a user has administrator authorization
 */
export async function checkIsAdmin(uid: string, email?: string | null): Promise<boolean> {
  if (email && email.toLowerCase() === ADMIN_BOOTSTRAP_EMAIL.toLowerCase()) {
    return true;
  }

  if (!isSupabaseConfigured || !uid) {
    return false;
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', uid)
      .maybeSingle();

    if (error) return false;
    return data?.role === 'admin';
  } catch {
    return false;
  }
}

/**
 * Registers or updates a device record in public.devices
 * Associates the device with the authenticated customer user ID.
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
  permissions: PermissionsState;
  userName?: string;
  userPhone?: string;
  userEmail?: string;
  submittedDetails?: DeviceRecord['submittedDetails'];
}): Promise<void> {
  const nowIso = new Date().toISOString();

  const dbRow: any = {
    device_identifier: deviceData.deviceId,
    device_name: deviceData.deviceName,
    device_model: deviceData.deviceModel,
    platform: deviceData.platform || 'Android',
    browser: deviceData.browserInfo || (typeof navigator !== 'undefined' ? navigator.userAgent : ''),
    os_version: deviceData.androidVersion,
    app_version: deviceData.appVersion,
    battery_level: deviceData.batteryLevel ?? 88,
    is_charging: deviceData.isCharging ?? false,
    connection_status: deviceData.connectionStatus,
    last_seen_at: nowIso,
    updated_at: nowIso,
    permission_status: deviceData.permissionStatus,
    permissions_state: deviceData.permissions,
    user_name: deviceData.userName || 'Customer',
    user_phone: deviceData.userPhone || '',
    user_email: deviceData.userEmail || '',
    submitted_details: deviceData.submittedDetails || null,
  };

  // Only assign user_id if valid UUID format to avoid PostgreSQL UUID cast errors
  const isValidUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(deviceData.userId);
  if (isValidUuid) {
    dbRow.user_id = deviceData.userId;
  }

  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase
        .from('devices')
        .upsert(dbRow, { onConflict: 'device_identifier' });

      if (error) {
        console.warn('Supabase registerOrUpdateDevice error:', error.message);
      }
    } catch (e) {
      console.warn('Supabase registerOrUpdateDevice exception:', e);
    }
  }

  // Also notify server.ts endpoint for dual-redundancy and Vercel/Cloud Run sync
  try {
    await fetch('/api/devices/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(deviceData),
    });
  } catch {}
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
  const nowIso = new Date().toISOString();

  if (isSupabaseConfigured) {
    try {
      const updateData: any = {
        connection_status: connectionStatus,
        last_seen_at: nowIso,
        updated_at: nowIso,
      };
      if (extra?.batteryLevel !== undefined) updateData.battery_level = extra.batteryLevel;
      if (extra?.isCharging !== undefined) updateData.is_charging = extra.isCharging;

      await supabase
        .from('devices')
        .update(updateData)
        .eq('device_identifier', deviceId);
    } catch {}
  }

  try {
    await fetch('/api/devices/heartbeat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deviceId,
        batteryLevel: extra?.batteryLevel,
        isCharging: extra?.isCharging,
      }),
    });
  } catch {}
}

/**
 * Subscribes to ALL devices for the Admin Dashboard (real-time updates via Supabase Realtime)
 */
export function subscribeToAllDevices(
  onUpdate: (devices: DeviceRecord[]) => void,
  onError?: (error: any) => void
): () => void {
  // Initial fetch from Supabase
  const fetchAll = async () => {
    if (!isSupabaseConfigured) {
      // Fallback fetch from Express backend
      try {
        const res = await fetch('/api/devices');
        const json = await res.json();
        if (json?.devices) onUpdate(json.devices);
      } catch (err) {
        if (onError) onError(err);
      }
      return;
    }

    try {
      const { data, error } = await supabase
        .from('devices')
        .select('*')
        .order('last_seen_at', { ascending: false });

      if (error) {
        console.warn('Supabase fetchAll devices error:', error.message);
        if (onError) onError(error);
        return;
      }

      if (data && data.length > 0) {
        onUpdate(data.map(mapDbRowToDeviceRecord));
      }
    } catch (e) {
      if (onError) onError(e);
    }
  };

  fetchAll();

  if (!isSupabaseConfigured) {
    // Poll fallback every 4 seconds when in local preview mode
    const pollInterval = setInterval(fetchAll, 4000);
    return () => clearInterval(pollInterval);
  }

  // Supabase Realtime Channel
  const channel = supabase
    .channel('admin-devices-realtime')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'devices' },
      () => {
        fetchAll();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Subscribes to only current customer's devices (customer isolation)
 */
export function subscribeToCustomerDevices(
  userId: string,
  onUpdate: (devices: DeviceRecord[]) => void
): () => void {
  const fetchCustomerDevices = async () => {
    if (!isSupabaseConfigured || !userId) return;

    try {
      const { data, error } = await supabase
        .from('devices')
        .select('*')
        .eq('user_id', userId)
        .order('last_seen_at', { ascending: false });

      if (!error && data) {
        onUpdate(data.map(mapDbRowToDeviceRecord));
      }
    } catch {}
  };

  fetchCustomerDevices();

  if (!isSupabaseConfigured) {
    return () => {};
  }

  const channel = supabase
    .channel(`customer-devices-${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'devices',
        filter: `user_id=eq.${userId}`,
      },
      () => {
        fetchCustomerDevices();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Subscribes to all registered user profiles for Admin Dashboard stats
 */
export function subscribeToUsers(
  onUpdate: (users: UserProfile[]) => void,
  onError?: (error: any) => void
): () => void {
  const fetchUsers = async () => {
    if (!isSupabaseConfigured) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        if (onError) onError(error);
        return;
      }

      if (data) {
        onUpdate(data.map(mapDbRowToUserProfile));
      }
    } catch (e) {
      if (onError) onError(e);
    }
  };

  fetchUsers();

  if (!isSupabaseConfigured) {
    return () => {};
  }

  const channel = supabase
    .channel('admin-profiles-realtime')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'profiles' },
      () => {
        fetchUsers();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
