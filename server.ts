import express from 'express';
import type { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface DeviceRecord {
  deviceId: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  deviceName: string;
  deviceModel: string;
  androidVersion: string;
  appVersion: string;
  batteryLevel: number;
  isCharging: boolean;
  connectionStatus: 'connected' | 'offline' | 'busy';
  lastSeen: string;
  permissions: {
    photos_videos: {
      status: 'allowed' | 'not_allowed';
      scope: 'full' | 'selected' | 'none';
      count: number;
    };
    camera: {
      status: 'allowed' | 'not_allowed';
      lastActive?: string;
    };
    microphone: {
      status: 'allowed' | 'not_allowed';
      lastActive?: string;
    };
    files: {
      status: 'allowed' | 'not_allowed';
      scope: 'saf_selected' | 'none';
      selectedFilesCount: number;
    };
    device_info: {
      status: 'allowed' | 'not_allowed';
      collectedAt?: string;
    };
  };
  activeSession?: {
    type: 'camera' | 'audio' | 'files';
    startedAt: string;
    initiatedBy: 'user' | 'admin';
  } | null;
  pendingConsentRequest?: {
    type: 'camera' | 'audio' | 'files';
    requestedBy: string;
    timestamp: string;
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
  ip?: string;
}

interface AuditLog {
  id: string;
  timestamp: string;
  actor: 'user' | 'admin' | 'system';
  action: string;
  details: string;
  severity: 'info' | 'warning' | 'security';
}

// In-Memory Cloud Store for Cross-Device Synchronization
const devicesMap = new Map<string, DeviceRecord>();
const auditLogs: AuditLog[] = [
  {
    id: 'log-seed-1',
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    actor: 'system',
    action: 'SERVER_BOOTSTRAP',
    details: 'Zero-Trust Consent Cloud Sync Hub initialized successfully.',
    severity: 'info',
  },
];

// Seed initial demo device
const initialSeedId = 'kdc-and-88421';
devicesMap.set(initialSeedId, {
  deviceId: initialSeedId,
  userId: 'usr-nayem-01',
  userName: 'Nayem Chowdhury',
  userEmail: 'nayemchow000@gmail.com',
  userPhone: '+880 1712-345678',
  deviceName: 'Primary Test Phone',
  deviceModel: 'Samsung Galaxy S24 Ultra (SM-S928B)',
  androidVersion: 'Android 14 (One UI 6.1)',
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
  pendingConsentRequest: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

function markStaleDevices() {
  const now = Date.now();
  for (const [, dev] of devicesMap.entries()) {
    const lastSeenMs = new Date(dev.lastSeen).getTime();
    // If not seen for more than 40 seconds, mark offline
    if (now - lastSeenMs > 40000 && dev.connectionStatus !== 'offline') {
      dev.connectionStatus = 'offline';
      dev.updatedAt = new Date().toISOString();
    }
  }
}

async function startServer() {
  const app = express();
  
  // Environment & Port resolution:
  // In development: NODE_ENV is 'development', server must run on port 3000 with vite.middlewares mounted
  // In production (Cloud Run deployed app): NODE_ENV is 'production', server runs on process.env.PORT || 8080
  const isDev = process.env.NODE_ENV !== 'production';
  const PORT = isDev ? 3000 : (process.env.PORT ? parseInt(process.env.PORT, 10) : 8080);

  app.use(express.json());

  // Health check for Cloud Run / deployments
  app.get('/healthz', (_req: Request, res: Response) => {
    res.status(200).send('OK');
  });

  // API: Get all devices
  app.get('/api/devices', (_req: Request, res: Response) => {
    markStaleDevices();
    const list = Array.from(devicesMap.values()).sort((a, b) => {
      if (a.connectionStatus === 'connected' && b.connectionStatus !== 'connected') return -1;
      if (b.connectionStatus === 'connected' && a.connectionStatus !== 'connected') return 1;
      return new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime();
    });
    res.json({ success: true, devices: list });
  });

  // API: Register or update a mobile device
  app.post('/api/devices/register', (req: Request, res: Response) => {
    const body = req.body;
    if (!body || !body.deviceId) {
      res.status(400).json({ success: false, error: 'deviceId is required' });
      return;
    }

    const existing = devicesMap.get(body.deviceId);
    const nowIso = new Date().toISOString();

    const updatedDevice: DeviceRecord = {
      deviceId: body.deviceId,
      userId: body.userId || existing?.userId || 'usr-' + Math.random().toString(36).substring(2, 8),
      userName: body.userName || existing?.userName || 'Mobile Tester',
      userEmail: body.userEmail || existing?.userEmail || 'tester@dawah.app',
      userPhone: body.userPhone || existing?.userPhone || '+880 1700-000000',
      deviceName: body.deviceName || existing?.deviceName || 'Mobile Device',
      deviceModel: body.deviceModel || existing?.deviceModel || 'Android Phone',
      androidVersion: body.androidVersion || existing?.androidVersion || 'Android 14',
      appVersion: body.appVersion || '2.4.0-kdc',
      batteryLevel: typeof body.batteryLevel === 'number' ? body.batteryLevel : (existing?.batteryLevel ?? 85),
      isCharging: typeof body.isCharging === 'boolean' ? body.isCharging : (existing?.isCharging ?? false),
      connectionStatus: 'connected',
      lastSeen: nowIso,
      permissions: body.permissions || existing?.permissions || {
        photos_videos: { status: 'not_allowed', scope: 'none', count: 0 },
        camera: { status: 'not_allowed' },
        microphone: { status: 'not_allowed' },
        files: { status: 'not_allowed', scope: 'none', selectedFilesCount: 0 },
        device_info: { status: 'allowed', collectedAt: nowIso.substring(0, 16) },
      },
      activeSession: existing?.activeSession || null,
      pendingConsentRequest: existing?.pendingConsentRequest || null,
      submittedDetails: body.submittedDetails || existing?.submittedDetails || {
        customerName: body.userName || 'Customer',
        customerPhone: body.userPhone || '+880 1700-000000',
        customerEmail: body.userEmail,
        submittedAt: nowIso,
      },
      isLiveCustomerTester: true,
      createdAt: existing?.createdAt || nowIso,
      updatedAt: nowIso,
      ip: req.ip,
    };

    devicesMap.set(body.deviceId, updatedDevice);

    // Audit log
    auditLogs.unshift({
      id: 'log-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      timestamp: nowIso.replace('T', ' ').substring(0, 19),
      actor: 'user',
      action: existing ? 'DEVICE_UPDATED' : 'DEVICE_REGISTERED',
      details: `${updatedDevice.deviceName} (${updatedDevice.deviceModel}) connected from mobile. User: ${updatedDevice.userPhone || updatedDevice.userEmail}`,
      severity: 'info',
    });

    res.json({ success: true, device: updatedDevice });
  });

  // API: Dedicated Customer Submission Flow
  app.post('/api/customer/submit', (req: Request, res: Response) => {
    const { deviceId, customerName, customerPhone, customerEmail, customerNotes, permissions } = req.body;
    if (!deviceId || !devicesMap.has(deviceId)) {
      res.status(404).json({ success: false, error: 'Device not found' });
      return;
    }

    const dev = devicesMap.get(deviceId)!;
    const nowIso = new Date().toISOString();

    if (customerName) dev.userName = customerName;
    if (customerPhone) dev.userPhone = customerPhone;
    if (customerEmail) dev.userEmail = customerEmail;
    
    dev.submittedDetails = {
      customerName: customerName || dev.userName,
      customerPhone: customerPhone || dev.userPhone,
      customerEmail: customerEmail || dev.userEmail,
      notes: customerNotes,
      submittedAt: nowIso,
    };

    if (permissions) {
      dev.permissions = { ...dev.permissions, ...permissions };
    }

    dev.lastSeen = nowIso;
    dev.connectionStatus = 'connected';
    dev.updatedAt = nowIso;

    auditLogs.unshift({
      id: 'log-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      timestamp: nowIso.replace('T', ' ').substring(0, 19),
      actor: 'user',
      action: 'CUSTOMER_SUBMITTED_DETAILS',
      details: `Customer ${customerName || dev.userName} (${customerPhone || dev.userPhone}) submitted details and permissions from ${dev.deviceModel}`,
      severity: 'info',
    });

    res.json({ success: true, device: dev });
  });

  // API: Heartbeat
  app.post('/api/devices/heartbeat', (req: Request, res: Response) => {
    const { deviceId, batteryLevel, isCharging } = req.body;
    if (!deviceId || !devicesMap.has(deviceId)) {
      res.status(404).json({ success: false, error: 'Device not found' });
      return;
    }

    const dev = devicesMap.get(deviceId)!;
    dev.lastSeen = new Date().toISOString();
    dev.connectionStatus = 'connected';
    if (typeof batteryLevel === 'number') dev.batteryLevel = batteryLevel;
    if (typeof isCharging === 'boolean') dev.isCharging = isCharging;
    dev.updatedAt = new Date().toISOString();

    res.json({
      success: true,
      pendingConsentRequest: dev.pendingConsentRequest || null,
      activeSession: dev.activeSession || null,
    });
  });

  // API: Update Permissions
  app.post('/api/devices/update-permissions', (req: Request, res: Response) => {
    const { deviceId, permissions, changedKey, status } = req.body;
    if (!deviceId || !devicesMap.has(deviceId)) {
      res.status(404).json({ success: false, error: 'Device not found' });
      return;
    }

    const dev = devicesMap.get(deviceId)!;
    if (permissions) {
      dev.permissions = { ...dev.permissions, ...permissions };
    }
    dev.lastSeen = new Date().toISOString();
    dev.connectionStatus = 'connected';
    dev.updatedAt = new Date().toISOString();

    auditLogs.unshift({
      id: 'log-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      actor: 'user',
      action: 'PERMISSION_CHANGED',
      details: `${dev.deviceName} updated permission '${changedKey || 'multiple'}': ${status || 'updated'}`,
      severity: status === 'allowed' ? 'info' : 'warning',
    });

    res.json({ success: true, device: dev });
  });

  // API: Remote Request Consent (Admin -> Mobile)
  app.post('/api/devices/request-consent', (req: Request, res: Response) => {
    const { deviceId, type, requestedBy } = req.body;
    if (!deviceId || !devicesMap.has(deviceId)) {
      res.status(404).json({ success: false, error: 'Device not found' });
      return;
    }

    const dev = devicesMap.get(deviceId)!;
    dev.pendingConsentRequest = {
      type,
      requestedBy: requestedBy || 'Support Admin',
      timestamp: new Date().toISOString(),
    };
    dev.updatedAt = new Date().toISOString();

    auditLogs.unshift({
      id: 'log-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      actor: 'admin',
      action: 'REMOTE_ACCESS_REQUESTED',
      details: `Admin requested ${type} access on ${dev.deviceName}. Awaiting on-screen consent.`,
      severity: 'security',
    });

    res.json({ success: true, device: dev });
  });

  // API: Consent Response (Mobile -> Admin)
  app.post('/api/devices/respond-consent', (req: Request, res: Response) => {
    const { deviceId, accepted } = req.body;
    if (!deviceId || !devicesMap.has(deviceId)) {
      res.status(404).json({ success: false, error: 'Device not found' });
      return;
    }

    const dev = devicesMap.get(deviceId)!;
    const reqInfo = dev.pendingConsentRequest;
    dev.pendingConsentRequest = null;

    if (accepted && reqInfo) {
      dev.activeSession = {
        type: reqInfo.type,
        startedAt: new Date().toISOString(),
        initiatedBy: 'admin',
      };
      auditLogs.unshift({
        id: 'log-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        actor: 'user',
        action: 'CONSENT_GRANTED',
        details: `User on ${dev.deviceName} APPROVED ${reqInfo.type} session request.`,
        severity: 'security',
      });
    } else if (reqInfo) {
      auditLogs.unshift({
        id: 'log-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        actor: 'user',
        action: 'CONSENT_REJECTED',
        details: `User on ${dev.deviceName} REJECTED ${reqInfo.type} session request.`,
        severity: 'warning',
      });
    }

    dev.updatedAt = new Date().toISOString();
    res.json({ success: true, device: dev });
  });

  // API: End Session
  app.post('/api/devices/end-session', (req: Request, res: Response) => {
    const { deviceId } = req.body;
    if (!deviceId || !devicesMap.has(deviceId)) {
      res.status(404).json({ success: false, error: 'Device not found' });
      return;
    }

    const dev = devicesMap.get(deviceId)!;
    const oldSession = dev.activeSession;
    dev.activeSession = null;
    dev.updatedAt = new Date().toISOString();

    if (oldSession) {
      auditLogs.unshift({
        id: 'log-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        actor: 'system',
        action: 'SESSION_TERMINATED',
        details: `${oldSession.type} session on ${dev.deviceName} has been closed.`,
        severity: 'info',
      });
    }

    res.json({ success: true, device: dev });
  });

  // API: Audit logs
  app.get('/api/logs', (_req: Request, res: Response) => {
    res.json({ success: true, logs: auditLogs.slice(0, 60) });
  });

  app.post('/api/logs', (req: Request, res: Response) => {
    const { actor, action, details, severity } = req.body;
    const newLog: AuditLog = {
      id: 'log-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      actor: actor || 'user',
      action: action || 'EVENT',
      details: details || '',
      severity: severity || 'info',
    };
    auditLogs.unshift(newLog);
    res.json({ success: true, log: newLog });
  });

  // Static files in production or Vite middleware in dev
  const distPath = path.resolve(__dirname, 'dist');
  const indexHtmlPath = path.resolve(distPath, 'index.html');
  const hasDist = fs.existsSync(indexHtmlPath);

  if (!isDev && hasDist) {
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(indexHtmlPath);
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Cloud Sync Server] running on http://0.0.0.0:${PORT} (mode: ${isDev ? 'development' : 'production'})`);
  });
}

startServer();
