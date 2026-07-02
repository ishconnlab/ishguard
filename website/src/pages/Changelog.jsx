import React from 'react';
import { Clock, Star, Shield, Cpu, Layers, Zap, Wifi, Brain, Smartphone, Globe } from 'lucide-react';
import Badge from '../components/ui/Badge';

const releases = [
  {
    version: '3.0.0',
    date: 'July 2026',
    badge: 'latest',
    icon: Shield,
    changes: [
      { type: 'feature', text: 'Complete brand identity redesign with premium AI-circuit shield logo' },
      { type: 'feature', text: 'Completely redesigned SOC dashboard with real-time AI risk meter' },
      { type: 'feature', text: 'Ransomware behavior detection engine' },
      { type: 'feature', text: 'Cryptominer and process injection detection' },
      { type: 'feature', text: 'Phishing and credential theft analysis' },
      { type: 'feature', text: 'Rootkit/bootkit detection capability' },
      { type: 'feature', text: 'Memory injection and browser extension analysis' },
      { type: 'feature', text: 'Anomaly detection with risk spike alerts' },
      { type: 'feature', text: 'Score breakdown by security category' },
      { type: 'feature', text: 'Priority-ranked recommendations engine' },
      { type: 'feature', text: '10 security detection rules (up from 5)' },
      { type: 'feature', text: 'Website: complete redesign with glassmorphism, animations, SOC demo' },
      { type: 'feature', text: 'Website: route-level code splitting for faster loads' },
      { type: 'feature', text: 'Website: JSON-LD structured data for SEO' },
      { type: 'feature', text: 'Website: skip-to-content link and accessibility improvements' },
      { type: 'feature', text: 'Desktop: enhanced IPC with 48+ channels' },
      { type: 'feature', text: 'Engine: duplicate finder now async (non-blocking)' },
      { type: 'feature', text: 'Engine: file checker uses streaming SHA256' },
      { type: 'feature', text: 'Engine: network scanner detects firewall status' },
      { type: 'feature', text: 'Engine: shortcut virus scanner improved binary detection' },
      { type: 'fix', text: 'Disk usage percent now correctly calculated' },
      { type: 'fix', text: 'Process monitor reduces false positives for legitimate tools' },
      { type: 'fix', text: 'Hidden file detection on Windows drives' },
      { type: 'fix', text: 'Network scanner handles non-English locales' },
      { type: 'fix', text: 'Quarantine index schema validation on load' },
      { type: 'fix', text: 'Splash screen removed on DOMContentLoaded' },
    ],
  },
  {
    version: '2.0.0',
    date: 'December 2025',
    changes: [
      { type: 'feature', text: 'AI Advisor engine with risk scoring and explanations' },
      { type: 'feature', text: 'Feature validation module for engine health checks' },
      { type: 'feature', text: 'Security hardening advisor with 10 Windows policy checks' },
      { type: 'feature', text: 'Content Vault with AI Reader subsystem' },
      { type: 'feature', text: 'Smart Vault: save, organize, analyze, search, export content' },
      { type: 'feature', text: 'AI Reader: summarize, key points, concepts, flashcards, study notes' },
      { type: 'feature', text: 'Content capture: URL analysis, metadata extraction, classification' },
      { type: 'feature', text: 'Compliance: URL validation, DRM detection, file type detection' },
      { type: 'feature', text: 'Website: 14-page React SPA with PWA support' },
      { type: 'feature', text: 'Desktop: Electron app with 48 IPC channels and local API server' },
      { type: 'feature', text: 'Android: React Native app with 4-tab navigation' },
      { type: 'feature', text: 'Branding: complete logo suite (8 variants)' },
    ],
  },
  {
    version: '1.0.0',
    date: 'October 2025',
    changes: [
      { type: 'feature', text: 'Initial release with core security engine' },
      { type: 'feature', text: '8 scanner modules: system health, network, processes, files, duplicates, shortcuts, malware, quarantine' },
      { type: 'feature', text: '10 malware signatures covering EICAR, downloaders, obfuscation, and more' },
      { type: 'feature', text: 'Security rules engine with 5 detection rules' },
      { type: 'feature', text: 'Basic Electron desktop shell' },
    ],
  },
];

export default function Changelog() {
  return (
    <div className="pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12 animate-slide-up">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand/10 border border-brand/20 rounded-full mb-4">
            <Clock className="w-3.5 h-3.5 text-brand" />
            <span className="text-xs font-medium text-brand">Version History</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Release <span className="text-gradient">Changelog</span>
          </h1>
        </div>

        <div className="space-y-8">
          {releases.map((release, ri) => {
            const Icon = release.icon || Shield;
            return (
              <div key={ri} className="glass-card rounded-xl p-6 animate-scale-in" style={{ animationDelay: `${ri * 100}ms` }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-brand/10 border border-brand/20">
                    <Icon className="w-5 h-5 text-brand" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-white">v{release.version}</h2>
                      {release.badge === 'latest' && <Badge variant="success" size="sm">Latest</Badge>}
                    </div>
                    <p className="text-xs text-gray-500">{release.date}</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  {release.changes.map((change, ci) => (
                    <div key={ci} className="flex items-start gap-2 text-sm">
                      <span className={`mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0 ${change.type === 'feature' ? 'bg-brand' : change.type === 'fix' ? 'bg-safe' : 'bg-gray-500'}`} />
                      <span className="text-gray-300">{change.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
