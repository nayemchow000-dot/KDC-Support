export interface DetectedDeviceInfo {
  deviceId: string;
  deviceName: string;
  deviceModel: string;
  androidVersion: string;
  isMobile: boolean;
  screenResolution: string;
}

export function getOrCreateDeviceId(): string {
  const STORAGE_KEY = 'kdc_client_device_id_v2';
  let id = localStorage.getItem(STORAGE_KEY);
  if (!id) {
    const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
    const prefix = isMobile ? 'mob' : 'desk';
    id = `kdc-${prefix}-${Math.random().toString(36).substring(2, 7)}-${Date.now().toString().slice(-4)}`;
    localStorage.setItem(STORAGE_KEY, id);
  }
  return id;
}

export function detectCurrentDevice(): DetectedDeviceInfo {
  const ua = navigator.userAgent || '';
  const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
  const deviceId = getOrCreateDeviceId();
  const screenResolution = `${window.screen?.width || window.innerWidth} x ${window.screen?.height || window.innerHeight}`;

  let deviceName = 'Connected Client';
  let deviceModel = 'Standard Browser';
  let androidVersion = 'Web Client';

  if (/Android/i.test(ua)) {
    // Attempt to extract Android model & version
    const androidMatch = ua.match(/Android\s([0-9.]+)/i);
    const osVer = androidMatch ? `Android ${androidMatch[1]}` : 'Android';
    androidVersion = `${osVer} (API ${androidMatch ? Math.round(parseFloat(androidMatch[1]) + 20) : '34'})`;

    if (/SM-|Samsung/i.test(ua)) {
      const modelMatch = ua.match(/(SM-[A-Z0-9]+)/i);
      deviceName = modelMatch ? `Samsung ${modelMatch[1]}` : 'Samsung Galaxy Device';
      deviceModel = `${deviceName} (${osVer})`;
    } else if (/Xiaomi|Redmi|POCO/i.test(ua)) {
      const modelMatch = ua.match(/(Redmi[^;)]+|POCO[^;)]+|MI\s[^;)]+)/i);
      deviceName = modelMatch ? modelMatch[0] : 'Xiaomi Redmi Device';
      deviceModel = `${deviceName} (MIUI / HyperOS, ${osVer})`;
    } else if (/Pixel/i.test(ua)) {
      const modelMatch = ua.match(/(Pixel[^;)]+)/i);
      deviceName = modelMatch ? modelMatch[0] : 'Google Pixel Device';
      deviceModel = `${deviceName} (Stock ${osVer})`;
    } else if (/OnePlus/i.test(ua)) {
      deviceName = 'OnePlus Smartphone';
      deviceModel = `OnePlus (OxygenOS, ${osVer})`;
    } else if (/Vivo/i.test(ua)) {
      deviceName = 'Vivo Smartphone';
      deviceModel = `Vivo (Funtouch OS, ${osVer})`;
    } else if (/Oppo/i.test(ua)) {
      deviceName = 'Oppo Smartphone';
      deviceModel = `Oppo (ColorOS, ${osVer})`;
    } else {
      deviceName = 'Android Smartphone';
      deviceModel = `Android Mobile (${osVer})`;
    }
  } else if (/iPhone/i.test(ua)) {
    deviceName = 'Apple iPhone';
    deviceModel = 'iPhone (iOS)';
    const iosMatch = ua.match(/OS\s([0-9_]+)/i);
    androidVersion = iosMatch ? `iOS ${iosMatch[1].replace(/_/g, '.')}` : 'iOS';
  } else if (/iPad/i.test(ua)) {
    deviceName = 'Apple iPad';
    deviceModel = 'iPad (iPadOS)';
    androidVersion = 'iPadOS';
  } else if (/Windows/i.test(ua)) {
    deviceName = 'Windows PC Workstation';
    deviceModel = 'Desktop PC (Windows 11/10)';
    androidVersion = 'Windows NT';
  } else if (/Macintosh|Mac OS/i.test(ua)) {
    deviceName = 'Apple Mac';
    deviceModel = 'macOS Workstation';
    androidVersion = 'macOS';
  } else if (/Linux/i.test(ua)) {
    deviceName = 'Linux System';
    deviceModel = 'Linux Desktop';
    androidVersion = 'GNU/Linux';
  }

  return {
    deviceId,
    deviceName,
    deviceModel,
    androidVersion,
    isMobile,
    screenResolution,
  };
}
