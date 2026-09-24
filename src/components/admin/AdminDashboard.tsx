import React, { useState } from 'react';
import { useSupport } from '../../context/SupportContext';
import {
  ShieldCheck,
  Smartphone,
  CheckCircle,
  XCircle,
  Camera,
  Mic,
  FolderOpen,
  Image,
  RefreshCw,
  Search,
  Filter,
  Radio,
  Play,
  Square,
  Clock,
  Battery,
  BatteryCharging,
  Wifi,
  WifiOff,
  UserCheck,
  AlertTriangle,
  FileText,
  Lock,
  ExternalLink,
  ChevronRight,
  Copy,
  Check,
  QrCode,
  User,
  Phone,
  Mail,
  Share2,
  Users,
  ArrowLeft,
  Activity,
} from 'lucide-react';
import { DeviceRecord } from '../../types';

export const AdminDashboard: React.FC = () => {
  const {
    allDevices,
    allUsers,
    selectedAdminDevice,
    setSelectedAdminDeviceId,
    adminRequestRemoteAccess,
    activeSession,
    endSession,
    mediaItems,
    files,
    auditLogs,
    isQrModalOpen,
    setIsQrModalOpen,
    activeMobileDevice,
  } = useSupport();

  const [viewMode, setViewMode] = useState<'table' | 'command_center'>('table');
  const [customerLinkCopied, setCustomerLinkCopied] = useState(false);
  const [deviceSearch, setDeviceSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'connected' | 'offline'>('all');
  const [adminTab, setAdminTab] = useState<'overview' | 'media' | 'files' | 'telemetry' | 'audit'>('overview');
  const [requestNotification, setRequestNotification] = useState<string | null>(null);

  const device = selectedAdminDevice;
  const isSelectedConnected = device.connectionStatus === 'connected';
  const perms = device.permissions;

  // Real-time heartbeat validation: consider offline if no heartbeat in 60s
  const now = Date.now();
  const isDeviceTrulyOnline = (d: DeviceRecord) => {
    if (d.connectionStatus !== 'connected') return false;
    const lastSeenMs = new Date(d.lastSeen).getTime();
    return !isNaN(lastSeenMs) && now - lastSeenMs < 60000;
  };

  // 5 Required Real Metrics
  const totalCustomers =
    allUsers && allUsers.length > 0
      ? allUsers.filter((u) => u.role === 'customer').length
      : new Set(allDevices.map((d) => d.userId || d.userName)).size;

  const totalRegisteredDevices = allDevices.length;
  const totalOnline = allDevices.filter(isDeviceTrulyOnline).length;
  const totalOffline = allDevices.length - totalOnline;
  const recentlyActiveDevices = allDevices.filter((d) => {
    const timeMs = new Date(d.lastSeen || d.updatedAt).getTime();
    return !isNaN(timeMs) && now - timeMs < 15 * 60 * 1000;
  }).length;

  // Filter devices list
  const filteredDevices = allDevices.filter((d) => {
    const isOnline = isDeviceTrulyOnline(d);
    if (filterStatus === 'connected' && !isOnline) return false;
    if (filterStatus === 'offline' && isOnline) return false;
    if (
      deviceSearch &&
      !d.deviceName.toLowerCase().includes(deviceSearch.toLowerCase()) &&
      !d.deviceId.toLowerCase().includes(deviceSearch.toLowerCase()) &&
      !d.deviceModel.toLowerCase().includes(deviceSearch.toLowerCase()) &&
      !(d.userName || '').toLowerCase().includes(deviceSearch.toLowerCase()) &&
      !(d.userEmail || '').toLowerCase().includes(deviceSearch.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const handleRequestAccess = (type: 'camera' | 'audio' | 'files') => {
    // Strict compliance: Cannot request if permission is completely denied
    if (type === 'camera' && perms.camera.status !== 'allowed') {
      setRequestNotification('Cannot request stream: Camera permission is NOT granted on user device.');
      setTimeout(() => setRequestNotification(null), 4000);
      return;
    }
    if (type === 'audio' && perms.microphone.status !== 'allowed') {
      setRequestNotification('Cannot request stream: Microphone permission is NOT granted on user device.');
      setTimeout(() => setRequestNotification(null), 4000);
      return;
    }
    if (type === 'files' && perms.files.status !== 'allowed') {
      setRequestNotification('Cannot request files: Storage permission is NOT granted on user device.');
      setTimeout(() => setRequestNotification(null), 4000);
      return;
    }

    adminRequestRemoteAccess(device.deviceId, type);
    setRequestNotification(`Consent prompt dispatched to ${device.deviceName}. Awaiting user approval...`);
    setTimeout(() => setRequestNotification(null), 4500);
  };

  return (
    <div className="flex-1 bg-slate-950 text-white min-h-[calc(100vh-60px)] p-4 sm:p-6 flex flex-col">
      {/* Top Banner / Operator Identity */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-3xl mb-6 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-white">
                Authorized Support Console
              </h1>
              <span className="text-[10px] bg-indigo-950 border border-indigo-800 text-indigo-300 font-semibold px-2 py-0.5 rounded-full">
                Tier-2 Agent
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Logged in as: <strong className="text-slate-200">Sarah Jenkins (Agent ID #882)</strong> • Zero-Trust Remote Protocol
            </p>
          </div>
        </div>

        {/* Global Fleet Metrics */}
        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
          <div className="px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-center min-w-[70px]">
            <div className="text-[10px] uppercase font-bold text-slate-400">Customers</div>
            <div className="text-sm font-bold text-white mt-0.5">{totalCustomers}</div>
          </div>
          <div className="px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-center min-w-[70px]">
            <div className="text-[10px] uppercase font-bold text-slate-400">Registered</div>
            <div className="text-sm font-bold text-cyan-400 mt-0.5">{totalRegisteredDevices}</div>
          </div>
          <div className="px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-center min-w-[70px]">
            <div className="text-[10px] uppercase font-bold text-emerald-400">Online</div>
            <div className="text-sm font-bold text-emerald-400 mt-0.5">{totalOnline}</div>
          </div>
          <div className="px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-center min-w-[70px]">
            <div className="text-[10px] uppercase font-bold text-slate-400">Offline</div>
            <div className="text-sm font-bold text-slate-400 mt-0.5">{totalOffline}</div>
          </div>
          <div className="px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-center min-w-[70px]">
            <div className="text-[10px] uppercase font-bold text-indigo-400">Active (15m)</div>
            <div className="text-sm font-bold text-indigo-300 mt-0.5">{recentlyActiveDevices}</div>
          </div>
        </div>
      </div>

      {/* View Mode Switcher */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('table')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              viewMode === 'table'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Customer & Device Directory Table</span>
            <span className="px-1.5 py-0.5 rounded-full bg-slate-950 text-slate-200 text-[10px] font-mono">
              {allDevices.length}
            </span>
          </button>

          <button
            onClick={() => setViewMode('command_center')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              viewMode === 'command_center'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Device Command Center ({device.deviceName})</span>
          </button>
        </div>

        {viewMode === 'command_center' && (
          <button
            onClick={() => setViewMode('table')}
            className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 font-medium transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Directory Table</span>
          </button>
        )}
      </div>

      {/* Customer & Device Directory Table View */}
      {viewMode === 'table' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 mb-6 shadow-xl flex-1 flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-400" />
                Customer & Registered Device Table
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time Firestore records synced from client mobile devices and authenticated customers.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search customer, phone, device..."
                  value={deviceSearch}
                  onChange={(e) => setDeviceSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex gap-1 p-0.5 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                <button
                  onClick={() => setFilterStatus('all')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                    filterStatus === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                  }`}
                >
                  All ({allDevices.length})
                </button>
                <button
                  onClick={() => setFilterStatus('connected')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                    filterStatus === 'connected' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                  }`}
                >
                  Online ({totalOnline})
                </button>
                <button
                  onClick={() => setFilterStatus('offline')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                    filterStatus === 'offline' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                  }`}
                >
                  Offline ({totalOffline})
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] font-mono uppercase text-slate-400">
                  <th className="py-3 px-3">Customer Name</th>
                  <th className="py-3 px-3">Email</th>
                  <th className="py-3 px-3">Phone</th>
                  <th className="py-3 px-3">Device</th>
                  <th className="py-3 px-3">Platform</th>
                  <th className="py-3 px-3">Last Seen</th>
                  <th className="py-3 px-3">Connection Status</th>
                  <th className="py-3 px-3">Permission Status</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredDevices.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-500 text-xs">
                      No matching devices or customers enrolled yet.
                    </td>
                  </tr>
                ) : (
                  filteredDevices.map((d) => {
                    const isOnline = isDeviceTrulyOnline(d);
                    const perms = d.permissions;
                    const permStatus = d.permissionStatus || {
                      photos: perms.photos_videos?.status === 'allowed' ? 'granted' : 'denied',
                      camera: perms.camera?.status === 'allowed' ? 'granted' : 'denied',
                      microphone: perms.microphone?.status === 'allowed' ? 'granted' : 'denied',
                      files: perms.files?.status === 'allowed' ? 'granted' : 'denied',
                    };

                    return (
                      <tr
                        key={d.deviceId}
                        onClick={() => {
                          setSelectedAdminDeviceId(d.deviceId);
                          setViewMode('command_center');
                        }}
                        className="hover:bg-slate-800/50 cursor-pointer transition-colors group"
                      >
                        <td className="py-3 px-3">
                          <div className="font-semibold text-white group-hover:text-cyan-400 transition-colors">
                            {d.userName || d.submittedDetails?.customerName || 'Mobile Customer'}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            UID: {d.userId ? d.userId.substring(0, 10) + '...' : 'pending'}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-slate-300 font-mono text-[11px]">
                          {d.userEmail || d.submittedDetails?.customerEmail || '—'}
                        </td>
                        <td className="py-3 px-3 text-slate-300 font-mono text-[11px]">
                          {d.userPhone || d.submittedDetails?.customerPhone || '—'}
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-medium text-slate-200">{d.deviceName}</div>
                          <div className="text-[10px] text-slate-400 truncate max-w-[140px]">{d.deviceModel}</div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-md bg-slate-950 text-slate-300 border border-slate-800 text-[10px] font-mono">
                            {d.platform || 'Android'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-400 font-mono text-[10px]">
                          {new Date(d.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold ${
                              isOnline
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                : 'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                              }`}
                            />
                            {isOnline ? 'Online' : 'Offline'}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex flex-wrap items-center gap-1">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-medium ${
                                permStatus.camera === 'granted'
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/80'
                                  : 'bg-slate-950 text-slate-500 border border-slate-800'
                              }`}
                            >
                              Cam: {permStatus.camera}
                            </span>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-medium ${
                                permStatus.microphone === 'granted'
                                  ? 'bg-amber-950 text-amber-300 border border-amber-800/80'
                                  : 'bg-slate-950 text-slate-500 border border-slate-800'
                              }`}
                            >
                              Mic: {permStatus.microphone}
                            </span>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-medium ${
                                permStatus.photos === 'granted'
                                  ? 'bg-blue-950 text-blue-300 border border-blue-800/80'
                                  : 'bg-slate-950 text-slate-500 border border-slate-800'
                              }`}
                            >
                              Photos: {permStatus.photos}
                            </span>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-medium ${
                                permStatus.files === 'granted'
                                  ? 'bg-indigo-950 text-indigo-300 border border-indigo-800/80'
                                  : 'bg-slate-950 text-slate-500 border border-slate-800'
                              }`}
                            >
                              Files: {permStatus.files}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedAdminDeviceId(d.deviceId);
                              setViewMode('command_center');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-indigo-600/80 hover:bg-indigo-500 text-white font-medium text-[11px] transition-colors"
                          >
                            Open Details
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Live Customer Testing Flow Launcher Card */}
      <div className="bg-gradient-to-r from-blue-950/80 via-slate-900 to-indigo-950/80 border border-blue-800/60 rounded-3xl p-4 sm:p-5 mb-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping"></span>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-cyan-400" />
                Live Customer Testing Flow (Published Link Access)
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-semibold uppercase tracking-wider border border-cyan-500/30">
                Dual-Role Mechanism
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Open this link on your mobile phone or share it with anyone. As soon as the customer grants permissions or submits their details, this dashboard updates instantly in real-time.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <div className="flex items-center gap-2 p-1.5 bg-slate-950/90 border border-slate-700/80 rounded-xl text-xs font-mono text-cyan-300 max-w-xs sm:max-w-md truncate">
              <span className="truncate pl-2">
                {typeof window !== 'undefined' ? `${window.location.origin}/?role=customer` : '/?role=customer'}
              </span>
              <button
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    navigator.clipboard.writeText(`${window.location.origin}/?role=customer`);
                    setCustomerLinkCopied(true);
                    setTimeout(() => setCustomerLinkCopied(false), 2000);
                  }
                }}
                className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-sans text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
              >
                {customerLinkCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{customerLinkCopied ? 'Link Copied!' : 'Copy Customer Link'}</span>
              </button>
            </div>

            <button
              onClick={() => setIsQrModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <QrCode className="w-4 h-4 text-cyan-400" />
              <span>Show QR Code</span>
            </button>
          </div>
        </div>

        {/* Live sync pulse banner */}
        <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
          <div className="flex items-center gap-2">
            {activeMobileDevice ? (
              <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-800/80">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Active Mobile Client Connected: {activeMobileDevice.deviceName} ({activeMobileDevice.deviceModel})
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-amber-300 bg-amber-950/40 px-2.5 py-1 rounded-lg border border-amber-800/60">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                Awaiting mobile test device to connect via link... (Auto-polling every 1.2s)
              </span>
            )}
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            Auto-Sync Rate: 1.2s • Zero-Trust Compliance Enabled
          </span>
        </div>
      </div>

      {/* Main Grid: Device Fleet Column + Command Center Column (Detail Page) */}
      {viewMode === 'command_center' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
        {/* Left Column: Device Fleet (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 flex flex-col h-full shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-cyan-400" />
                Enrolled Devices ({filteredDevices.length})
              </h2>
              <span className="text-[10px] flex items-center gap-1 font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/80">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Live Cloud Sync
              </span>
            </div>

            {/* Search and status filter */}
            <div className="space-y-2 mb-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter by device or model..."
                  value={deviceSearch}
                  onChange={(e) => setDeviceSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800">
                <button
                  onClick={() => setFilterStatus('all')}
                  className={`flex-1 py-1 rounded-lg text-xs font-medium transition-colors ${
                    filterStatus === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                  }`}
                >
                  All ({allDevices.length})
                </button>
                <button
                  onClick={() => setFilterStatus('connected')}
                  className={`flex-1 py-1 rounded-lg text-xs font-medium transition-colors ${
                    filterStatus === 'connected' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                  }`}
                >
                  Online ({totalOnline})
                </button>
                <button
                  onClick={() => setFilterStatus('offline')}
                  className={`flex-1 py-1 rounded-lg text-xs font-medium transition-colors ${
                    filterStatus === 'offline' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                  }`}
                >
                  Offline ({totalOffline})
                </button>
              </div>
            </div>

            {/* Devices Scroll List */}
            <div className="space-y-2.5 overflow-y-auto flex-1 max-h-[600px] pr-1">
              {filteredDevices.map((d) => {
                const isSelected = d.deviceId === device.deviceId;
                const isConn = d.connectionStatus === 'connected';

                return (
                  <button
                    key={d.deviceId}
                    onClick={() => setSelectedAdminDeviceId(d.deviceId)}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all ${
                      isSelected
                        ? 'bg-indigo-950/40 border-indigo-500 shadow-md ring-1 ring-indigo-500/30'
                        : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex flex-col truncate max-w-[170px]">
                        <span className="font-semibold text-xs text-white truncate">
                          {d.deviceName}
                        </span>
                        {d.deviceId.startsWith('kdc-mob') && (
                          <span className="text-[9px] text-cyan-400 font-mono font-medium">
                            ★ Mobile Live Client
                          </span>
                        )}
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${
                          isConn
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isConn ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                          }`}
                        ></span>
                        <span>{isConn ? 'Online' : 'Offline'}</span>
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 truncate mb-1">
                      {d.deviceModel}
                    </div>

                    {(d.userPhone || d.userEmail) && (
                      <div className="text-[10px] text-emerald-400/90 font-mono truncate mb-2">
                        ID: {d.userPhone || d.userEmail}
                      </div>
                    )}

                    {/* Quick Perm Badge Row */}
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 border-t border-slate-800/80 pt-2">
                      <div className="flex items-center gap-1">
                        <Camera
                          className={`w-3 h-3 ${
                            d.permissions.camera.status === 'allowed'
                              ? 'text-emerald-400'
                              : 'text-slate-600'
                          }`}
                        />
                        <Mic
                          className={`w-3 h-3 ${
                            d.permissions.microphone.status === 'allowed'
                              ? 'text-amber-400'
                              : 'text-slate-600'
                          }`}
                        />
                        <Image
                          className={`w-3 h-3 ${
                            d.permissions.photos_videos.status === 'allowed'
                              ? 'text-blue-400'
                              : 'text-slate-600'
                          }`}
                        />
                        <FolderOpen
                          className={`w-3 h-3 ${
                            d.permissions.files.status === 'allowed'
                              ? 'text-indigo-400'
                              : 'text-slate-600'
                          }`}
                        />
                      </div>
                      <span className="ml-auto font-mono text-[10px] text-slate-500">
                        {d.batteryLevel}%
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Active Device Command Console (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          {/* Notification banner */}
          {requestNotification && (
            <div className="p-3 rounded-2xl bg-cyan-950/80 border border-cyan-800 text-cyan-200 text-xs flex items-center gap-2 animate-in fade-in">
              <Radio className="w-4 h-4 text-cyan-400 animate-pulse shrink-0" />
              <span>{requestNotification}</span>
            </div>
          )}

          {/* Active Device Header Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-white">
                    {device.deviceName}
                  </h2>
                  <span className="text-xs font-mono text-cyan-400 bg-cyan-950 border border-cyan-800 px-2 py-0.5 rounded-lg">
                    {device.deviceId}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Owner: <strong className="text-slate-200">{device.userName}</strong> ({device.userEmail || device.userPhone})
                </p>
              </div>

              {/* Live Status & Battery */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
                  {isSelectedConnected ? (
                    <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <WifiOff className="w-3.5 h-3.5 text-rose-400" />
                  )}
                  <span>{isSelectedConnected ? 'Connected' : 'Offline'}</span>
                </div>

                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
                  {device.isCharging ? (
                    <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Battery className="w-3.5 h-3.5 text-slate-400" />
                  )}
                  <span>{device.batteryLevel}%</span>
                </div>
              </div>
            </div>

            {/* Customer Submitted Details Section */}
            <div className="pt-4 pb-1">
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 shadow-inner">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wider">
                    <User className="w-3.5 h-3.5" />
                    <span>Customer Submitted Identification</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Updated: {new Date(device.updatedAt || device.lastSeen).toLocaleTimeString()}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-0.5">Customer Name</span>
                    <strong className="text-white font-medium text-xs">
                      {device.submittedDetails?.customerName || device.userName || 'Mobile Tester'}
                    </strong>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block mb-0.5">Phone / Customer ID</span>
                    <span className="font-mono text-cyan-300 font-semibold">
                      {device.submittedDetails?.customerPhone || device.userPhone || '+880 1712-345678'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block mb-0.5">Email Address</span>
                    <span className="text-slate-300 font-mono text-[11px]">
                      {device.submittedDetails?.customerEmail || device.userEmail || 'nayemchow000@gmail.com'}
                    </span>
                  </div>
                </div>

                {device.submittedDetails?.notes && (
                  <div className="mt-2.5 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center gap-1.5">
                    <span className="text-slate-500">Session Status:</span>
                    <span className="text-cyan-400 font-medium">{device.submittedDetails.notes}</span>
                  </div>
                )}
              </div>
            </div>

            {/* MANDATORY SECTION 7 REQUIREMENT: PERMISSION STATUS MATRIX */}
            {/* "The dashboard must never display 'Allowed' unless the client application has actually reported that permission as granted." */}
            <div className="pt-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-indigo-400" />
                  <span>Real-Time Client Permission Status</span>
                </div>
                <span className="text-[10px] text-slate-400">
                  Synchronized with Android OS
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* Photos / Videos */}
                <div
                  className={`p-3 rounded-2xl border ${
                    perms.photos_videos.status === 'allowed'
                      ? 'bg-emerald-950/20 border-emerald-800/60'
                      : 'bg-slate-950/40 border-slate-800/60'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span>Photos & Videos</span>
                    <Image className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    {perms.photos_videos.status === 'allowed' ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                        <span className="text-emerald-400">Allowed</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-slate-500" />
                        <span className="text-slate-400">Not Allowed</span>
                      </>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    {perms.photos_videos.status === 'allowed'
                      ? perms.photos_videos.scope === 'full'
                        ? 'Full Library Scope'
                        : 'Selected Items Only'
                      : 'Zero access'}
                  </div>
                </div>

                {/* Camera */}
                <div
                  className={`p-3 rounded-2xl border ${
                    perms.camera.status === 'allowed'
                      ? 'bg-emerald-950/20 border-emerald-800/60'
                      : 'bg-slate-950/40 border-slate-800/60'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span>Camera</span>
                    <Camera className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    {perms.camera.status === 'allowed' ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                        <span className="text-emerald-400">Allowed</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-slate-500" />
                        <span className="text-slate-400">Not Allowed</span>
                      </>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    {perms.camera.status === 'allowed' ? 'Consent verified' : 'Access blocked'}
                  </div>
                </div>

                {/* Microphone */}
                <div
                  className={`p-3 rounded-2xl border ${
                    perms.microphone.status === 'allowed'
                      ? 'bg-emerald-950/20 border-emerald-800/60'
                      : 'bg-slate-950/40 border-slate-800/60'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span>Microphone</span>
                    <Mic className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    {perms.microphone.status === 'allowed' ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                        <span className="text-emerald-400">Allowed</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-slate-500" />
                        <span className="text-slate-400">Not Allowed</span>
                      </>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    {perms.microphone.status === 'allowed' ? 'Voice stream ready' : 'Access blocked'}
                  </div>
                </div>

                {/* Files */}
                <div
                  className={`p-3 rounded-2xl border ${
                    perms.files.status === 'allowed'
                      ? 'bg-emerald-950/20 border-emerald-800/60'
                      : 'bg-slate-950/40 border-slate-800/60'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span>Files & SAF</span>
                    <FolderOpen className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    {perms.files.status === 'allowed' ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                        <span className="text-emerald-400">Allowed</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-slate-500" />
                        <span className="text-slate-400">Not Allowed</span>
                      </>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    {perms.files.status === 'allowed' ? 'Storage picker authorized' : 'Access blocked'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Center Tabs */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg flex-1 flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setAdminTab('overview')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                    adminTab === 'overview'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-950 text-slate-400 hover:text-white'
                  }`}
                >
                  Remote Actions
                </button>
                <button
                  onClick={() => setAdminTab('media')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                    adminTab === 'media'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-950 text-slate-400 hover:text-white'
                  }`}
                >
                  Authorized Media ({perms.photos_videos.status === 'allowed' ? mediaItems.length : 0})
                </button>
                <button
                  onClick={() => setAdminTab('files')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                    adminTab === 'files'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-950 text-slate-400 hover:text-white'
                  }`}
                >
                  Authorized Files ({perms.files.status === 'allowed' ? files.length : 0})
                </button>
                <button
                  onClick={() => setAdminTab('audit')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                    adminTab === 'audit'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-950 text-slate-400 hover:text-white'
                  }`}
                >
                  Audit Trail
                </button>
              </div>

              {/* Active Session Badge */}
              {activeSession && (
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-300 text-xs font-semibold animate-pulse">
                    <Radio className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Live {activeSession.type.toUpperCase()} Stream</span>
                  </span>
                  <button
                    onClick={endSession}
                    className="px-2.5 py-1 rounded-xl bg-rose-800 hover:bg-rose-700 text-white text-xs font-semibold"
                  >
                    Disconnect
                  </button>
                </div>
              )}
            </div>

            {/* TAB: REMOTE ACTIONS */}
            {adminTab === 'overview' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Action 1: Request Camera */}
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Camera className="w-5 h-5 text-emerald-400" />
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                            perms.camera.status === 'allowed'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : 'bg-slate-900 text-slate-500'
                          }`}
                        >
                          {perms.camera.status === 'allowed' ? 'Permitted' : 'Not Allowed'}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-white mb-1">Request Camera Stream</h4>
                      <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
                        Dispatches a consent request prompt to the user's Android device.
                      </p>
                    </div>

                    <button
                      onClick={() => handleRequestAccess('camera')}
                      disabled={!isSelectedConnected}
                      className="w-full py-2 px-3 rounded-xl bg-emerald-600/90 hover:bg-emerald-600 disabled:opacity-40 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>Request Camera</span>
                    </button>
                  </div>

                  {/* Action 2: Request Audio */}
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Mic className="w-5 h-5 text-amber-400" />
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                            perms.microphone.status === 'allowed'
                              ? 'bg-amber-950 text-amber-300 border border-amber-800'
                              : 'bg-slate-900 text-slate-500'
                          }`}
                        >
                          {perms.microphone.status === 'allowed' ? 'Permitted' : 'Not Allowed'}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-white mb-1">Request Audio Session</h4>
                      <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
                        Requests voice channel with user for hands-free technical discussion.
                      </p>
                    </div>

                    <button
                      onClick={() => handleRequestAccess('audio')}
                      disabled={!isSelectedConnected}
                      className="w-full py-2 px-3 rounded-xl bg-amber-600/90 hover:bg-amber-600 disabled:opacity-40 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>Request Audio</span>
                    </button>
                  </div>

                  {/* Action 3: Inspect Files */}
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <FolderOpen className="w-5 h-5 text-indigo-400" />
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                            perms.files.status === 'allowed'
                              ? 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                              : 'bg-slate-900 text-slate-500'
                          }`}
                        >
                          {perms.files.status === 'allowed' ? 'Permitted' : 'Not Allowed'}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-white mb-1">Inspect SAF Files</h4>
                      <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
                        Review user-provided diagnostic logs, speedtests, and bug reports.
                      </p>
                    </div>

                    <button
                      onClick={() => setAdminTab('files')}
                      disabled={perms.files.status !== 'allowed'}
                      className="w-full py-2 px-3 rounded-xl bg-indigo-600/90 hover:bg-indigo-600 disabled:opacity-40 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <span>Open Files Tab</span>
                    </button>
                  </div>
                </div>

                {/* Live Remote Viewfinder (when Camera or Audio is streaming) */}
                {activeSession && (
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                          Live Remote Viewfinder
                        </h4>
                      </div>
                      <span className="text-[11px] font-mono text-cyan-400">
                        Active since: {activeSession.startedAt}
                      </span>
                    </div>

                    <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center">
                      <div className="text-center p-6">
                        <Camera className="w-10 h-10 text-emerald-400 mx-auto mb-2 animate-pulse" />
                        <h5 className="text-sm font-bold text-white">Live Stream Active</h5>
                        <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                          Client has granted live diagnostic view from {device.deviceName}. All
                          telemetry conforms to Zero-Trust constraints.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB: MEDIA */}
            {adminTab === 'media' && (
              <div className="space-y-3">
                {perms.photos_videos.status !== 'allowed' ? (
                  <div className="p-8 text-center bg-slate-950 rounded-2xl border border-slate-800 text-slate-400 text-xs">
                    Client has not permitted Photos & Videos access. No content is exposed.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {mediaItems.map((m) => (
                      <div
                        key={m.id}
                        className="bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 p-2 text-xs"
                      >
                        <img
                          src={m.url}
                          alt={m.name}
                          className="w-full aspect-video object-cover rounded-xl mb-2"
                        />
                        <div className="font-semibold text-white truncate">{m.name}</div>
                        <div className="text-[10px] text-slate-400">
                          {m.resolution} • {(m.size / (1024 * 1024)).toFixed(2)} MB
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB: FILES */}
            {adminTab === 'files' && (
              <div className="space-y-2">
                {perms.files.status !== 'allowed' ? (
                  <div className="p-8 text-center bg-slate-950 rounded-2xl border border-slate-800 text-slate-400 text-xs">
                    Client has not authorized file storage access.
                  </div>
                ) : (
                  files.map((f) => (
                    <div
                      key={f.id}
                      className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-[10px] font-bold px-2 py-1 bg-indigo-950 text-indigo-300 rounded border border-indigo-800">
                          {f.extension}
                        </span>
                        <div>
                          <div className="font-semibold text-white">{f.name}</div>
                          <div className="text-[11px] text-slate-400">{f.summary}</div>
                        </div>
                      </div>
                      <span className="text-slate-400 font-mono text-[10px]">
                        {(f.size / 1024).toFixed(1)} KB
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB: AUDIT */}
            {adminTab === 'audit' && (
              <div className="space-y-2 overflow-y-auto max-h-[500px]">
                {auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-bold text-indigo-400">[{log.actor}]</span>
                        <span className="font-semibold text-white">{log.action}</span>
                      </div>
                      <p className="text-slate-400 text-[11px]">{log.details}</p>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono shrink-0">
                      {log.timestamp}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      )}
    </div>
  );
};
