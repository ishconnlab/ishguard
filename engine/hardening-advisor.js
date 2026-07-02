// ISHGuard Security Hardening Assistant
// Provides real Windows security hardening guidance with executable commands

export const hardeningChecks = [
  {
    id: 'HARDEN-001',
    title: 'Remote Desktop',
    description: 'Remote Desktop allows others to connect to your PC. If unused, disable it to reduce attack surface.',
    check: 'reg query "HKLM\\SYSTEM\\CurrentControlSet\\Control\\Terminal Server" /v fDenyTSConnections',
    fix: 'reg add "HKLM\\SYSTEM\\CurrentControlSet\\Control\\Terminal Server" /v fDenyTSConnections /t REG_DWORD /d 1 /f',
    fixLabel: 'Disable Remote Desktop',
    severity: 'medium',
    category: 'access',
    policyPath: 'Computer Configuration > Administrative Templates > Windows Components > Remote Desktop Services > Remote Desktop Session Host > Connections',
    policySetting: 'Allow users to connect remotely using Remote Desktop Services → Disabled',
    guiPath: 'System Properties > Remote > Uncheck "Allow Remote Assistance" and "Allow Remote Desktop"'
  },
  {
    id: 'HARDEN-002',
    title: 'Windows Defender Firewall',
    description: 'The Windows firewall blocks unauthorized inbound traffic. Ensure it is active on all profiles.',
    check: 'netsh advfirewall show allprofiles state',
    fix: 'netsh advfirewall set allprofiles state on',
    fixLabel: 'Enable Firewall',
    severity: 'high',
    category: 'network',
    guiPath: 'Windows Security > Firewall & network protection > Ensure all profiles show "On"'
  },
  {
    id: 'HARDEN-003',
    title: 'Guest Account',
    description: 'The Guest account provides anonymous system access. Disable if not needed.',
    check: 'net user Guest | findstr /i "active"',
    fix: 'net user Guest /active:no',
    fixLabel: 'Disable Guest Account',
    severity: 'high',
    category: 'access',
    guiPath: 'Computer Management > Local Users and Groups > Users > Guest > Uncheck "Account is disabled"'
  },
  {
    id: 'HARDEN-004',
    title: 'Windows Defender Antivirus',
    description: 'Real-time protection should be enabled for continuous threat monitoring.',
    check: 'powershell Get-MpPreference | select DisableRealtimeMonitoring',
    fix: 'powershell Set-MpPreference -DisableRealtimeMonitoring $false',
    fixLabel: 'Enable Real-Time Protection',
    severity: 'high',
    category: 'defender',
    guiPath: 'Windows Security > Virus & threat protection > Manage settings > Real-time protection → On'
  },
  {
    id: 'HARDEN-005',
    title: 'SMB Protocol',
    description: 'SMBv1 is a legacy protocol with known vulnerabilities. Disable if not needed.',
    check: 'dism /online /Get-FeatureInfo /FeatureName:SMB1Protocol | findstr /i "State"',
    fix: 'dism /online /Disable-Feature /FeatureName:SMB1Protocol /norestart',
    fixLabel: 'Disable SMBv1',
    severity: 'medium',
    category: 'network',
    guiPath: 'Control Panel > Programs > Turn Windows features on/off > Uncheck "SMB 1.0/CIFS File Sharing Support"'
  },
  {
    id: 'HARDEN-006',
    title: 'Windows Update',
    description: 'Regular updates patch security vulnerabilities. Check that automatic updates are enabled.',
    check: 'reg query "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\WindowsUpdate\\Auto Update" /v AUOptions',
    fix: 'sc config wuauserv start=auto && net start wuauserv',
    fixLabel: 'Enable Automatic Updates',
    severity: 'high',
    category: 'system',
    guiPath: 'Settings > Update & Security > Windows Update > Advanced options > Automatic updates → On'
  },
  {
    id: 'HARDEN-007',
    title: 'UAC (User Account Control)',
    description: 'UAC prevents unauthorized system changes. Ensure it is not disabled.',
    check: 'reg query "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\System" /v EnableLUA',
    fix: 'reg add "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\System" /v EnableLUA /t REG_DWORD /d 1 /f',
    fixLabel: 'Enable UAC',
    severity: 'medium',
    category: 'access',
    guiPath: 'Control Panel > User Accounts > Change User Account Control settings > Default or higher'
  },
  {
    id: 'HARDEN-008',
    title: 'Windows Script Host',
    description: 'Windows Script Host can be used by malware to execute scripts. Disable if not needed.',
    check: 'reg query "HKLM\\SOFTWARE\\Microsoft\\Windows Script Host\\Settings" /v Enabled',
    fix: 'reg add "HKLM\\SOFTWARE\\Microsoft\\Windows Script Host\\Settings" /v Enabled /t REG_DWORD /d 0 /f',
    fixLabel: 'Disable WSH',
    severity: 'low',
    category: 'system',
    guiPath: 'Not available via GUI — registry change required'
  },
  {
    id: 'HARDEN-009',
    title: 'PowerShell Execution Policy',
    description: 'Restrict PowerShell to only run signed scripts to prevent malicious script execution.',
    check: 'powershell Get-ExecutionPolicy',
    fix: 'powershell Set-ExecutionPolicy RemoteSigned -Scope LocalMachine',
    fixLabel: 'Set Execution Policy to RemoteSigned',
    severity: 'medium',
    category: 'system',
    guiPath: 'PowerShell (Admin) > Set-ExecutionPolicy RemoteSigned'
  },
  {
    id: 'HARDEN-010',
    title: 'Network Discovery',
    description: 'Network discovery allows other devices to find your PC. Disable on public networks.',
    check: 'netsh advfirewall firewall show rule name="Network Discovery" dir=in | findstr /i "Enabled"',
    fix: 'netsh advfirewall firewall set rule group="Network Discovery" new enable=No',
    fixLabel: 'Disable Network Discovery',
    severity: 'low',
    category: 'network',
    guiPath: 'Control Panel > Network and Sharing Center > Advanced sharing settings > Turn off network discovery'
  }
];

