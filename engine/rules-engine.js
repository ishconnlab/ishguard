export const suspiciousProcesses = [
  'xmr', 'miner', 'cryptonight', 'ethminer', 'excavator',
  'keylogger', 'hook', 'inject', 'dropper',
  'beacon', 'reverse', 'meterpreter',
  'unknown', 'suspicious', 'malware',
  'rundll32.exe', 'regsvr32.exe', 'mshta.exe',
  'wscript.exe', 'cscript.exe',
];

export const knownSafeProcesses = [
  'svchost', 'system', 'explorer', 'chrome', 'firefox',
  'edge', 'brave', 'opera', 'vivaldi',
  'winword', 'excel', 'powerpnt', 'outlook',
  'code', 'cursor', 'github', 'git',
  'node', 'npm', 'npx', 'yarn', 'pnpm',
  'python', 'java', 'dotnet', 'go',
  'docker', 'kubernetes', 'kubectl',
  'discord', 'slack', 'teams', 'zoom',
  'spotify', 'vlc', 'steam', 'epic',
  'sublime', 'atom', 'notepad++', 'notepad',
  'terminal', 'wt.exe', 'windowsterminal',
  'conhost', 'dwm', 'csrss', 'winlogon',
  'services', 'lsass', 'smss', 'wininit',
  'taskhost', 'sihost', 'ctfmon',
  'securityhealth', 'windowsdefender',
  'nvcontainer', 'nvidia', 'amd',
  'searchapp', 'searchindexer', 'runtimebroker',
  'shellexperiencehost', 'startmenuexperiencehost',
  'widgets', 'phoneexperiencehost',
  'applicationframehost', 'systemsettings',
  'lockapp', 'peopleexperiencehost',
  'yourphone', 'inputmethod', 'textinputhost',
  'ishguard',
];

export const threatRules = [
  {
    id: 'RULE-001',
    name: 'High CPU Usage',
    description: 'Unknown process consuming excessive CPU',
    severity: 'warning',
    check: (snapshot) => snapshot.health?.cpu?.usagePercent > 85
  },
  {
    id: 'RULE-002',
    name: 'High Memory Usage',
    description: 'System memory usage exceeds safe threshold',
    severity: 'warning',
    check: (snapshot) => snapshot.health?.memory?.usagePercent > 90
  },
  {
    id: 'RULE-003',
    name: 'Public Network',
    description: 'Device connected to public/unsecured network',
    severity: 'warning',
    check: (snapshot) => snapshot.network?.publicWifi === true
  },
  {
    id: 'RULE-004',
    name: 'Suspicious Process Activity',
    description: 'One or more suspicious processes detected',
    severity: 'risk',
    check: (snapshot) => (snapshot.processes?.threats || []).length > 0
  },
  {
    id: 'RULE-005',
    name: 'Low Disk Space',
    description: 'Available disk space critically low',
    severity: 'warning',
    check: (snapshot) => snapshot.health?.disk?.usagePercent > 95
  },
  {
    id: 'RULE-006',
    name: 'Firewall Disabled',
    description: 'Windows firewall not active on all profiles',
    severity: 'warning',
    check: (snapshot) => snapshot.network?.firewallActive === false
  },
  {
    id: 'RULE-007',
    name: 'Unsecured WiFi',
    description: 'WiFi network without encryption',
    severity: 'warning',
    check: (snapshot) => snapshot.network?.wifiSecured === false
  },
  {
    id: 'RULE-008',
    name: 'Ransomware Activity',
    description: 'Processes matching ransomware behavior patterns',
    severity: 'risk',
    check: (snapshot) => (snapshot.processes?.threats || []).some(t =>
      /encrypt|ransom|crypto.*locker|decrypt/i.test(t.name)
    )
  },
  {
    id: 'RULE-009',
    name: 'Cryptominer Detected',
    description: 'Cryptocurrency mining process running',
    severity: 'risk',
    check: (snapshot) => (snapshot.processes?.threats || []).some(t =>
      /miner|xmr|cryptonight|ethminer|excavator/i.test(t.name)
    )
  },
  {
    id: 'RULE-010',
    name: 'System Uptime Warning',
    description: 'System running for extended period without restart',
    severity: 'info',
    check: (snapshot) => (snapshot.health?.uptime || 0) > 259200
  },
];

export class SecurityEngine {
  constructor() {
    this.rules = threatRules;
    this.results = [];
    this.overallStatus = 'safe';
  }

  evaluate(snapshot) {
    this.results = [];
    let highestSeverity = 'safe';
    const severityOrder = { risk: 4, warning: 3, info: 2, safe: 1 };

    for (const rule of this.rules) {
      try {
        let triggered = false;
        if (rule.check) {
          triggered = rule.check(snapshot);
        }
        if (triggered) {
          this.results.push({
            rule: rule.id,
            name: rule.name,
            description: rule.description,
            severity: rule.severity,
            status: 'triggered'
          });
          if (severityOrder[rule.severity] > severityOrder[highestSeverity]) {
            highestSeverity = rule.severity;
          }
        }
      } catch {
        continue;
      }
    }

    this.overallStatus = highestSeverity;
    return {
      status: this.overallStatus,
      findings: this.results,
      totalRules: this.rules.length,
      triggeredCount: this.results.length
    };
  }

  getOverallStatus() {
    return this.overallStatus;
  }
}
