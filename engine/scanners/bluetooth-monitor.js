import { scanFile } from './malware-scanner.js';
import { quarantineFile } from './quarantine.js';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const BT_TRANSFER_DIRS = [
  path.join(os.homedir(), 'Downloads', 'Bluetooth'),
  path.join(os.homedir(), 'Documents', 'Bluetooth'),
  path.join(os.tmpdir(), 'Bluetooth'),
  path.join(os.homedir(), 'AppData', 'Local', 'Temp', 'Bluetooth'),
];

function exec(cmd) {
  try {
    const { execSync } = require('child_process');
    return execSync(cmd, { encoding: 'utf8', timeout: 5000 }).trim();
  } catch { return ''; }
}

export function scanBluetoothDevices() {
  const devices = [];
  try {
    if (process.platform === 'win32') {
      const output = exec('powershell -Command "Get-PnpDevice -Class Bluetooth | Select-Object Status, FriendlyName | ConvertTo-Json"');
      if (output) {
        const parsed = JSON.parse(output);
        const arr = Array.isArray(parsed) ? parsed : [parsed];
        arr.forEach(d => {
          if (d && d.FriendlyName) {
            devices.push({
              name: d.FriendlyName,
              connected: d.Status === 'OK',
              status: d.Status === 'OK' ? 'connected' : 'disconnected',
            });
          }
        });
      }
    }
  } catch {}
  return {
    devices,
    count: devices.length,
    connected: devices.filter(d => d.connected).length,
    status: devices.length > 0 ? 'available' : 'none',
    timestamp: new Date().toISOString(),
  };
}

export function getBluetoothTransferDirs() {
  const existing = BT_TRANSFER_DIRS.filter(d => {
    try { return fs.statSync(d).isDirectory(); } catch { return false; }
  });
  if (existing.length === 0) {
    const fallback = path.join(os.homedir(), 'Downloads');
    try {
      if (fs.statSync(fallback).isDirectory()) existing.push(fallback);
    } catch {}
  }
  return existing;
}

export function scanBluetoothTransferDir(dirPath, knownFiles) {
  knownFiles = knownFiles || new Set();
  const results = { newFiles: [], threats: [], safeFiles: [], errors: [] };
  try {
    if (!fs.statSync(dirPath).isDirectory()) return results;
    const files = fs.readdirSync(dirPath);
    files.forEach(file => {
      const fullPath = path.join(dirPath, file);
      try {
        const stat = fs.statSync(fullPath);
        if (!stat.isFile()) return;
        const key = `${file}_${stat.size}_${stat.mtimeMs}`;
        if (knownFiles.has(key)) return;
        knownFiles.add(key);
        results.newFiles.push({ file, path: fullPath, size: stat.size, modified: stat.mtimeMs });
      } catch {}
    });
  } catch {
    results.errors.push(`Cannot access directory: ${dirPath}`);
  }
  return results;
}

export async function scanBluetoothFile(filePath) {
  try {
    const result = await scanFile(filePath);
    const threatCount = (result.threats || result.detections || []).length;
    const isThreat = result.isThreat || result.isInfected || threatCount > 0;
    return {
      file: path.basename(filePath),
      path: filePath,
      size: (() => { try { return fs.statSync(filePath).size; } catch { return 0; } })(),
      isThreat,
      threatCount,
      threats: result.threats || result.detections || [],
      signatures: result.signatures || [],
      isSuspicious: result.isSuspicious || false,
      entropy: result.entropy || null,
      verdict: isThreat ? 'threat' : 'safe',
      scannedAt: new Date().toISOString(),
    };
  } catch (err) {
    return { file: path.basename(filePath), path: filePath, isThreat: false, error: err.message, verdict: 'error' };
  }
}

export function quarantineBluetoothFile(filePath) {
  try {
    const result = quarantineFile(filePath);
    return { success: true, message: `File quarantined: ${path.basename(filePath)}`, result };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

export function handleBluetoothThreat(filePath, action) {
  switch (action) {
    case 'delete':
      try {
        fs.unlinkSync(filePath);
        return { success: true, action: 'deleted', message: `File deleted: ${path.basename(filePath)}` };
      } catch (err) {
        return { success: false, action: 'delete', message: err.message };
      }
    case 'quarantine':
      return quarantineBluetoothFile(filePath);
    case 'cancel':
    default:
      return { success: true, action: 'cancelled', message: 'Transfer cancelled – file left in place' };
  }
}

export { BT_TRANSFER_DIRS };
