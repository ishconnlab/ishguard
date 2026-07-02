import os from 'os';
import { execSync } from 'child_process';

export function scanNetwork() {
  const interfaces = os.networkInterfaces();
  const results = {
    interfaces: [],
    publicWifi: false,
    wifiSecured: null,
    firewallActive: null,
    defaultGateway: null,
    openPorts: [],
    status: 'safe'
  };

  for (const [name, addrs] of Object.entries(interfaces)) {
    if (!addrs) continue;
    for (const addr of addrs) {
      if (addr.family === 'IPv4' && !addr.internal) {
        results.interfaces.push({
          name,
          address: addr.address,
          netmask: addr.netmask,
          mac: addr.mac,
          isPublic: isPublicIP(addr.address)
        });
        if (isPublicIP(addr.address)) {
          results.publicWifi = true;
        }
      }
    }
  }

  if (process.platform === 'win32' && results.interfaces.length > 0) {
    try {
      const fw = execSync('netsh advfirewall show allprofiles state', { encoding: 'utf8', timeout: 3000 });
      results.firewallActive = fw.toLowerCase().includes('on');
    } catch {
      results.firewallActive = null;
    }
    try {
      const gw = execSync('ipconfig | findstr "Default Gateway"', { encoding: 'utf8', timeout: 3000 });
      const match = gw.match(/\d+\.\d+\.\d+\.\d+/);
      if (match) results.defaultGateway = match[0];
    } catch {}
  }

  if (results.publicWifi) results.status = 'warning';
  else if (results.firewallActive === false) results.status = 'warning';

  return results;
}

function isPublicIP(ip) {
  const parts = ip.split('.').map(Number);
  if (parts[0] === 10) return false;
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return false;
  if (parts[0] === 192 && parts[1] === 168) return false;
  if (parts[0] === 127) return false;
  if (parts[0] === 100 && parts[1] >= 64 && parts[1] <= 127) return false;
  if (parts[0] === 169 && parts[1] === 254) return false;
  return true;
}

export function getWifiSecurity() {
  try {
    if (process.platform === 'win32') {
      const output = execSync('netsh wlan show interfaces', { encoding: 'utf8', timeout: 5000 });
      const lines = output.split('\n');
      let ssid = 'Unknown';
      let auth = 'Unknown';
      let signal = '0';
      for (const line of lines) {
        const colonIdx = line.indexOf(':');
        if (colonIdx === -1) continue;
        const key = line.slice(0, colonIdx).trim();
        const val = line.slice(colonIdx + 1).trim();
        if (/^SSID/i.test(key) || /^名称/i.test(key)) ssid = val;
        if (/^Authentication/i.test(key) || /^身份验证/i.test(key)) auth = val;
        if (/^Signal/i.test(key) || /^信号/i.test(key)) signal = val.replace('%', '').trim();
      }
      return { ssid, authentication: auth, secured: auth !== 'Open', signal: parseInt(signal) || 0 };
    }
  } catch {}
  return { ssid: 'Unknown', authentication: 'Unknown', secured: false, signal: 0 };
}
