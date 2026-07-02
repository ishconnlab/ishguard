import React from 'react';
import { Shield, FileSearch, FolderSearch, HardDrive, Cpu, Zap, Bug, Lock, AlertTriangle, CheckCircle2, DownloadCloud, ScanLine, ArrowRight } from 'lucide-react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';

const scanModes = [
  {
    icon: Zap,
    title: 'Quick Scan',
    description: 'Scans critical system areas including running processes, memory, startup programs, and common infection points. Takes 1-3 minutes.',
    features: ['Running processes & memory', 'Startup programs & autoruns', 'Common infection vectors', 'Low resource impact'],
    badge: 'Fast',
    badgeVariant: 'success',
  },
  {
    icon: FileSearch,
    title: 'Full System Scan',
    description: 'Deep scan of all files, directories, and system areas. Uses signature, heuristic, and entropy analysis across every file type.',
    features: ['All files & directories', 'Archives & executables', 'Heuristic + entropy analysis', 'SHA256 hash verification'],
    badge: 'Thorough',
    badgeVariant: 'premium',
  },
  {
    icon: HardDrive,
    title: 'USB Drive Scan',
    description: 'Targeted scan of removable drives for shortcut viruses, AutoRun malware, and hidden executables. Protects against USB-borne threats.',
    features: ['Shortcut virus detection', 'AutoRun.inf analysis', 'Hidden executable detection', 'One-click quarantine'],
    badge: 'External',
    badgeVariant: 'info',
  },
  {
    icon: FolderSearch,
    title: 'Custom Directory Scan',
    description: 'Scan any specific folder or directory of your choice. Configure exclusions, file type filters, and scan depth.',
    features: ['User-selected directories', 'Exclusion filters', 'File type targeting', 'Configurable scan depth'],
    badge: 'Flexible',
    badgeVariant: 'warning',
  },
];

const detectionMethods = [
  { icon: Bug, title: 'Signature Detection', desc: '25+ malware signatures covering JS, PowerShell, VBS, and Batch malware patterns including EICAR, downloaders, cryptominers, ransomware, reverse shells, and keyloggers.' },
  { icon: Cpu, title: 'Heuristic Analysis', desc: 'Behavioral pattern matching identifies suspicious file behaviors — mass file operations, network beaconing, privilege escalation attempts.' },
  { icon: ScanLine, title: 'Entropy Scanning', desc: 'High-entropy string detection flags potentially obfuscated or encrypted payloads that signature-based methods may miss.' },
  { icon: Lock, title: 'Hash Verification', desc: 'SHA256 hash comparison against known threat databases and registered safe lists for instant threat identification.' },
];

const stats = [
  { value: '25+', label: 'Malware Signatures', icon: Bug },
  { value: '4', label: 'Risk Levels', icon: AlertTriangle },
  { value: '100%', label: 'Offline Detection', icon: Shield },
  { value: '0', label: 'Cloud Dependency', icon: DownloadCloud },
];

export default function Scanner() {
  return (
    <div className="pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12 animate-slide-up">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand/10 border border-brand/20 rounded-full mb-4">
            <Shield className="w-3.5 h-3.5 text-brand" />
            <span className="text-xs font-medium text-brand">Threat Detection Engine</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Malware <span className="text-gradient">Scanner</span>
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            100% offline malware detection engine with signature matching, heuristic analysis, entropy scanning,
            and SHA256 hash verification. No cloud — no telemetry — no data leaving your device.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-16">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} variant="glass" className="text-center py-6">
                <Icon className="w-6 h-6 text-brand mx-auto mb-3" />
                <div className="text-2xl sm:text-3xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-xs text-gray-500 font-medium uppercase tracking-wider">{stat.label}</div>
              </Card>
            );
          })}
        </div>

        <div className="mb-16">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Zap className="w-5 h-5 text-brand" />
            Scan Modes
          </h2>
          <div className="grid sm:grid-cols-2 gap-5">
            {scanModes.map((mode) => {
              const Icon = mode.icon;
              return (
                <Card key={mode.title} variant="glass" hover>
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-brand" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-bold text-white">{mode.title}</h3>
                        <Badge variant={mode.badgeVariant} size="sm">{mode.badge}</Badge>
                      </div>
                      <p className="text-sm text-gray-400 mt-1">{mode.description}</p>
                    </div>
                  </div>
                  <div className="space-y-1.5 mb-5">
                    {mode.features.map((f) => (
                      <div key={f} className="flex items-center gap-2 text-sm text-gray-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                  <Button to="/download" variant="outline" size="sm" iconRight={ArrowRight}>
                    Use in Desktop App
                  </Button>
                </Card>
              );
            })}
          </div>
        </div>

        <div className="mb-16">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-brand" />
            Detection Engine
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {detectionMethods.map((method) => {
              const Icon = method.icon;
              return (
                <Card key={method.title} variant="glass" className="h-full">
                  <div className="flex flex-col h-full">
                    <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center mb-4 shrink-0">
                      <Icon className="w-5 h-5 text-brand" />
                    </div>
                    <h3 className="text-sm font-bold text-white mb-2">{method.title}</h3>
                    <p className="text-xs text-gray-400 leading-relaxed flex-1">{method.desc}</p>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-brand" />
            Risk Classification
          </h2>
          <div className="grid sm:grid-cols-4 gap-4">
            {[
              { level: 'Low', range: '0 — 14', color: 'text-green-400', border: 'border-green-500/30', bg: 'bg-green-500/5', icon: Shield },
              { level: 'Medium', range: '15 — 39', color: 'text-yellow-400', border: 'border-yellow-500/30', bg: 'bg-yellow-500/5', icon: AlertTriangle },
              { level: 'High', range: '40 — 69', color: 'text-orange-400', border: 'border-orange-500/30', bg: 'bg-orange-500/5', icon: AlertTriangle },
              { level: 'Critical', range: '70 — 100', color: 'text-red-400', border: 'border-red-500/30', bg: 'bg-red-500/5', icon: AlertTriangle },
            ].map((risk) => {
              const Icon = risk.icon;
              return (
                <Card key={risk.level} variant="dark" className={`${risk.bg} ${risk.border} text-center py-6`}>
                  <Icon className={`w-6 h-6 ${risk.color} mx-auto mb-3`} />
                  <div className={`text-lg font-bold ${risk.color} mb-0.5`}>{risk.level}</div>
                  <div className="text-xs text-gray-500 font-mono">{risk.range}</div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
