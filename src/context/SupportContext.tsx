import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  AppView,
  ClientScreen,
  DeviceRecord,
  PermissionsState,
  MediaItem,
  AuthorizedFile,
  AuditLog,
} from '../types';
import { INITIAL_DEVICES, INITIAL_FILES, INITIAL_MEDIA_ITEMS, INITIAL_AUDIT_LOGS } from '../data/mockData';
import { detectCurrentDevice, getOrCreateDeviceId } from '../utils/deviceDetection';

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
  login: (identifier: string, pass: string, method: 'email' | 'phone', remember: boolean) => boolean;
  logout: () => void;
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

const STORAGE_KEY = 'kdc_support_state_v2';

export const SupportProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const currentDeviceInfo = useRef(detectCurrentDevice());
  const currentLocalDeviceId = currentDeviceInfo.current.deviceId;

  // Dual-Role Auto Detection:
  // ?role=customer / ?view=customer -> Client/Customer View
  // ?role=admin -> Admin Dashboard
  // Mobile devices -> Client/Customer View
  // Desktop/AI Studio default -> Admin Dashboard
  const [currentView, setCurrentView] = useState<AppView>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const roleParam = urlParams.get('role') || urlParams.get('view');
      if (roleParam === 'customer' || roleParam === 'client') return 'client';
      if (roleParam === 'admin') return 'admin';
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

  const [customerDetails, setCustomerDetails] = useState<{
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    customerNotes?: string;
  }>(() => ({
    customerName: 'Nayem Chowdhury',
    customerPhone: '+880 1712-345678',
    customerEmail: 'nayemchow000@gmail.com',
    customerNotes: 'Live customer testing via mobile link',
  }));

  // Initialize devices
  const [allDevices, setAllDevices] = useState<DeviceRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY + '_devices');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    // Create initial entry representing this device
    const thisDevice: DeviceRecord = {
      deviceId: currentDeviceInfo.current.deviceId,
      userId: 'usr-client-01',
      userName: 'Mobile User',
      userEmail: 'nayemchow000@gmail.com',
      userPhone: '+880 1712-345678',
      deviceName: currentDeviceInfo.current.deviceName,
      deviceModel: currentDeviceInfo.current.deviceModel,
      androidVersion: currentDeviceInfo.current.androidVersion,
      appVersion: '2.4.0-kdc',
      batteryLevel: 92,
      isCharging: false,
      connectionStatus: 'connected',
      lastSeen: new Date().toISOString(),
      permissions: {
        photos_videos: { status: 'allowed', scope: 'full', count: 6 },
        camera: { status: 'allowed', lastActive: new Date().toISOString().substring(0, 16) },
        microphone: { status: 'allowed', lastActive: new Date().toISOString().substring(0, 16) },
        files: { status: 'allowed', scope: 'saf_selected', selectedFilesCount: 4 },
        device_info: { status: 'allowed', collectedAt: new Date().toISOString().substring(0, 16) },
      },
      activeSession: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return [thisDevice, ...INITIAL_DEVICES.filter((d) => d.deviceId !== thisDevice.deviceId)];
  });

  const [selectedAdminDeviceId, setSelectedAdminDeviceId] = useState<string>(
    () => allDevices[0]?.deviceId || currentDeviceInfo.current.deviceId
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

  // Find local client device
  const currentClientDevice =
    allDevices.find((d) => d.deviceId === currentLocalDeviceId) || allDevices[0];

  // Helper to persist local state
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY + '_devices', JSON.stringify(allDevices));
  }, [allDevices]);

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

  // Battery detection where supported
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

  // Push local device registration to central backend
  const registerLocalDeviceWithBackend = useCallback(async () => {
    try {
      const dev = currentClientDevice;
      const res = await fetch('/api/devices/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: currentLocalDeviceId,
          userName: dev.userName || 'Tester User',
          userEmail: userAuthInfo?.email || dev.userEmail,
          userPhone: userAuthInfo?.phone || dev.userPhone,
          deviceName: currentDeviceInfo.current.deviceName,
          deviceModel: currentDeviceInfo.current.deviceModel,
          androidVersion: currentDeviceInfo.current.androidVersion,
          batteryLevel: dev.batteryLevel,
          isCharging: dev.isCharging,
          permissions: dev.permissions,
        }),
      });
      if (res.ok) {
        setIsCloudSynced(true);
      }
    } catch (e) {
      // Backend maybe initializing
    }
  }, [currentClientDevice, currentLocalDeviceId, userAuthInfo]);

  // Synchronize with central backend: register + periodic poll
  useEffect(() => {
    registerLocalDeviceWithBackend();

    const fetchFleet = async () => {
      try {
        const res = await fetch('/api/devices');
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.devices)) {
            setIsCloudSynced(true);
            setAllDevices((prev) => {
              // Merge remote devices with local device state
              const map = new Map<string, DeviceRecord>();
              for (const remote of data.devices) {
                map.set(remote.deviceId, remote);
              }
              // Ensure local device remains present with latest local tweaks
              const local = prev.find((d) => d.deviceId === currentLocalDeviceId);
              if (local && !map.has(currentLocalDeviceId)) {
                map.set(currentLocalDeviceId, local);
              }
              return Array.from(map.values());
            });
          }
        }
      } catch (err) {
        // network or dev server restart
      }
    };

    const fetchLogs = async () => {
      try {
        const res = await fetch('/api/logs');
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.logs) && data.logs.length > 0) {
            setAuditLogs(data.logs);
          }
        }
      } catch (err) {}
    };

    // Heartbeat ping
    const heartbeat = async () => {
      try {
        const dev = currentClientDevice;
        const res = await fetch('/api/devices/heartbeat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            deviceId: currentLocalDeviceId,
            batteryLevel: dev.batteryLevel,
            isCharging: dev.isCharging,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.pendingConsentRequest && !pendingConsentRequest) {
            setPendingConsentRequest(data.pendingConsentRequest);
          }
        }
      } catch (e) {}
    };

    // Initial fetch
    fetchFleet();
    fetchLogs();

    // Fast polling intervals for real-time customer testing flow
    const fleetInterval = setInterval(fetchFleet, 1200);
    const heartbeatInterval = setInterval(heartbeat, 3000);
    const logsInterval = setInterval(fetchLogs, 3500);

    return () => {
      clearInterval(fleetInterval);
      clearInterval(heartbeatInterval);
      clearInterval(logsInterval);
    };
  }, [currentLocalDeviceId, registerLocalDeviceWithBackend]);

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

      // Broadcast to server
      fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLog),
      }).catch(() => {});
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
              scope: status === 'allowed' ? (extra?.scope || 'saf_selected') : 'none',
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

          // Push to backend
          fetch('/api/devices/update-permissions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              deviceId: currentLocalDeviceId,
              permissions: newPermissions,
              changedKey: key,
              status,
            }),
          }).catch(() => {});

          return {
            ...d,
            permissions: newPermissions,
            updatedAt: new Date().toISOString(),
          };
        })
      );

      const labelMap: Record<string, string> = {
        photos_videos: 'Photos & Videos',
        camera: 'Camera',
        microphone: 'Microphone',
        files: 'Files & Documents',
        device_info: 'Device Information',
      };

      addAuditLog(
        'User',
        `Permission ${status === 'allowed' ? 'Granted' : 'Revoked'}`,
        `${labelMap[key] || key} set to ${status === 'allowed' ? 'Allowed' : 'Not Allowed'}${extra?.scope ? ` (${extra.scope})` : ''}`,
        status === 'allowed' ? 'info' : 'warning'
      );
    },
    [mediaItems.length, files.length, addAuditLog, currentLocalDeviceId]
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

      try {
        await fetch('/api/customer/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            deviceId: currentLocalDeviceId,
            customerName: details.customerName,
            customerPhone: details.customerPhone,
            customerEmail: details.customerEmail,
            customerNotes: details.customerNotes,
            permissions: currentClientDevice.permissions,
          }),
        });
      } catch (err) {}

      addAuditLog(
        'User',
        'Customer Details Submitted',
        `Customer ${details.customerName} (${details.customerPhone}) entered session details.`,
        'info'
      );
    },
    [currentClientDevice, currentLocalDeviceId, addAuditLog]
  );

  const login = useCallback(
    (identifier: string, pass: string, method: 'email' | 'phone', remember: boolean): boolean => {
      if (!identifier.trim() || !pass.trim()) {
        return false;
      }
      setIsAuthenticated(true);
      const authObj = {
        [method === 'email' ? 'email' : 'phone']: identifier,
        method,
      };
      setUserAuthInfo(authObj);

      setAllDevices((prev) =>
        prev.map((d) =>
          d.deviceId === currentLocalDeviceId
            ? {
                ...d,
                connectionStatus: 'connected',
                lastSeen: new Date().toISOString(),
                userEmail: method === 'email' ? identifier : d.userEmail,
                userPhone: method === 'phone' ? identifier : d.userPhone,
              }
            : d
        )
      );

      // Notify server of authentication with real device details
      fetch('/api/devices/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: currentLocalDeviceId,
          deviceName: currentDeviceInfo.current.deviceName,
          deviceModel: currentDeviceInfo.current.deviceModel,
          androidVersion: currentDeviceInfo.current.androidVersion,
          userEmail: method === 'email' ? identifier : undefined,
          userPhone: method === 'phone' ? identifier : undefined,
          userName: identifier.split('@')[0] || 'Mobile Member',
        }),
      }).catch(() => {});

      addAuditLog(
        'User',
        'Device Authenticated',
        `User logged in via ${method.toUpperCase()} (${identifier}) on ${currentDeviceInfo.current.deviceName}. Status: Connected.`,
        'info'
      );
      setClientScreen('dashboard');
      return true;
    },
    [addAuditLog, currentLocalDeviceId]
  );

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    endSession();
    setClientScreen('welcome');
    addAuditLog('User', 'User Logged Out', 'Active session cleared from device.', 'info');
  }, [addAuditLog]);

  const toggleDeviceConnection = useCallback(() => {
    setAllDevices((prev) =>
      prev.map((d) => {
        if (d.deviceId !== currentLocalDeviceId) return d;
        const newStatus = d.connectionStatus === 'connected' ? 'offline' : 'connected';
        return {
          ...d,
          connectionStatus: newStatus,
          lastSeen: new Date().toISOString(),
        };
      })
    );
    const newStatus = currentClientDevice.connectionStatus === 'connected' ? 'Offline' : 'Connected';
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
      addAuditLog('User', 'File Access Revoked', `Removed file ${id} from authorized scope`, 'warning');
    },
    [addAuditLog]
  );

  // Sessions
  const startCameraSession = useCallback(
    async (initiatedBy: 'user' | 'admin' = 'user'): Promise<boolean> => {
      if (currentClientDevice.permissions.camera.status !== 'allowed') {
        addAuditLog('User', 'Camera Session Blocked', 'Camera permission not granted by user.', 'security');
        return false;
      }
      setActiveSession({
        type: 'camera',
        startedAt: new Date().toLocaleTimeString(),
        initiatedBy,
      });
      addAuditLog(
        initiatedBy === 'user' ? 'User' : 'Authorized Support Agent',
        'Camera Support Session Started',
        `Live camera session started with user consent on ${currentClientDevice.deviceName}.`,
        'security'
      );
      return true;
    },
    [currentClientDevice.permissions.camera.status, currentClientDevice.deviceName, addAuditLog]
  );

  const startAudioSession = useCallback(
    async (initiatedBy: 'user' | 'admin' = 'user'): Promise<boolean> => {
      if (currentClientDevice.permissions.microphone.status !== 'allowed') {
        addAuditLog('User', 'Audio Session Blocked', 'Microphone permission not granted by user.', 'security');
        return false;
      }
      setActiveSession({
        type: 'audio',
        startedAt: new Date().toLocaleTimeString(),
        initiatedBy,
      });
      addAuditLog(
        initiatedBy === 'user' ? 'User' : 'Authorized Support Agent',
        'Audio Support Session Started',
        `Live audio session started with user consent on ${currentClientDevice.deviceName}.`,
        'security'
      );
      return true;
    },
    [currentClientDevice.permissions.microphone.status, currentClientDevice.deviceName, addAuditLog]
  );

  const endSession = useCallback(() => {
    if (activeSession) {
      addAuditLog(
        'User',
        'Support Session Terminated',
        `${activeSession.type.toUpperCase()} session stopped. Hardware sensors released immediately.`,
        'info'
      );
      fetch('/api/devices/end-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId: currentLocalDeviceId }),
      }).catch(() => {});
    }
    setActiveSession(null);
  }, [activeSession, addAuditLog, currentLocalDeviceId]);

  const adminRequestRemoteAccess = useCallback(
    (targetDeviceId: string, type: 'camera' | 'audio' | 'files') => {
      fetch('/api/devices/request-consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: targetDeviceId,
          type,
          requestedBy: 'Support Agent Sarah J. (ID #882)',
        }),
      }).catch(() => {});

      addAuditLog(
        'Authorized Support Agent',
        'Remote Session Requested',
        `Support agent dispatched ${type} stream request to ${targetDeviceId}. Awaiting user consent.`,
        'security'
      );
    },
    [addAuditLog]
  );

  const respondToConsentRequest = useCallback(
    (accept: boolean) => {
      if (!pendingConsentRequest) return;
      const { type } = pendingConsentRequest;
      setPendingConsentRequest(null);

      fetch('/api/devices/respond-consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: currentLocalDeviceId,
          accepted: accept,
        }),
      }).catch(() => {});

      if (accept) {
        addAuditLog('User', 'Remote Session Request Accepted', `User explicitly approved ${type} support request.`, 'security');
        if (type === 'camera') startCameraSession('admin');
        else if (type === 'audio') startAudioSession('admin');
        else {
          setActiveSession({
            type: 'files',
            startedAt: new Date().toLocaleTimeString(),
            initiatedBy: 'admin',
          });
        }
      } else {
        addAuditLog('User', 'Remote Session Request Declined', `User rejected support agent request for ${type}.`, 'warning');
      }
    },
    [pendingConsentRequest, addAuditLog, startCameraSession, startAudioSession, currentLocalDeviceId]
  );

  const resetAll = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY + '_devices');
    localStorage.removeItem(STORAGE_KEY + '_media');
    localStorage.removeItem(STORAGE_KEY + '_files');
    localStorage.removeItem(STORAGE_KEY + '_logs');
    localStorage.removeItem(STORAGE_KEY + '_auth');
    localStorage.removeItem(STORAGE_KEY + '_user_auth');
    setMediaItems(INITIAL_MEDIA_ITEMS);
    setFiles(INITIAL_FILES);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    setIsAuthenticated(false);
    setClientScreen('welcome');
    setActiveSession(null);
    setPendingConsentRequest(null);
  }, []);

  // Detect if any OTHER device (such as a mobile tester phone) is actively connected
  const activeMobileDevice =
    allDevices.find(
      (d) =>
        d.deviceId !== currentLocalDeviceId &&
        d.connectionStatus === 'connected'
    ) || null;

  const selectedAdminDevice =
    allDevices.find((d) => d.deviceId === selectedAdminDeviceId) ||
    activeMobileDevice ||
    allDevices[0];

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

        activeSession,
        pendingConsentRequest,
        isManagePermissionsOpen,
        setIsManagePermissionsOpen,

        updatePermission,
        requestPermissionFromOS,
        login,
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
