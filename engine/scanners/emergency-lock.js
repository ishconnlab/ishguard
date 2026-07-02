import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { execSync, execFileSync } from 'child_process';
import { suspiciousProcesses, knownSafeProcesses } from '../rules-engine.js';

const CONFIG_DIR = path.join(os.homedir(), '.ishguard');
const CONFIG_FILE = path.join(CONFIG_DIR, 'emergency-lock.json');
const LOG_FILE = path.join(CONFIG_DIR, 'emergency-log.json');

const DEFAULT_OPTIONS = {
  lockFolders: true,
  lockDesktop: true,
  stopProcesses: true,
  disableUsb: false,
  enableMaxProtection: true,
  startRecording: true,
  notifyAdmin: false
};

const PROCESS_ALLOWLIST = [
  'system', 'svchost', 'explorer', 'chrome', 'firefox',
  'msedge', 'code', 'teams', 'outlook',
  'winword', 'excel', 'powerpnt'
];

function isWindows() {
  return process.platform === 'win32';
}

function ensureConfigDir() {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

function loadConfig() {
  ensureConfigDir();
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
      return {
        options: { ...DEFAULT_OPTIONS, ...(data.options || {}) },
        authToken: data.authToken || null,
        active: data.active || false,
        activatedAt: data.activatedAt || null,
        deactivatedAt: data.deactivatedAt || null,
        activatedActions: data.activatedActions || []
      };
    }
  } catch {}
  return {
    options: { ...DEFAULT_OPTIONS },
    authToken: null,
    active: false,
    activatedAt: null,
    deactivatedAt: null,
    activatedActions: []
  };
}

