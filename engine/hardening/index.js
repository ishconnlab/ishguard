import fs from 'fs';
import path from 'path';
import os from 'os';
import { execSync } from 'child_process';

const CONFIG_DIR = path.join(os.homedir(), '.ishguard');
const HARDENING_CONFIG = path.join(CONFIG_DIR, 'hardening-config.json');
const LOG_FILE = path.join(CONFIG_DIR, 'hardening-log.json');

function isWindows() {
  return process.platform === 'win32';
}

function ensureDir() {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

function runCmd(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8', timeout: 10000, stdio: 'pipe', windowsHide: true }).trim();
  } catch {
    return null;
  }
}

function loadLog() {
  ensureDir();
  try {
    if (fs.existsSync(LOG_FILE)) {
      return JSON.parse(fs.readFileSync(LOG_FILE, 'utf8'));
    }
  } catch {}
  return [];
}

function appendLog(entry) {
  ensureDir();
  try {
    const log = loadLog();
    log.push({ ...entry, timestamp: new Date().toISOString() });
    if (log.length > 200) log.splice(0, log.length - 200);
    fs.writeFileSync(LOG_FILE, JSON.stringify(log, null, 2));
  } catch {}
}

export const securityPolicies = [
  {
    id: 'windows-firewall',
    name: 'Windows Firewall',
    description: 'Blocks unauthorized inbound traffic and protects against network attacks.',
    category: 'network',
    riskLevel: 'high',
    recommendedAction: 'Enable on all profiles',
    checkCmd: 'netsh advfirewall show allprofiles state',
    enableCmd: 'netsh advfirewall set allprofiles state on',
    disableCmd: 'netsh advfirewall set allprofiles state off',
    restoreCmd: 'netsh advfirewall set allprofiles state on',
    canDisable: true,
    canRestore: true
  },
  {
    id: 'windows-smartscreen',
    name: 'Windows SmartScreen',
    description: 'Protects against malicious websites, downloads, and files by checking against Microsoft\'s reputation database.',
    category: 'defender',
    riskLevel: 'high',
    recommendedAction: 'Enable SmartScreen for all apps',
    checkCmd: 'reg query "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Explorer" /v SmartScreenEnabled',
    enableCmd: 'reg add "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Explorer" /v SmartScreenEnabled /t REG_SZ /d "RequireAdmin" /f',
    disableCmd: 'reg add "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Explorer" /v SmartScreenEnabled /t REG_SZ /d "Off" /f',
    restoreCmd: 'reg add "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Explorer" /v SmartScreenEnabled /t REG_SZ /d "RequireAdmin" /f',
    canDisable: true,
    canRestore: true
  },
  {
    id: 'uac',
    name: 'User Account Control (UAC)',
    description: 'Prevents unauthorized system changes by prompting for administrator approval.',
    category: 'access',
    riskLevel: 'medium',
    recommendedAction: 'Enable UAC at default or higher level',
    checkCmd: 'reg query "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\System" /v EnableLUA',
    enableCmd: 'reg add "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\System" /v EnableLUA /t REG_DWORD /d 1 /f',
    disableCmd: 'reg add "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\System" /v EnableLUA /t REG_DWORD /d 0 /f',
    restoreCmd: 'reg add "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\System" /v EnableLUA /t REG_DWORD /d 1 /f',
    canDisable: true,
    canRestore: true
  },
  {
    id: 'autorun',
    name: 'AutoRun',
    description: 'Controls whether programs can automatically run from removable media like USB drives.',
    category: 'device',
    riskLevel: 'medium',
    recommendedAction: 'Disable AutoRun to prevent malware from USB drives',
    checkCmd: 'reg query "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\Explorer" /v NoDriveTypeAutoRun',
    enableCmd: 'reg add "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\Explorer" /v NoDriveTypeAutoRun /t REG_DWORD /d 0x000000ff /f',
    disableCmd: 'reg add "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\Explorer" /v NoDriveTypeAutoRun /t REG_DWORD /d 0x00000091 /f',
    restoreCmd: 'reg add "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\Explorer" /v NoDriveTypeAutoRun /t REG_DWORD /d 0x000000ff /f',
    canDisable: true,
    canRestore: true
  },
  {
    id: 'windows-defender',
    name: 'Windows Defender',
    description: 'Real-time protection against viruses, malware, and spyware.',
    category: 'defender',
    riskLevel: 'high',
    recommendedAction: 'Enable real-time protection',
    checkCmd: 'powershell Get-MpPreference | select DisableRealtimeMonitoring',
    enableCmd: 'powershell Set-MpPreference -DisableRealtimeMonitoring $false',
    disableCmd: 'powershell Set-MpPreference -DisableRealtimeMonitoring $true',
    restoreCmd: 'powershell Set-MpPreference -DisableRealtimeMonitoring $false',
    canDisable: true,
    canRestore: true
  },
  {
    id: 'guest-account',
    name: 'Guest Account',
    description: 'The Guest account provides anonymous system access with limited privileges.',
    category: 'access',
    riskLevel: 'high',
    recommendedAction: 'Disable Guest account if not needed',
    checkCmd: 'net user Guest | findstr /i "active"',
    enableCmd: 'net user Guest /active:yes',
    disableCmd: 'net user Guest /active:no',
    restoreCmd: 'net user Guest /active:no',
    canDisable: true,
    canRestore: true
  },
  {
    id: 'login-banner',
    name: 'Interactive Login Banner',
    description: 'Displays a legal warning message before user login. Recommended for business environments.',
    category: 'access',
    riskLevel: 'low',
    recommendedAction: 'Configure with security warning message',
    checkCmd: 'reg query "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\System" /v legalnoticecaption',
    enableCmd: '',
    disableCmd: '',
    restoreCmd: '',
    canDisable: true,
    canRestore: true,
    isLoginBanner: true
  }
];