import { execSync } from 'child_process';

export function evaluateHardening() {
  const results = [];
  let score = 0;
  const total = hardeningChecks.length;
  const weights = { high: 15, medium: 10, low: 5 };
  let appliedCount = 0;

  for (const check of hardeningChecks) {
    let isApplied = false;
    try {
      const out = execSync(check.check, { encoding: 'utf8', timeout: 10000, stdio: 'pipe', windowsHide: true });
      const trimmed = out.trim().toLowerCase();
      if (check.id === 'HARDEN-002') {
        isApplied = trimmed.includes('on');
      } else if (check.id === 'HARDEN-003') {
        isApplied = !trimmed.includes('active') && !trimmed.includes('yes');
      } else if (check.id === 'HARDEN-004') {
        isApplied = trimmed.includes('false') || trimmed.includes('0');
      } else if (check.id === 'HARDEN-001') {
        isApplied = trimmed.includes('1');
      } else if (check.id === 'HARDEN-005') {
        isApplied = trimmed.includes('disabled');
      } else if (check.id === 'HARDEN-006') {
        isApplied = !trimmed.includes('running');
      } else if (check.id === 'HARDEN-007') {
        isApplied = trimmed.includes('1');
      } else if (check.id === 'HARDEN-008') {
        isApplied = trimmed.includes('0');
      } else if (check.id === 'HARDEN-009') {
        isApplied = trimmed.includes('remotesigned') || trimmed.includes('restricted');
      } else if (check.id === 'HARDEN-010') {
        isApplied = trimmed.includes('no') || !trimmed.includes('yes');
      }
    } catch {
      isApplied = false;
    }

    const weight = weights[check.severity] || 5;
    if (isApplied) {
      score += weight;
      appliedCount++;
    }

    results.push({
      ...check,
      isApplied,
      weight
    });
  }

  const maxScore = total * 15;

  return {
    totalChecks: total,
    appliedCount,
    recommendedCount: total - appliedCount,
    score,
    maxScore,
    percentage: maxScore > 0 ? Math.round((score / maxScore) * 100) : 0,
    checks: results,
    summary: `${appliedCount}/${total} hardening checks applied (${maxScore > 0 ? Math.round((score / maxScore) * 100) : 0}% compliant).`
  };
}

export function getHardeningSummary() {
  const byCategory = {};
  for (const check of hardeningChecks) {
    if (!byCategory[check.category]) byCategory[check.category] = [];
    byCategory[check.category].push(check);
  }
  return {
    total: hardeningChecks.length,
    categories: Object.keys(byCategory).length,
    byCategory,
    highPriority: hardeningChecks.filter(c => c.severity === 'high').length,
    mediumPriority: hardeningChecks.filter(c => c.severity === 'medium').length,
    lowPriority: hardeningChecks.filter(c => c.severity === 'low').length
  };
}