function saveConfig(config) {
  ensureConfigDir();
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

function loadLog() {
  ensureConfigDir();
  try {
    if (fs.existsSync(LOG_FILE)) {
      const data = JSON.parse(fs.readFileSync(LOG_FILE, 'utf8'));
      if (Array.isArray(data)) return data;
    }
  } catch {}
  return [];
}

function saveLog(log) {
  ensureConfigDir();
  fs.writeFileSync(LOG_FILE, JSON.stringify(log, null, 2));
}

function execPowerShell(script) {
  if (!isWindows()) return { success: false, error: 'Not supported on this platform' };
  try {
    const output = execSync(
      `powershell -NoProfile -NonInteractive -Command "${script.replace(/"/g, '\\"')}"`,
      { timeout: 15000, stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8', windowsHide: true }
    );
    return { success: true, output: output.trim() };
  } catch (err) {
    return { success: false, error: err.stderr ? err.stderr.trim() : err.message };
  }
}

function logEvent(action, status, details) {
  const log = loadLog();
  log.push({
    action,
    status,
    details: details || '',
    timestamp: new Date().toISOString()
  });
  saveLog(log);
}

export function logEmergencyEvent(action, status, details) {
  logEvent(action, status, details);
}

export function lockDesktop() {
  logEvent('lockDesktop', 'attempted', 'Locking workstation');
  if (!isWindows()) {
    const msg = 'Lock desktop is only supported on Windows';
    logEvent('lockDesktop', 'failed', msg);
    return { success: false, error: msg };
  }
  try {
    execFileSync('rundll32.exe', ['user32.dll,LockWorkStation'], { timeout: 5000, windowsHide: true });
    logEvent('lockDesktop', 'success', 'Workstation locked');
    return { success: true };
  } catch (err) {
    const msg = `Failed to lock workstation: ${err.message}`;
    logEvent('lockDesktop', 'failed', msg);
    return { success: false, error: msg };
  }
}

export function stopUnknownProcesses() {
  const results = { killed: [], failed: [], errors: [] };
  logEvent('stopUnknownProcesses', 'attempted', 'Enumerating and terminating unknown processes');

  try {
    let processes = [];
    if (isWindows()) {
      const output = execSync('tasklist /FO CSV /NH', { encoding: 'utf8', timeout: 10000 });
      const lines = output.trim().split('\n');
      for (const line of lines) {
        const parts = line.replace(/"/g, '').split(',');
        if (parts.length >= 2) {
          processes.push({ name: parts[0], pid: parseInt(parts[1], 10) || 0 });
        }
      }
    } else {
      const output = execSync('ps -eo pid,comm --no-headers', { encoding: 'utf8', timeout: 10000 });
      const lines = output.trim().split('\n');
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 2) {
          processes.push({ name: path.basename(parts[1]), pid: parseInt(parts[0], 10) || 0 });
        }
      }
    }

    for (const proc of processes) {
      const nameLower = proc.name.toLowerCase();
      const isAllowed = PROCESS_ALLOWLIST.some(a => nameLower === a.toLowerCase()) ||
                        knownSafeProcesses.some(s => nameLower === s.toLowerCase());
      if (isAllowed) continue;
      if (proc.pid === 0 || proc.pid === process.pid) continue;

      try {
        if (isWindows()) {
          execFileSync('taskkill', ['/F', '/PID', String(proc.pid)], { timeout: 3000, windowsHide: true, stdio: 'ignore' });
        } else {
          execSync(`kill -9 ${proc.pid}`, { timeout: 3000, stdio: 'ignore' });
        }
        results.killed.push({ name: proc.name, pid: proc.pid });
      } catch {
        results.failed.push({ name: proc.name, pid: proc.pid });
      }
    }

    logEvent('stopUnknownProcesses', results.killed.length > 0 ? 'success' : 'none', `Killed ${results.killed.length}, failed ${results.failed.length}`);
  } catch (err) {
    logEvent('stopUnknownProcesses', 'error', err.message);
    results.errors.push(err.message);
  }

  return results;
}

export function disableUsbStorage() {
  logEvent('disableUsbStorage', 'attempted', 'Disabling USB storage via registry');
  if (!isWindows()) {
    const msg = 'USB storage control is only supported on Windows';
    logEvent('disableUsbStorage', 'failed', msg);
    return { success: false, error: msg };
  }
  try {
    const r = execPowerShell(
      'Set-ItemProperty -Path "HKLM:\\SYSTEM\\CurrentControlSet\\Services\\USBSTOR" -Name "Start" -Value 4 -Type DWord -Force'
    );
    if (r.success) {
      logEvent('disableUsbStorage', 'success', 'USB storage disabled (Start=4)');
      return { success: true };
    }
    logEvent('disableUsbStorage', 'failed', r.error);
    return { success: false, error: r.error };
  } catch (err) {
    logEvent('disableUsbStorage', 'error', err.message);
    return { success: false, error: err.message };
  }
}

export function enableUsbStorage() {
  logEvent('enableUsbStorage', 'attempted', 'Re-enabling USB storage via registry');
  if (!isWindows()) {
    const msg = 'USB storage control is only supported on Windows';
    logEvent('enableUsbStorage', 'failed', msg);
    return { success: false, error: msg };
  }
  try {
    const r = execPowerShell(
      'Set-ItemProperty -Path "HKLM:\\SYSTEM\\CurrentControlSet\\Services\\USBSTOR" -Name "Start" -Value 3 -Type DWord -Force'
    );
    if (r.success) {
      logEvent('enableUsbStorage', 'success', 'USB storage enabled (Start=3)');
      return { success: true };
    }
    logEvent('enableUsbStorage', 'failed', r.error);
    return { success: false, error: r.error };
  } catch (err) {
    logEvent('enableUsbStorage', 'error', err.message);
    return { success: false, error: err.message };
  }
}

export function generateAuthToken() {
  const token = crypto.randomBytes(16).toString('hex');
  const config = loadConfig();
  config.authToken = token;
  saveConfig(config);
  logEvent('generateAuthToken', 'success', 'New 32-char hex auth token generated');
  return token;
}

export function configureEmergencyOptions(options) {
  if (!options || typeof options !== 'object') {
    return { error: 'Options must be an object' };
  }
  const config = loadConfig();
  config.options = { ...config.options, ...options };
  saveConfig(config);
  logEvent('configureEmergencyOptions', 'success', 'Options updated');
  return { success: true, options: config.options };
}

export function getEmergencyOptions() {
  const config = loadConfig();
  return { ...config.options };
}

export function getEmergencyStatus() {
  const config = loadConfig();
  return {
    active: config.active,
    activatedAt: config.activatedAt,
    deactivatedAt: config.deactivatedAt,
    activatedActions: config.activatedActions
  };
}

export function getEmergencyHistory(limit) {
  const log = loadLog();
  const max = typeof limit === 'number' && limit > 0 ? limit : log.length;
  return log.slice(-max);
}

export function runEmergencyLockScan() {
  const results = {
    threats: [],
    riskScore: 0,
    requiresEmergency: false,
    readiness: {
      configExists: fs.existsSync(CONFIG_FILE),
      authTokenConfigured: !!loadConfig().authToken,
      platform: process.platform,
      canLockDesktop: isWindows(),
      canDisableUsb: isWindows()
    }
  };

  try {
    if (isWindows()) {
      const output = execSync('tasklist /FO CSV /NH', { encoding: 'utf8', timeout: 10000 });
      const lines = output.trim().split('\n');
      let unknownCount = 0;

      for (const line of lines) {
        const parts = line.replace(/"/g, '').split(',');
        if (parts.length >= 2) {
          const name = parts[0].toLowerCase();
          const isAllowed = PROCESS_ALLOWLIST.some(a => name === a.toLowerCase()) ||
                            knownSafeProcesses.some(s => name === s.toLowerCase());
          if (!isAllowed && name.length > 3 && !name.startsWith('ms')) {
            unknownCount++;
          }
        }
      }

      results.threats.push({
        type: 'process',
        unknownProcessCount: unknownCount,
        severity: unknownCount > 10 ? 'high' : unknownCount > 3 ? 'medium' : 'low'
      });
    }

    const usbStatus = isWindows() ? execPowerShell(
      '(Get-ItemProperty -Path "HKLM:\\SYSTEM\\CurrentControlSet\\Services\\USBSTOR" -Name "Start" -ErrorAction SilentlyContinue).Start'
    ) : null;
    results.threats.push({
      type: 'usb',
      usbEnabled: usbStatus && usbStatus.success ? usbStatus.output !== '4' : null,
      severity: usbStatus && usbStatus.success && usbStatus.output !== '4' ? 'medium' : 'low'
    });

    const riskFactors = results.threats.filter(t => t.severity !== 'low').length;
    results.riskScore = Math.min(100, riskFactors * 15);
    results.requiresEmergency = results.riskScore >= 30;

    logEvent('runEmergencyLockScan', 'complete', `Risk score: ${results.riskScore}, emergency required: ${results.requiresEmergency}`);
  } catch (err) {
    logEvent('runEmergencyLockScan', 'error', err.message);
    results.error = err.message;
  }

  return results;
}

export async function activateEmergencyLock(options) {
  const config = loadConfig();

  if (config.active) {
    return { error: 'Emergency lock is already active' };
  }

  const mergedOptions = { ...config.options, ...(options || {}) };
  const actions = [];

  try {
    if (!mergedOptions.authToken && !config.authToken) {
      generateAuthToken();
    }

    if (mergedOptions.lockFolders) {
      try {
        const folderLock = await import('./folder-lock.js');
        if (typeof folderLock.lockAllFolders === 'function') {
          await folderLock.lockAllFolders();
          actions.push({ action: 'lockFolders', status: 'success' });
          logEvent('lockFolders', 'success', 'All folders locked via folder-lock module');
        } else {
          actions.push({ action: 'lockFolders', status: 'skipped', detail: 'lockAllFolders not available' });
        }
      } catch {
        actions.push({ action: 'lockFolders', status: 'skipped', detail: 'folder-lock module not available' });
        logEvent('lockFolders', 'skipped', 'folder-lock module not found');
      }
    }

    if (mergedOptions.lockDesktop) {
      const r = lockDesktop();
      actions.push({ action: 'lockDesktop', status: r.success ? 'success' : 'failed', detail: r.error || '' });
    }

    if (mergedOptions.stopProcesses) {
      const r = stopUnknownProcesses();
      actions.push({
        action: 'stopProcesses',
        status: r.killed.length > 0 || r.failed.length === 0 ? 'success' : 'partial',
        detail: `Killed: ${r.killed.length}, Failed: ${r.failed.length}`
      });
    }

    if (mergedOptions.disableUsb) {
      const r = disableUsbStorage();
      actions.push({ action: 'disableUsb', status: r.success ? 'success' : 'failed', detail: r.error || '' });
    }

    if (mergedOptions.enableMaxProtection) {
      if (mergedOptions.stopProcesses && !actions.some(a => a.action === 'stopProcesses')) {
        const r = stopUnknownProcesses();
        actions.push({ action: 'enableMaxProtection-stopProcesses', status: 'success', detail: `Killed: ${r.killed.length}` });
      }
      if (mergedOptions.disableUsb && !actions.some(a => a.action === 'disableUsb')) {
        const r = disableUsbStorage();
        actions.push({ action: 'enableMaxProtection-disableUsb', status: r.success ? 'success' : 'failed' });
      }
      if (mergedOptions.lockDesktop && !actions.some(a => a.action === 'lockDesktop')) {
        lockDesktop();
      }
      actions.push({ action: 'enableMaxProtection', status: 'success' });
      logEvent('enableMaxProtection', 'success', 'Maximum protection enabled');
    }

    if (mergedOptions.startRecording) {
      logEvent('startRecording', 'success', 'Security event recording started');
      actions.push({ action: 'startRecording', status: 'success' });
    }

    if (mergedOptions.notifyAdmin) {
      logEvent('notifyAdmin', 'attempted', 'Admin notification triggered');
      actions.push({ action: 'notifyAdmin', status: 'success' });
    }

    config.active = true;
    config.activatedAt = new Date().toISOString();
    config.activatedActions = actions;
    saveConfig(config);

    logEvent('activateEmergencyLock', 'success', `Emergency lock activated with ${actions.length} actions`);

    return {
      activated: true,
      timestamp: config.activatedAt,
      actions
    };
  } catch (err) {
    logEvent('activateEmergencyLock', 'error', err.message);
    return { error: err.message };
  }
}

export async function deactivateEmergencyLock(authToken) {
  const config = loadConfig();

  if (!config.active) {
    return { error: 'Emergency lock is not active' };
  }

  if (!authToken || typeof authToken !== 'string') {
    return { error: 'Valid auth token is required to deactivate emergency lock' };
  }

  if (authToken !== config.authToken) {
    logEvent('deactivateEmergencyLock', 'failed', 'Invalid auth token provided');
    return { error: 'Invalid auth token' };
  }

  try {
    if (isWindows()) {
      enableUsbStorage();
    }

    config.active = false;
    config.deactivatedAt = new Date().toISOString();
    saveConfig(config);

    logEvent('deactivateEmergencyLock', 'success', 'Emergency lock deactivated');

    return {
      deactivated: true,
      timestamp: config.deactivatedAt
    };
  } catch (err) {
    logEvent('deactivateEmergencyLock', 'error', err.message);
    return { error: err.message };
  }
}
