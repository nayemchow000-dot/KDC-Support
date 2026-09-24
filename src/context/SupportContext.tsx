import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase, isSupabaseConfigured, ADMIN_BOOTSTRAP_EMAIL } from '../supabase/config';
import { authenticateCustomer, logoutUser, signInWithGoogle } from '../supabase/authService';
import {
  registerOrUpdateDevice,
  updateDeviceHeartbeat,
  subscribeToAllDevices,
  subscribeToCustomerDevices,
  subscribeToUsers,
  checkIsAdmin,
  upsertUserProfile,
  getUserProfile,
} from '../supabase/databaseService';
import {
  AppView,
  ClientScreen,
  DeviceRecord,
  PermissionsState,
  MediaItem,
  AuthorizedFile,
  AuditLog,
  UserProfile,
  AuthUser,
} from '../types';
import { INITIAL_DEVICES, INITIAL_FILES, INITIAL_MEDIA_ITEMS, INITIAL_AUDIT_LOGS } from '../data/mockData';
import { detectCurrentDevice, getOrCreateDeviceId } from '../utils/deviceDetection';

export function computePermissionStatus(perms: PermissionsState): {
  photos: 'granted' | 'denied' | 'not_requested';
  camera: 'granted' | 'denied' | 'not_requested';
  microphone: 'granted' | 'denied' | 'not_requested';
  files: 'granted' | 'denied' | 'not_requested';
  device_information?: 'granted' | 'denied' | 'not_requested';
} {
  return {
    photos: perms.photos_videos?.status === 'allowed' ? 'granted' : 'denied',
    camera: perms.camera?.status === 'allowed' ? 'granted' : 'denied',
    microphone: perms.microphone?.status === 'allowed' ? 'granted' : 'denied',
    files: perms.files?.status === 'allowed' ? 'granted' : 'denied',
    device_information: perms.device_info?.status === 'allowed' ? 'granted' : 'not_requested',
  };
}

interface SupportContextType {
  // Navigation & View
  currentView: AppView;
  setCurrentView: (view: AppView) => void;
  clientScreen: ClientScreen;
  setClientScreen: (screen: ClientScreen) => void;
  isPhoneFrame: boolean;
  setIsPhoneFrame: (val: boolean) => void;

  // Active Client State
  device: DeviceRecord;
  mediaItems: MediaItem[];
  files: AuthorizedFile[];
  auditLogs: AuditLog[];
  isAuthenticated: boolean;
  userAuthInfo: { email?: string; phone?: string; method: 'email' | 'phone' } | null;
  authUser: AuthUser | null;
  firebaseUser: AuthUser | null; // Aliased for seamless component compatibility
  userProfile: UserProfile | null;
  isAdminUser: boolean;

  // Real-time Support Session
  activeSession: {
    type: 'camera' | 'audio' | 'files';
    startedAt: string;
    initiatedBy: 'user' | 'admin';
  } | null;
  pendingConsentRequest: {
    type: 'camera' | 'audio' | 'files';
    requestedBy: string;
    timestamp: string;
  } | null;

  // Permission Management Modal
  isManagePermissionsOpen: boolean;
  setIsManagePermissionsOpen: (open: boolean) => void;

  // Actions
  updatePermission: (
    key: keyof PermissionsState,
    status: 'allowed' | 'not_allowed',
    extra?: Record<string, any>
  ) => void;
  requestPermissionFromOS: (key: keyof PermissionsState, extra?: Record<string, any>) => Promise<boolean>;
  login: (identifier: string, pass: string, method: 'email' | 'phone', remember: boolean) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  loginAdmin: (email: string, pass: string) => Promise<boolean>;
  loginAdminWithGoogle: () => Promise<boolean>;
  logout: () => Promise<void>;
  toggleDeviceConnection: () => void;

  // Media & Files
  addMediaItem: (item: MediaItem) => void;
  addFileItem: (file: AuthorizedFile) => void;
  removeMediaItem: (id: string) => void;
  removeFileItem: (id: string) => void;

  // Remote Sessions
  startCameraSession: (initiatedBy?: 'user' | 'admin') => Promise<boolean>;
  startAudioSession: (initiatedBy?: 'user' | 'admin') => Promise<boolean>;
  endSession: () => void;
  adminRequestRemoteAccess: (deviceId: string, type: 'camera' | 'audio' | 'files') => void;
  respondToConsentRequest: (accept: boolean) => void;

  // Admin Fleet View
  allDevices: DeviceRecord[];
  allUsers: UserProfile[];
  selectedAdminDevice: DeviceRecord;
  setSelectedAdminDeviceId: (id: string) => void;

