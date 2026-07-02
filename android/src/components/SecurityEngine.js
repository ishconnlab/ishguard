export function scanDevicePerformance(batteryLevel, memoryInfo) {
  const results = {
    battery: { level: batteryLevel, status: 'safe' },
    memory: { available: memoryInfo?.available || 0, total: memoryInfo?.total || 0, status: 'safe' },
    storage: { status: 'unknown' },
    overall: 'safe',
  };

  if (batteryLevel < 20) results.battery.status = 'warning';
  if (batteryLevel < 10) results.battery.status = 'risk';

  if (memoryInfo && memoryInfo.total > 0) {
    const usage = ((memoryInfo.total - memoryInfo.available) / memoryInfo.total) * 100;
    results.memory.usagePercent = Math.round(usage);
    if (usage > 85) results.memory.status = 'warning';
    if (usage > 95) results.memory.status = 'risk';
  }

  const statuses = [results.battery.status, results.memory.status, results.storage.status];
  if (statuses.some(s => s === 'risk')) results.overall = 'risk';
  else if (statuses.some(s => s === 'warning')) results.overall = 'warning';

  return results;
}

export function checkPermissions(installedApps) {
  const riskyPermissions = [
    'READ_SMS', 'RECEIVE_SMS', 'READ_CONTACTS',
    'CAMERA', 'RECORD_AUDIO', 'ACCESS_FINE_LOCATION',
    'ACCESS_BACKGROUND_LOCATION', 'READ_CALL_LOG',
    'PROCESS_OUTGOING_CALLS', 'BIND_ACCESSIBILITY_SERVICE',
  ];

  const findings = [];
  for (const app of (installedApps || [])) {
    for (const perm of (app.permissions || [])) {
      if (riskyPermissions.includes(perm)) {
        findings.push({
          app: app.name,
          permission: perm,
          severity: perm.includes('BACKGROUND') || perm.includes('BIND_ACCESSIBILITY') ? 'risk' : 'warning',
        });
      }
    }
  }
  return findings;
}

export function networkSafetyCheck(networkInfo) {
  if (!networkInfo) return { status: 'unknown', message: 'Unable to determine network state' };
  if (networkInfo.isConnected && !networkInfo.isWifi) {
    return { status: 'warning', message: 'Using mobile data — VPN recommended for sensitive activities' };
  }
  if (networkInfo.isWifi && networkInfo.ssid === 'Unknown') {
    return { status: 'warning', message: 'Connected to unknown WiFi network' };
  }
  return { status: 'safe', message: 'Network connection appears secure' };
}

export function scanBluetoothDevices() {
  return {
    devices: [
      { name: 'Sample Bluetooth Device', connected: true },
      { name: 'Wireless Headphones', connected: false },
      { name: 'Smart Watch X2', connected: false },
    ],
    count: 3,
    connected: 1,
    status: 'available',
    timestamp: new Date().toISOString(),
  };
}

export function getBluetoothTransferDirs() {
  return [
    '/storage/emulated/0/Download/Bluetooth/',
    '/storage/emulated/0/Bluetooth/',
    '/storage/emulated/0/Android/data/com.android.bluetooth/',
  ];
}

export function analyzeBehavior(data) {
  const findings = [];
  let riskScore = 0;

  if (data.batteryStatus === 'warning' || data.batteryStatus === 'risk') {
    riskScore += 10;
    findings.push({ type: 'warning', title: 'Low Battery', detail: `Battery at ${data.batteryLevel}%`, recommendation: 'Charge your device' });
  }
  if (data.memoryUsage > 85) {
    riskScore += 15;
    findings.push({ type: 'warning', title: 'High Memory Usage', detail: `Memory at ${data.memoryUsage}%`, recommendation: 'Close unused apps' });
  }
  if (data.networkStatus === 'warning') {
    riskScore += 20;
    findings.push({ type: 'warning', title: 'Unsecured Network', detail: data.networkMessage, recommendation: 'Connect to secure WiFi or enable VPN' });
  }
  const permRisks = (data.permissionFindings || []).filter(p => p.severity === 'risk').length;
  if (permRisks > 3) {
    riskScore += 15;
    findings.push({ type: 'warning', title: 'Excessive Permissions', detail: `${permRisks} high-risk permissions granted`, recommendation: 'Review and revoke unnecessary permissions' });
  }

  return {
    riskScore: Math.min(100, riskScore),
    riskLevel: riskScore >= 50 ? 'high' : riskScore >= 20 ? 'medium' : 'low',
    findings,
    summary: riskScore === 0 ? 'Device is in good health' : `${findings.length} issue${findings.length > 1 ? 's' : ''} found`,
  };
}