function checkPolicy(policy) {
  if (!isWindows()) return { id: policy.id, status: 'unknown', enabled: null, error: 'Not a Windows system' };

  try {
    const out = runCmd(policy.checkCmd);
    if (out === null) return { id: policy.id, status: 'error', enabled: null, error: 'Check command failed' };

    let enabled = false;

    if (policy.id === 'windows-firewall') {
      enabled = out.toLowerCase().includes('on');
    } else if (policy.id === 'windows-smartscreen') {
      enabled = out.toLowerCase().includes('requireadmin') || out.toLowerCase().includes('warn') || out.toLowerCase().includes('prompt');
    } else if (policy.id === 'uac') {
      enabled = out.includes('1');
    } else if (policy.id === 'autorun') {
      enabled = out.trim().endsWith('ff') || out.trim().endsWith('0xff');
    } else if (policy.id === 'windows-defender') {
      enabled = out.toLowerCase().includes('false') || out.toLowerCase().includes('0');
    } else if (policy.id === 'guest-account') {
      enabled = out.toLowerCase().includes('no') || !out.toLowerCase().includes('active');
    } else if (policy.id === 'login-banner') {
      enabled = out && out.length > 0;
    }

    return { id: policy.id, status: enabled ? 'enabled' : 'disabled', enabled, checkedAt: new Date().toISOString() };
  } catch (e) {
    return { id: policy.id, status: 'error', enabled: null, error: e.message };
  }
}

export function getPolicies() {
  return securityPolicies.map(p => {
    const check = checkPolicy(p);
    return {
      ...p,
      currentStatus: check.status,
      currentEnabled: check.enabled,
      checkedAt: check.checkedAt,
      checkError: check.error
    };
  });
}

export function applyPolicy(policyId) {
  if (!isWindows()) return { success: false, error: 'Not a Windows system' };

  const policy = securityPolicies.find(p => p.id === policyId);
  if (!policy) return { success: false, error: `Policy "${policyId}" not found` };

  try {
    if (policy.isLoginBanner) {
      return { success: false, error: 'Use setLoginBanner() for login banner configuration' };
    }

    const result = runCmd(policy.enableCmd);
    if (result === null) {
      appendLog({ action: 'apply', policy: policyId, success: false, error: 'Command failed' });
      return { success: false, error: `Failed to enable ${policy.name}. Administrator privileges may be required.` };
    }

    const check = checkPolicy(policy);
    appendLog({ action: 'apply', policy: policyId, success: check.enabled === true, status: check.status });

    return {
      success: check.enabled === true,
      policy: policyId,
      status: check.status,
      message: check.enabled ? `${policy.name} has been enabled successfully.` : `Failed to enable ${policy.name}. Try running as Administrator.`
    };
  } catch (e) {
    appendLog({ action: 'apply', policy: policyId, success: false, error: e.message });
    return { success: false, error: e.message };
  }
}

export function disablePolicy(policyId) {
  if (!isWindows()) return { success: false, error: 'Not a Windows system' };

  const policy = securityPolicies.find(p => p.id === policyId);
  if (!policy) return { success: false, error: `Policy "${policyId}" not found` };
  if (!policy.canDisable) return { success: false, error: `${policy.name} cannot be disabled` };

  try {
    const result = runCmd(policy.disableCmd);
    if (result === null) {
      appendLog({ action: 'disable', policy: policyId, success: false, error: 'Command failed' });
      return { success: false, error: `Failed to disable ${policy.name}. Administrator privileges may be required.` };
    }

    const check = checkPolicy(policy);
    appendLog({ action: 'disable', policy: policyId, success: check.enabled === false, status: check.status });

    return {
      success: check.enabled === false,
      policy: policyId,
      status: check.status,
      message: check.enabled === false ? `${policy.name} has been disabled.` : `Failed to disable ${policy.name}.`
    };
  } catch (e) {
    appendLog({ action: 'disable', policy: policyId, success: false, error: e.message });
    return { success: false, error: e.message };
  }
}