  // Live Multi-device Cloud Sync State
  isCloudSynced: boolean;
  activeMobileDevice: DeviceRecord | null;
  currentLocalDeviceId: string;

  // Customer Testing Flow
  customerDetails: {
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    customerNotes?: string;
  };
  submitCustomerDetails: (details: {
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    customerNotes?: string;
  }) => Promise<void>;
  isQrModalOpen: boolean;
  setIsQrModalOpen: (open: boolean) => void;

  // Helpers
  addAuditLog: (actor: AuditLog['actor'], action: string, details: string, severity?: AuditLog['severity']) => void;
  resetAll: () => void;
}

const SupportContext = createContext<SupportContextType | undefined>(undefined);

const STORAGE_KEY = 'kdc_support_state_v4';

export const SupportProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const currentDeviceInfo = useRef(detectCurrentDevice());
  const currentLocalDeviceId = currentDeviceInfo.current.deviceId;

  // URL / Role detection
  const [currentView, setCurrentView] = useState<AppView>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const roleParam = urlParams.get('role') || urlParams.get('view');
      const isPathAdmin = window.location.pathname.startsWith('/admin');
      if (roleParam === 'customer' || roleParam === 'client') return 'client';
      if (roleParam === 'admin' || isPathAdmin) return 'admin';
      if (roleParam === 'split') return 'split';
      const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || window.innerWidth < 768;
      if (isMobile) return 'client';
      return 'admin';
    }
    return 'admin';
  });

  const [clientScreen, setClientScreen] = useState<ClientScreen>('welcome');
  const [isPhoneFrame, setIsPhoneFrame] = useState<boolean>(() => !currentDeviceInfo.current.isMobile);
  const [isCloudSynced, setIsCloudSynced] = useState<boolean>(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState<boolean>(false);

  // Supabase Auth & Roles
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAdminUser, setIsAdminUser] = useState<boolean>(false);

  const [customerDetails, setCustomerDetails] = useState<{
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    customerNotes?: string;
  }>(() => {
    const saved = localStorage.getItem(STORAGE_KEY + '_cust_details');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      customerName: 'Nayem Chowdhury',
      customerPhone: '+880 1712-345678',
      customerEmail: 'nayemchow000@gmail.com',
      customerNotes: 'Live customer testing via mobile link',
    };
  });

  // Fleet state
  const [allDevices, setAllDevices] = useState<DeviceRecord[]>(() => {
    const initialLocalDevice: DeviceRecord = {
      deviceId: currentLocalDeviceId,
      userId: 'usr-client-01',
      userName: 'Nayem Chowdhury',
      userEmail: 'nayemchow000@gmail.com',
      userPhone: '+880 1712-345678',
      deviceName: currentDeviceInfo.current.deviceName,
      deviceModel: currentDeviceInfo.current.deviceModel,
      androidVersion: currentDeviceInfo.current.androidVersion,
      browserInfo: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      platform: typeof navigator !== 'undefined' ? navigator.platform : 'Android',
      appVersion: '2.4.0',
      batteryLevel: 92,
      isCharging: false,
      connectionStatus: 'connected',
      lastSeen: new Date().toISOString(),
      permissions: {
        photos_videos: { status: 'not_allowed', scope: 'none', count: 0 },
        camera: { status: 'not_allowed' },
        microphone: { status: 'not_allowed' },
        files: { status: 'not_allowed', scope: 'none', selectedFilesCount: 0 },
        device_info: { status: 'allowed', collectedAt: new Date().toISOString().substring(0, 16) },
      },
      permissionStatus: {
        photos: 'not_requested',
        camera: 'not_requested',
        microphone: 'not_requested',
        files: 'not_requested',
        device_information: 'granted',
      },
      activeSession: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return [initialLocalDevice, ...INITIAL_DEVICES.filter((d) => d.deviceId !== currentLocalDeviceId)];
  });

  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [selectedAdminDeviceId, setSelectedAdminDeviceId] = useState<string>(
    () => allDevices[0]?.deviceId || currentLocalDeviceId
  );

  const [mediaItems, setMediaItems] = useState<MediaItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY + '_media');
    return saved ? JSON.parse(saved) : INITIAL_MEDIA_ITEMS;
  });

  const [files, setFiles] = useState<AuthorizedFile[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY + '_files');
    return saved ? JSON.parse(saved) : INITIAL_FILES;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY + '_logs');
    return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_KEY + '_auth') === 'true';
  });

  const [userAuthInfo, setUserAuthInfo] = useState<{ email?: string; phone?: string; method: 'email' | 'phone' } | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEY + '_user_auth');
    return saved ? JSON.parse(saved) : { phone: '+880 1712-345678', method: 'phone' };
  });

  const [activeSession, setActiveSession] = useState<{
    type: 'camera' | 'audio' | 'files';
    startedAt: string;
    initiatedBy: 'user' | 'admin';
  } | null>(null);

  const [pendingConsentRequest, setPendingConsentRequest] = useState<{
    type: 'camera' | 'audio' | 'files';
    requestedBy: string;
    timestamp: string;
  } | null>(null);

  const [isManagePermissionsOpen, setIsManagePermissionsOpen] = useState(false);

  // Selected client device
  const currentClientDevice =
    allDevices.find((d) => d.deviceId === currentLocalDeviceId) || allDevices[0];

  // Persist customer details
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY + '_cust_details', JSON.stringify(customerDetails));
  }, [customerDetails]);

  // Persist media, files, logs
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY + '_media', JSON.stringify(mediaItems));
  }, [mediaItems]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY + '_files', JSON.stringify(files));
  }, [files]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY + '_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY + '_auth', isAuthenticated ? 'true' : 'false');
    if (userAuthInfo) {
      localStorage.setItem(STORAGE_KEY + '_user_auth', JSON.stringify(userAuthInfo));
    }
  }, [isAuthenticated, userAuthInfo]);

  // Battery detection
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
      (navigator as any).getBattery?.().then((battery: any) => {
        const updateBattery = () => {
          const level = Math.round(battery.level * 100);
          const isChg = battery.charging;
          setAllDevices((prev) =>
            prev.map((d) =>
              d.deviceId === currentLocalDeviceId
                ? { ...d, batteryLevel: level, isCharging: isChg }
                : d
            )
          );
        };
        updateBattery();
        battery.addEventListener('levelchange', updateBattery);
        battery.addEventListener('chargingchange', updateBattery);
      }).catch(() => {});
    }
  }, [currentLocalDeviceId]);

  // Monitor Supabase Auth changes
  useEffect(() => {
    if (!isSupabaseConfigured) {
      // In local fallback mode without Supabase env vars, keep existing local session
      return;
    }

    // 1. Initial session check
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const u = session?.user;
      if (u) {
        const authUserObj: AuthUser = { id: u.id, uid: u.id, email: u.email || '', phone: u.phone };
        setAuthUser(authUserObj);
        setIsAuthenticated(true);

        const isBootstrap = u.email?.toLowerCase() === ADMIN_BOOTSTRAP_EMAIL.toLowerCase();
        const adminCheck = isBootstrap || (await checkIsAdmin(u.id, u.email));
        setIsAdminUser(adminCheck);

        try {
          const prof = await getUserProfile(u.id);
          if (prof) {
            setUserProfile(prof);
          } else {
            const newProf = await upsertUserProfile({
              uid: u.id,
              email: u.email || '',
              displayName: customerDetails.customerName,
              phone: customerDetails.customerPhone,
              role: adminCheck ? 'admin' : 'customer',
            });
            setUserProfile(newProf);
          }
        } catch (e) {}
      }
    });

    // 2. Auth State Change Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const u = session?.user;
      if (u) {
        const authUserObj: AuthUser = { id: u.id, uid: u.id, email: u.email || '', phone: u.phone };
        setAuthUser(authUserObj);
        setIsAuthenticated(true);

        const isBootstrap = u.email?.toLowerCase() === ADMIN_BOOTSTRAP_EMAIL.toLowerCase();
        const adminCheck = isBootstrap || (await checkIsAdmin(u.id, u.email));
        setIsAdminUser(adminCheck);

        try {
          const prof = await getUserProfile(u.id);
          if (prof) {
            setUserProfile(prof);
          } else {
            const newProf = await upsertUserProfile({
              uid: u.id,
              email: u.email || '',
              displayName: customerDetails.customerName,
              phone: customerDetails.customerPhone,
              role: adminCheck ? 'admin' : 'customer',
            });
            setUserProfile(newProf);
          }
        } catch (e) {}
      } else {
        setAuthUser(null);
        setIsAdminUser(false);
        setIsAuthenticated(false);
        setUserProfile(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [customerDetails.customerName, customerDetails.customerPhone]);

  // Real-time Supabase Database Subscriptions
  useEffect(() => {
    let unsubDevices: (() => void) | null = null;
    let unsubUsers: (() => void) | null = null;

    if (isAdminUser) {
      // Authenticated Admin reads ALL devices and users in real time from Supabase
      unsubDevices = subscribeToAllDevices(
        (devices) => {
          if (devices.length > 0) {
            setIsCloudSynced(true);
            setAllDevices(devices);
          }
        },
        (err) => {
          console.warn('Real-time devices listener notice:', err);
        }
      );

      unsubUsers = subscribeToUsers((users) => {
        setAllUsers(users);
      });
    } else if (authUser && currentView === 'client') {
      // Authenticated Customer: strictly isolated query for ONLY their own device
      unsubDevices = subscribeToCustomerDevices(authUser.id, (devices) => {
        if (devices.length > 0) {
          setIsCloudSynced(true);
          setAllDevices((prev) => {
            const otherDevices = prev.filter((d) => d.userId !== authUser.id);
            return [...devices, ...otherDevices];
          });
        }
      });
    }

    return () => {
      if (unsubDevices) unsubDevices();
      if (unsubUsers) unsubUsers();
    };
  }, [isAdminUser, authUser, currentView]);

  // Active Device Heartbeat to Supabase PostgreSQL
  useEffect(() => {
    const dev = currentClientDevice;
    if (dev.connectionStatus !== 'connected') return;

    const ping = () => {
      updateDeviceHeartbeat(currentLocalDeviceId, 'connected', {
        batteryLevel: dev.batteryLevel,
        isCharging: dev.isCharging,
      });
    };

    // Immediate ping + every 20 seconds
    ping();
    const interval = setInterval(ping, 20000);

    // Visibility handlers to ensure offline status when closed or hidden
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        updateDeviceHeartbeat(currentLocalDeviceId, 'offline');
      } else if (document.visibilityState === 'visible') {
        updateDeviceHeartbeat(currentLocalDeviceId, 'connected');
      }
    };

    const handleBeforeUnload = () => {
      updateDeviceHeartbeat(currentLocalDeviceId, 'offline');
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handleBeforeUnload);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handleBeforeUnload);
    };
  }, [currentLocalDeviceId, currentClientDevice.connectionStatus, currentClientDevice.batteryLevel, currentClientDevice.isCharging]);

  // Synchronize local device to Supabase
  const syncLocalDeviceToSupabase = useCallback(
    async (overridePerms?: PermissionsState) => {
      try {
        const permsToUse = overridePerms || currentClientDevice.permissions;
        const uid = authUser?.id || authUser?.uid || 'anon_' + currentLocalDeviceId.replace(/[^a-zA-Z0-9]/g, '');

        await registerOrUpdateDevice({
          deviceId: currentLocalDeviceId,
          userId: uid,
          deviceName: currentDeviceInfo.current.deviceName,
          deviceModel: currentDeviceInfo.current.deviceModel,
          androidVersion: currentDeviceInfo.current.androidVersion,
          browserInfo: typeof navigator !== 'undefined' ? navigator.userAgent : '',
          platform: typeof navigator !== 'undefined' ? navigator.platform : 'Android',
          connectionStatus: currentClientDevice.connectionStatus,
          appVersion: '2.4.0',
          batteryLevel: currentClientDevice.batteryLevel,
          isCharging: currentClientDevice.isCharging,
          permissionStatus: computePermissionStatus(permsToUse),
          permissions: permsToUse,
          userName: customerDetails.customerName || currentClientDevice.userName,
          userPhone: customerDetails.customerPhone || currentClientDevice.userPhone,
          userEmail: customerDetails.customerEmail || currentClientDevice.userEmail,
          submittedDetails: {
            customerName: customerDetails.customerName,
            customerPhone: customerDetails.customerPhone,
            customerEmail: customerDetails.customerEmail,
            notes: customerDetails.customerNotes,
            submittedAt: new Date().toISOString(),
          },
        });
        setIsCloudSynced(true);
      } catch (err) {
        console.warn('Sync to Supabase notice:', err);
      }
    },
    [currentClientDevice, currentLocalDeviceId, customerDetails, authUser]
  );

  const addAuditLog = useCallback(
    (actor: AuditLog['actor'], action: string, details: string, severity: AuditLog['severity'] = 'info') => {
      const newLog: AuditLog = {
        id: 'log-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        actor,
        action,
        details,
        severity,
      };
      setAuditLogs((prev) => [newLog, ...prev]);
    },
    []
  );

  const updatePermission = useCallback(
    (key: keyof PermissionsState, status: 'allowed' | 'not_allowed', extra?: Record<string, any>) => {
      setAllDevices((prev) =>
        prev.map((d) => {
          if (d.deviceId !== currentLocalDeviceId) return d;
          const current = d.permissions[key];
          let updatedPerm: any = {
            ...current,
            status,
            ...(extra || {}),
          };

          if (key === 'photos_videos') {
            updatedPerm = {
              status,
              scope: extra?.scope || (status === 'allowed' ? 'full' : 'none'),
              count: status === 'allowed' ? mediaItems.length : 0,
            };
          } else if (key === 'files') {
            updatedPerm = {
              status,
              scope: status === 'allowed' ? extra?.scope || 'saf_selected' : 'none',
              selectedFilesCount: status === 'allowed' ? files.length : 0,
            };
          } else if (key === 'camera' && status === 'allowed') {
            updatedPerm.lastActive = new Date().toISOString().replace('T', ' ').substring(0, 16);
          } else if (key === 'microphone' && status === 'allowed') {
            updatedPerm.lastActive = new Date().toISOString().replace('T', ' ').substring(0, 16);
          }

          const newPermissions = {
            ...d.permissions,
            [key]: updatedPerm,
          };

          const newPermStatus = computePermissionStatus(newPermissions);

          // Push update immediately to Supabase
          syncLocalDeviceToSupabase(newPermissions);

          return {
            ...d,
            permissions: newPermissions,
            permissionStatus: newPermStatus,
            updatedAt: new Date().toISOString(),
          };
        })
      );

      const labelMap: Record<string, string> = {
        photos_videos: 'Photos & Videos Access',
        camera: 'Live Diagnostic Camera',
        microphone: 'Technician Voice Channel',
        files: 'SAF File Access',
        device_info: 'Hardware & OS Metrics',
      };

      addAuditLog(
        'User',
        `Permission ${status === 'allowed' ? 'Granted' : 'Revoked'}`,
        `${labelMap[key] || key} set to ${status === 'allowed' ? 'Allowed' : 'Not Allowed'}${extra?.scope ? ` (${extra.scope})` : ''}`,
        status === 'allowed' ? 'info' : 'warning'
      );
    },
    [mediaItems.length, files.length, addAuditLog, currentLocalDeviceId, syncLocalDeviceToSupabase]
  );

  const requestPermissionFromOS = useCallback(
    async (key: keyof PermissionsState, extra?: Record<string, any>): Promise<boolean> => {
      try {
        if (key === 'camera') {
          if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            try {
              const stream = await navigator.mediaDevices.getUserMedia({ video: true });
              stream.getTracks().forEach((track) => track.stop());
              updatePermission('camera', 'allowed');
              return true;
            } catch (err: any) {
              console.warn('Camera permission denied or unavailable:', err);
              updatePermission('camera', 'not_allowed');
              return false;
            }
          } else {
            updatePermission('camera', 'allowed');
            return true;
          }
        }

        if (key === 'microphone') {
          if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            try {
              const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
              stream.getTracks().forEach((track) => track.stop());
              updatePermission('microphone', 'allowed');
              return true;
            } catch (err: any) {
              console.warn('Microphone permission denied or unavailable:', err);
              updatePermission('microphone', 'not_allowed');
              return false;
            }
          } else {
            updatePermission('microphone', 'allowed');
            return true;
          }
        }

        if (key === 'photos_videos') {
          const scope = extra?.scope || 'full';
          updatePermission('photos_videos', 'allowed', { scope });
          return true;
        }

        if (key === 'files') {
          updatePermission('files', 'allowed', { scope: extra?.scope || 'saf_selected' });
          return true;
        }

        if (key === 'device_info') {
          updatePermission('device_info', 'allowed', { collectedAt: new Date().toISOString() });
          return true;
        }

        return true;
      } catch (err) {
        return false;
      }
    },
    [updatePermission]
  );

  const submitCustomerDetails = useCallback(
    async (details: {
      customerName: string;
      customerPhone: string;
      customerEmail?: string;
      customerNotes?: string;
    }) => {
      setCustomerDetails((prev) => ({ ...prev, ...details }));
      setUserAuthInfo({
        email: details.customerEmail || currentClientDevice.userEmail,
        phone: details.customerPhone || currentClientDevice.userPhone,
        method: 'phone',
      });

      setAllDevices((prev) =>
        prev.map((d) =>
          d.deviceId === currentLocalDeviceId
            ? {
                ...d,
                userName: details.customerName,
                userPhone: details.customerPhone,
                userEmail: details.customerEmail || d.userEmail,
                submittedDetails: {
                  customerName: details.customerName,
                  customerPhone: details.customerPhone,
                  customerEmail: details.customerEmail,
                  notes: details.customerNotes,
                  submittedAt: new Date().toISOString(),
                },
                updatedAt: new Date().toISOString(),
              }
            : d
        )
      );

      // Register or update device in Supabase
      try {
        const uid = authUser?.id || authUser?.uid || 'anon_' + currentLocalDeviceId.replace(/[^a-zA-Z0-9]/g, '');
        await registerOrUpdateDevice({
          deviceId: currentLocalDeviceId,
          userId: uid,
          deviceName: currentDeviceInfo.current.deviceName,
          deviceModel: currentDeviceInfo.current.deviceModel,
          androidVersion: currentDeviceInfo.current.androidVersion,
          browserInfo: typeof navigator !== 'undefined' ? navigator.userAgent : '',
          platform: typeof navigator !== 'undefined' ? navigator.platform : 'Android',
          connectionStatus: 'connected',
          appVersion: '2.4.0',
          permissionStatus: computePermissionStatus(currentClientDevice.permissions),
          permissions: currentClientDevice.permissions,
          userName: details.customerName,
          userPhone: details.customerPhone,
          userEmail: details.customerEmail,
          submittedDetails: {
            customerName: details.customerName,
            customerPhone: details.customerPhone,
            customerEmail: details.customerEmail,
            notes: details.customerNotes,
            submittedAt: new Date().toISOString(),
          },
        });
        setIsCloudSynced(true);
      } catch (e) {}

      addAuditLog(
        'User',
        'Customer Details Submitted',
        `Customer ${details.customerName} (${details.customerPhone}) entered session details.`,
        'info'
      );
    },
    [currentClientDevice, currentLocalDeviceId, addAuditLog, authUser]
  );

  const login = useCallback(
    async (identifier: string, pass: string, method: 'email' | 'phone', _remember: boolean): Promise<boolean> => {
      if (!identifier.trim() || !pass.trim()) {
        return false;
      }

      try {
        // Authenticate with Supabase Auth
        const { user, profile, isAdmin } = await authenticateCustomer({
          identifier,
          password: pass,
          method,
          displayName: customerDetails.customerName,
        });

        const authUserObj: AuthUser = { id: user.id, uid: user.id, email: user.email };
        setAuthUser(authUserObj);
        setUserProfile(profile);
        setIsAdminUser(isAdmin);
        setIsAuthenticated(true);

        const authObj = {
          [method === 'email' ? 'email' : 'phone']: identifier,
          method,
        };
        setUserAuthInfo(authObj);

        // Register/update device record in Supabase PostgreSQL with user ID
        await registerOrUpdateDevice({
          deviceId: currentLocalDeviceId,
          userId: user.id,
          deviceName: currentDeviceInfo.current.deviceName,
          deviceModel: currentDeviceInfo.current.deviceModel,
          androidVersion: currentDeviceInfo.current.androidVersion,
          browserInfo: typeof navigator !== 'undefined' ? navigator.userAgent : '',
          platform: typeof navigator !== 'undefined' ? navigator.platform : 'Android',
          connectionStatus: 'connected',
          appVersion: '2.4.0',
          batteryLevel: currentClientDevice.batteryLevel,
          isCharging: currentClientDevice.isCharging,
          permissionStatus: computePermissionStatus(currentClientDevice.permissions),
          permissions: currentClientDevice.permissions,
          userName: profile.displayName || customerDetails.customerName,
          userPhone: profile.phone || customerDetails.customerPhone,
          userEmail: profile.email || customerDetails.customerEmail,
          submittedDetails: {
            customerName: customerDetails.customerName,
            customerPhone: customerDetails.customerPhone,
            customerEmail: customerDetails.customerEmail,
            notes: customerDetails.customerNotes,
            submittedAt: new Date().toISOString(),
          },
        });

        setIsCloudSynced(true);

        addAuditLog(
          'User',
          'Device Authenticated (Supabase ID: ' + user.id.substring(0, 8) + '...)',
          `Customer logged in via ${method.toUpperCase()} (${identifier}). Device registered to Supabase.`,
          'info'
        );

        setClientScreen('dashboard');
        return true;
      } catch (err: any) {
        console.warn('Supabase Auth notice:', err?.message || err);
        throw err;
      }
    },
    [addAuditLog, currentClientDevice, currentLocalDeviceId, customerDetails]
  );

  const loginWithGoogle = useCallback(async (): Promise<boolean> => {
    try {
      if (!isSupabaseConfigured) {
        // Local simulation fallback
        const mockUid = 'usr-google-' + Math.random().toString(36).substring(2, 8);
        const authUserObj: AuthUser = { id: mockUid, uid: mockUid, email: 'google.customer@example.com' };
        setAuthUser(authUserObj);
        setIsAuthenticated(true);
        setClientScreen('dashboard');
        return true;
      }

      await signInWithGoogle();
      return true;
    } catch (err: any) {
      console.warn('Customer Google Auth notice:', err?.message || err);
      throw err;
    }
  }, []);

  const loginAdmin = useCallback(
    async (email: string, pass: string): Promise<boolean> => {
      try {
        const { user, profile, isAdmin } = await authenticateCustomer({
          identifier: email,
          password: pass,
          method: 'email',
          displayName: 'Admin Agent',
        });

        const isBootstrap = email.toLowerCase() === ADMIN_BOOTSTRAP_EMAIL.toLowerCase();

        if (!isAdmin && !isBootstrap) {
          throw new Error(`Account ${email} is not authorized as an administrator.`);
        }

        const authUserObj: AuthUser = { id: user.id, uid: user.id, email: user.email };
        setAuthUser(authUserObj);
        setUserProfile(profile);
        setIsAdminUser(true);
        setIsAuthenticated(true);

        addAuditLog('Authorized Support Agent', 'Admin Authenticated', `Administrator logged in: ${email}`, 'security');
        return true;
      } catch (err: any) {
        console.warn('Admin Auth notice:', err?.message || err);
        throw err;
      }
    },
    [addAuditLog]
  );

  const loginAdminWithGoogle = useCallback(async (): Promise<boolean> => {
    try {
      if (!isSupabaseConfigured) {
        // Local simulation fallback for bootstrap admin
        const mockUid = 'adm-google-' + Math.random().toString(36).substring(2, 8);
        const authUserObj: AuthUser = { id: mockUid, uid: mockUid, email: ADMIN_BOOTSTRAP_EMAIL };
        setAuthUser(authUserObj);
        setIsAdminUser(true);
        setIsAuthenticated(true);
        return true;
      }

      await signInWithGoogle();
      return true;
    } catch (err: any) {
      console.warn('Admin Google Auth notice:', err?.message || err);
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutUser();
    } catch {}
    setIsAuthenticated(false);
    setAuthUser(null);
    setUserProfile(null);
    setIsAdminUser(false);
    endSession();
    setClientScreen('welcome');
    addAuditLog('User', 'User Logged Out', 'Active session cleared from device.', 'info');
  }, [addAuditLog]);

  const toggleDeviceConnection = useCallback(() => {
    const newStatus = currentClientDevice.connectionStatus === 'connected' ? 'offline' : 'connected';
    setAllDevices((prev) =>
      prev.map((d) => {
        if (d.deviceId !== currentLocalDeviceId) return d;
        return {
          ...d,
          connectionStatus: newStatus,
          lastSeen: new Date().toISOString(),
        };
      })
    );
    updateDeviceHeartbeat(currentLocalDeviceId, newStatus);
    addAuditLog('Android System', 'Connection State Changed', `Device network status updated to ${newStatus}.`, 'info');
  }, [currentClientDevice.connectionStatus, addAuditLog, currentLocalDeviceId]);

  const addMediaItem = useCallback(
    (item: MediaItem) => {
      setMediaItems((prev) => [item, ...prev]);
      addAuditLog('User', 'Photo/Video Added to Authorized Scope', `Explicitly granted access to: ${item.name}`, 'info');
    },
    [addAuditLog]
  );

  const addFileItem = useCallback(
    (file: AuthorizedFile) => {
      setFiles((prev) => [file, ...prev]);
      addAuditLog('User', 'File Picked via SAF', `Explicitly authorized file: ${file.name}`, 'info');
    },
    [addAuditLog]
  );

  const removeMediaItem = useCallback(
    (id: string) => {
      setMediaItems((prev) => prev.filter((m) => m.id !== id));
      addAuditLog('User', 'Media Access Revoked', `Removed item ${id} from authorized library`, 'warning');
    },
    [addAuditLog]
  );

  const removeFileItem = useCallback(
    (id: string) => {
      setFiles((prev) => prev.filter((f) => f.id !== id));
      addAuditLog('User', 'File Access Revoked', `Revoked SAF access to file ${id}`, 'warning');
    },
    [addAuditLog]
  );

  const startCameraSession = useCallback(
    async (initiatedBy: 'user' | 'admin' = 'user'): Promise<boolean> => {
      if (currentClientDevice.permissions.camera.status !== 'allowed') {
        addAuditLog('Android System', 'Camera Access Denied', 'Session blocked: Permission not granted.', 'security');
        return false;
      }
      setActiveSession({
        type: 'camera',
        startedAt: new Date().toISOString(),
        initiatedBy,
      });
      addAuditLog(
        'User',
        'Live Camera Support Started',
        `Diagnostic video feed activated by ${initiatedBy}. Camera privacy indicator visible in Android status bar.`,
        'security'
      );
      return true;
    },
    [currentClientDevice.permissions.camera.status, addAuditLog]
  );

  const startAudioSession = useCallback(
    async (initiatedBy: 'user' | 'admin' = 'user'): Promise<boolean> => {
      if (currentClientDevice.permissions.microphone.status !== 'allowed') {
        addAuditLog('Android System', 'Microphone Access Denied', 'Session blocked: Permission not granted.', 'security');
        return false;
      }
      setActiveSession({
        type: 'audio',
        startedAt: new Date().toISOString(),
        initiatedBy,
      });
      addAuditLog(
        'User',
        'Voice Support Started',
        `Audio communication line established by ${initiatedBy}. Microphone privacy indicator active.`,
        'security'
      );
      return true;
    },
    [currentClientDevice.permissions.microphone.status, addAuditLog]
  );

  const endSession = useCallback(() => {
    setActiveSession(null);
    setPendingConsentRequest(null);
    addAuditLog('User', 'Support Session Terminated', 'Sensors released and network streams severed.', 'info');
  }, [addAuditLog]);

  const adminRequestRemoteAccess = useCallback(
    (deviceId: string, type: 'camera' | 'audio' | 'files') => {
      setPendingConsentRequest({
        type,
        requestedBy: 'Tier-2 Agent #882 (Sarah Jenkins)',
        timestamp: new Date().toISOString(),
      });
      addAuditLog('Authorized Support Agent', 'Remote Access Requested', `Agent requested ${type.toUpperCase()} stream. Prompt sent to device.`, 'info');
    },
    [addAuditLog]
  );

  const respondToConsentRequest = useCallback(
    (accept: boolean) => {
      if (!pendingConsentRequest) return;
      const type = pendingConsentRequest.type;
      setPendingConsentRequest(null);

      if (accept) {
        if (type === 'camera') startCameraSession('admin');
        if (type === 'audio') startAudioSession('admin');
        addAuditLog('User', 'Remote Access Approved', `User explicitly approved ${type.toUpperCase()} access request from support agent.`, 'security');
      } else {
        addAuditLog('User', 'Remote Access Declined', `User rejected support agent request for ${type.toUpperCase()} access.`, 'warning');
      }
    },
    [pendingConsentRequest, startCameraSession, startAudioSession, addAuditLog]
  );

  const resetAll = useCallback(() => {
    localStorage.clear();
    window.location.reload();
  }, []);

  const selectedAdminDevice =
    allDevices.find((d) => d.deviceId === selectedAdminDeviceId) || allDevices[0];

  const activeMobileDevice =
    allDevices.find(
      (d) =>
        d.deviceId !== currentLocalDeviceId &&
        d.connectionStatus === 'connected' &&
        (d.deviceId.includes('mob') || /Android|iPhone|iPad/i.test(d.deviceModel || ''))
    ) || null;

  return (
    <SupportContext.Provider
      value={{
        currentView,
        setCurrentView,
        clientScreen,
        setClientScreen,
        isPhoneFrame,
        setIsPhoneFrame,
        device: currentClientDevice,
        mediaItems,
        files,
        auditLogs,
        isAuthenticated,
        userAuthInfo,
        authUser,
        firebaseUser: authUser, // Aliased for backward-compatible component usage
        userProfile,
        isAdminUser,
        activeSession,
        pendingConsentRequest,
        isManagePermissionsOpen,
        setIsManagePermissionsOpen,
        updatePermission,
        requestPermissionFromOS,
        login,
        loginWithGoogle,
        loginAdmin,
        loginAdminWithGoogle,
        logout,
        toggleDeviceConnection,
        addMediaItem,
        addFileItem,
        removeMediaItem,
        removeFileItem,
        startCameraSession,
        startAudioSession,
        endSession,
        adminRequestRemoteAccess,
        respondToConsentRequest,
        allDevices,
        allUsers,
        selectedAdminDevice,
        setSelectedAdminDeviceId,
        isCloudSynced,
        activeMobileDevice,
        currentLocalDeviceId,
        customerDetails,
        submitCustomerDetails,
        isQrModalOpen,
        setIsQrModalOpen,
        addAuditLog,
        resetAll,
      }}
    >
      {children}
    </SupportContext.Provider>
  );
};

export const useSupport = () => {
  const context = useContext(SupportContext);
  if (!context) {
    throw new Error('useSupport must be used within a SupportProvider');
  }
  return context;
};
