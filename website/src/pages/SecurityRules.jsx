import React from 'react';
import { Shield, AlertTriangle, Info, FileSearch } from 'lucide-react';
import Badge from '../components/ui/Badge';

const rules = [
  { id: 'RULE-001', name: 'High CPU Usage', severity: 'warning', desc: 'CPU usage exceeds 85% threshold', check: 'CPU usage > 85%' },
  { id: 'RULE-002', name: 'High Memory Usage', severity: 'warning', desc: 'Memory usage exceeds 90% threshold', check: 'Memory usage > 90%' },
  { id: 'RULE-003', name: 'Public Network', severity: 'warning', desc: 'Device on public/unsecured network', check: 'Public IP detected' },
  { id: 'RULE-004', name: 'Suspicious Process Activity', severity: 'risk', desc: 'Suspicious processes detected', check: 'Threat count > 0' },
  { id: 'RULE-005', name: 'Low Disk Space', severity: 'warning', desc: 'Disk usage exceeds 95%', check: 'Disk usage > 95%' },
  { id: 'RULE-006', name: 'Firewall Disabled', severity: 'warning', desc: 'Windows Firewall not active', check: 'firewallActive === false' },
  { id: 'RULE-007', name: 'Unsecured WiFi', severity: 'warning', desc: 'WiFi without encryption', check: 'wifiSecured === false' },
  { id: 'RULE-008', name: 'Ransomware Activity', severity: 'risk', desc: 'Ransomware behavior detected', check: 'Process name matches ransomware patterns' },
  { id: 'RULE-009', name: 'Cryptominer Detected', severity: 'risk', desc: 'Mining process running', check: 'Process name matches miner patterns' },
  { id: 'RULE-010', name: 'System Uptime Warning', severity: 'info', desc: 'Extended uptime without restart', check: 'Uptime > 72 hours' },
];

const signatures = [
  { name: 'EICAR Test String', desc: 'Standard antivirus test string', pattern: 'X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*' },
  { name: 'JS/PowerShell Downloader', desc: 'Remote script execution via PowerShell or JavaScript', pattern: 'RegExp for common download cradle patterns' },
  { name: 'VBS/Obfuscated Scripts', desc: 'Obfuscated VBScript with suspicious execution', pattern: 'RegExp for eval/exec obfuscation patterns' },
  { name: 'AutoRun Infector', desc: 'USB autorun.inf with executable payload', pattern: 'autorun.inf with Open or Action directive' },
  { name: 'Shortcut Virus', desc: '.lnk file targeting executable', pattern: '.lnk containing .exe/.vbs/.ps1 reference' },
  { name: 'Hidden Executable', desc: 'Hidden file on drive root', pattern: 'Dot/tilde-prefixed executable on root' },
  { name: 'Obfuscated Batch', desc: 'Encoded PowerShell in batch files', pattern: 'RegExp for encoded command patterns' },
  { name: 'Suspicious Process', desc: 'Known threat process names', pattern: 'Name match against threat database' },
  { name: 'Known Threat Hash', desc: 'SHA256 match against threat DB', pattern: 'Exact hash match' },
  { name: 'High Entropy Content', desc: 'Potentially obfuscated payload', pattern: 'Shannon entropy > 7.5 bits/byte' },
];

export default function SecurityRules() {
  return (
    <div className="pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12 animate-slide-up">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand/10 border border-brand/20 rounded-full mb-4">
            <FileSearch className="w-3.5 h-3.5 text-brand" />
            <span className="text-xs font-medium text-brand">Transparency</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Security <span className="text-gradient">Rules & Signatures</span>
          </h1>
          <p className="text-gray-400">Complete transparency into how ISHGuard detects and responds to threats</p>
        </div>

        <div className="mb-12">
          <h2 className="text-xl font-bold text-white mb-4">Detection Rules</h2>
          <div className="space-y-2">
            {rules.map(rule => (
              <div key={rule.id} className="glass-card rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${rule.severity === 'risk' ? 'bg-risk' : rule.severity === 'warning' ? 'bg-warning' : 'bg-info'}`} />
                  <div>
                    <div className="text-sm font-medium text-white">{rule.name}</div>
                    <div className="text-xs text-gray-500">{rule.desc}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <code className="text-[10px] text-gray-600 bg-dark-900/50 px-2 py-1 rounded">{rule.check}</code>
                  <Badge variant={rule.severity === 'critical' ? 'danger' : rule.severity === 'high' ? 'warning' : 'info'} size="sm">{rule.severity}</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold text-white mb-4">Malware Signatures</h2>
          <div className="space-y-2">
            {signatures.map((sig, i) => (
              <div key={i} className="glass-card rounded-xl p-4">
                <div className="flex items-start justify-between mb-1">
                  <div>
                    <div className="text-sm font-medium text-white">{sig.name}</div>
                    <div className="text-xs text-gray-500">{sig.desc}</div>
                  </div>
                </div>
                <code className="text-[10px] text-gray-600 font-mono block mt-1">{sig.pattern}</code>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