export function restorePolicyDefault(policyId) {
  if (!isWindows()) return { success: false, error: 'Not a Windows system' };

  const policy = securityPolicies.find(p => p.id === policyId);
  if (!policy) return { success: false, error: `Policy "${policyId}" not found` };
  if (!policy.canRestore) return { success: false, error: `${policy.name} does not support restore defaults` };

  try {
    const result = runCmd(policy.restoreCmd);
    if (result === null) {
      appendLog({ action: 'restore', policy: policyId, success: false, error: 'Command failed' });
      return { success: false, error: `Failed to restore ${policy.name} defaults.` };
    }

    const check = checkPolicy(policy);
    appendLog({ action: 'restore', policy: policyId, success: true, status: check.status });

    return {
      success: true,
      policy: policyId,
      status: check.status,
      message: `${policy.name} defaults restored.`
    };
  } catch (e) {
    appendLog({ action: 'restore', policy: policyId, success: false, error: e.message });
    return { success: false, error: e.message };
  }
}

export function getLoginBanner() {
  const caption = runCmd('reg query "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\System" /v legalnoticecaption') || '';
  const text = runCmd('reg query "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\System" /v legalnoticetext') || '';

  const captionMatch = caption.match(/\{3\}\s*(.*?)\s*\{3\}/) || caption.match(/legalnoticecaption\s+REG_SZ\s+(.*)/i);
  const textMatch = text.match(/\{3\}\s*(.*?)\s*\{3\}/) || text.match(/legalnoticetext\s+REG_SZ\s+(.*)/i);

  return {
    configured: captionMatch !== null || (caption && caption.length > 0),
    title: captionMatch ? captionMatch[1].trim() : '',
    message: textMatch ? textMatch[1].trim() : '',
    rawCaption: caption,
    rawText: text
  };
}

export function setLoginBanner(config) {
  if (!isWindows()) return { success: false, error: 'Not a Windows system' };

  const title = config?.title || 'ISHGUARD SECURITY SYSTEM';
  const message = config?.message || 'This system is owned and protected by IshGuard Security.\nAccess is restricted to authorized users only.\nBy continuing, you acknowledge that your activity may be monitored, recorded, and audited.\nIf you are not an authorized user, disconnect immediately.';

  try {
    runCmd(`reg add "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\System" /v legalnoticecaption /t REG_SZ /d "${title}" /f`);
    runCmd(`reg add "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\System" /v legalnoticetext /t REG_SZ /d "${message}" /f`);

    appendLog({ action: 'set-login-banner', title, success: true });
    return {
      success: true,
      message: 'Login banner has been configured. Changes will take effect on next login.',
      title,
      message
    };
  } catch (e) {
    appendLog({ action: 'set-login-banner', success: false, error: e.message });
    return { success: false, error: e.message };
  }
}

export function removeLoginBanner() {
  if (!isWindows()) return { success: false, error: 'Not a Windows system' };

  try {
    runCmd('reg delete "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\System" /v legalnoticecaption /f 2>nul');
    runCmd('reg delete "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\System" /v legalnoticetext /f 2>nul');

    appendLog({ action: 'remove-login-banner', success: true });
    return { success: true, message: 'Login banner has been removed.' };
  } catch (e) {
    appendLog({ action: 'remove-login-banner', success: false, error: e.message });
    return { success: false, error: e.message };
  }
}

export function getSecurityScore() {
  const policies = getPolicies();
  const weights = {
    'windows-firewall': 20,
    'windows-smartscreen': 15,
    'uac': 10,
    'autorun': 10,
    'windows-defender': 20,
    'guest-account': 10,
    'login-banner': 5
  };

  let totalWeight = 0;
  let earnedWeight = 0;
  const details = [];

  for (const p of policies) {
    const weight = weights[p.id] || 5;
    totalWeight += weight;
    const enabled = p.currentEnabled === true;
    if (enabled) earnedWeight += weight;

    details.push({
      id: p.id,
      name: p.name,
      enabled,
      weight,
      status: p.currentStatus,
      riskLevel: p.riskLevel
    });
  }

  const score = totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 0;
  let riskLevel = 'low';
  if (score < 50) riskLevel = 'critical';
  else if (score < 70) riskLevel = 'high';
  else if (score < 85) riskLevel = 'medium';

  return {
    score,
    riskLevel,
    earnedWeight,
    totalWeight,
    details,
    summary: `${score}/100 — ${riskLevel.toUpperCase()} risk`,
    missingPolicies: details.filter(d => !d.enabled).map(d => ({
      id: d.id,
      name: d.name,
      riskLevel: d.riskLevel,
      recommendation: securityPolicies.find(p => p.id === d.id)?.recommendedAction || 'Enable this policy'
    }))
  };
}

export function exportHardeningReport() {
  const policies = getPolicies();
  const score = getSecurityScore();
  const log = loadLog();
  const banner = getLoginBanner();

  return {
    title: 'ISHGuard Security Policies Report',
    generatedAt: new Date().toISOString(),
    computerName: os.hostname(),
    user: os.userInfo().username,
    securityScore: score,
    policies,
    loginBanner: banner,
    changeHistory: log
  };
}

export function getHardeningLog() {
  return loadLog();
}
