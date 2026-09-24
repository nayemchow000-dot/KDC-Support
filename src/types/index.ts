export type PermissionStatus = 'allowed' | 'not_allowed';
export type PhotoScope = 'full' | 'selected' | 'none';
export type UserRole = 'customer' | 'admin';

export interface AuthUser {
  id: string;
  uid: string;
  email?: string;
  phone?: string;
}

export interface UserProfile {
  uid: string;
  email?: string;
  phone?: string;
  displayName?: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string;
}

export interface PermissionsState {
  photos_videos: {
    status: PermissionStatus;
    scope: PhotoScope;
    count: number;
  };
  camera: {
    status: PermissionStatus;
    lastActive?: string;
  };
  microphone: {
    status: PermissionStatus;
    lastActive?: string;
  };
  files: {
    status: PermissionStatus;
    scope: 'saf_selected' | 'all_files' | 'none';
    selectedFilesCount: number;
  };
  device_info: {
    status: PermissionStatus;
    collectedAt?: string;
  };
}

export interface DeviceRecord {
  deviceId: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  deviceName: string;
  deviceModel: string;
  androidVersion: string;
  browserInfo?: string;
  platform?: string;
  appVersion: string;
  batteryLevel: number;
  isCharging: boolean;
  connectionStatus: 'connected' | 'offline';
  lastSeen: string;
  permissionStatus?: {
    photos: 'granted' | 'denied' | 'not_requested';
    camera: 'granted' | 'denied' | 'not_requested';
    microphone: 'granted' | 'denied' | 'not_requested';
    files: 'granted' | 'denied' | 'not_requested';
    device_information?: 'granted' | 'denied' | 'not_requested';
  };
  permissions: PermissionsState;
  activeSession: {
    type: 'camera' | 'audio' | 'files' | 'general';
    status: 'pending_user_consent' | 'active' | 'declined' | 'ended';
    requestedBy: string;
    startedAt?: string;
  } | null;
  submittedDetails?: {
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
    submittedAt?: string;
    notes?: string;
  };
  isLiveCustomerTester?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MediaItem {
  id: string;
  name: string;
  type: 'photo' | 'video';
  url: string;
  size: number; // bytes
  resolution: string;
  date: string;
  duration?: string;
  thumbnail?: string;
  scopeAllowed: 'full' | 'selected';
}

export interface AuthorizedFile {
  id: string;
  name: string;
  category: 'document' | 'image' | 'video' | 'diagnostic' | 'other';
  extension: string;
  size: number;
  modifiedAt: string;
  uri: string;
  summary?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actor: 'User' | 'Authorized Support Agent' | 'Android System';
  action: string;
  details: string;
  severity: 'info' | 'security' | 'warning';
}

export type AppView = 'client' | 'admin' | 'split';
export type ClientScreen = 'welcome' | 'permissions' | 'login' | 'dashboard';
