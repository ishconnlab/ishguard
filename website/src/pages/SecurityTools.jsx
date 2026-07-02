import React, { useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Shield, Search, Wifi, Bluetooth, Lock, HardDrive, FolderLock, History, Eye, Monitor, AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';

const tools = [
  {
    id: 'duplicate-finder',
    icon: Search,
    title: 'Finding Duplicates',
    description: 'Identify and remove duplicate files on your system using SHA256 hash comparison. Free up valuable disk space by finding identical documents, photos, music, and videos across any directory.',
    features: [
      'SHA256 hash comparison for accurate duplicate detection',
      'Recursive directory scanning with exclusion filters',
      'File size and date grouping for smarter review',
      'Batch deletion or move-to-quarantine workflow',
    ],
  },
  {
    id: 'usb-scan',
    icon: HardDrive,
    title: 'USB Drive Scan',
    description: 'Scan removable drives for shortcut viruses, hidden executables, and autorun.inf malware. Protect against USB-borne threats before they compromise your system.',
    features: [
      'Shortcut virus detection (.lnk pointing to .exe/.vbs/.ps1)',
      'Autorun.inf infection analysis',
      'Hidden executable detection on drive roots',
      'One-click quarantine of all detected threats',
    ],
  },
  {
    id: 'bluetooth-security',
    icon: Bluetooth,
    title: 'Bluetooth Security',
    description: 'Audit Bluetooth devices on your network for security vulnerabilities. Detect unauthorized pairings, discoverable mode risks, and potential bluesnarfing or BlueBorne attacks.',
    features: [
      'Paired device inventory with security classification',
      'Discoverable mode detection and risk assessment',
      'Bluetooth firmware version auditing',
      'Recommendations to disable unused Bluetooth services',
    ],
  },
  {
    id: 'quarantine',
    icon: FolderLock,
    title: 'Quarantine Manager',
    description: 'Isolate, review, and manage all quarantined threats in one secure interface. Every detected file is safely contained with full metadata so you can make informed restore or delete decisions.',
    features: [
      'Centralized quarantine with threat metadata (hash, path, date)',
      'Safe restore with original file location preservation',
      'Permanent deletion with confirmation safeguards',
      'Bulk operations and quarantine statistics dashboard',
    ],
  },
  {
    id: 'hardening',
    icon: Shield,
    title: 'System Hardening',
    description: 'Apply 10 essential Windows Group Policy hardening checks to lock down your system. Get actionable fix commands for each vulnerability found, from firewall gaps to user account weaknesses.',
    features: [
      '10 comprehensive Group Policy security checks',
      'Live evaluation with pass/fail per check',
      'One-click fix command generation for each finding',
      'Overall hardening score with improvement tracking',
    ],
  },
];

const navItems = [
  { id: 'duplicate-finder', label: 'Duplicate Finder', icon: Search },
  { id: 'usb-scan', label: 'USB Drive Scan', icon: HardDrive },
  { id: 'bluetooth-security', label: 'Bluetooth Security', icon: Bluetooth },
  { id: 'quarantine', label: 'Quarantine', icon: FolderLock },
  { id: 'hardening', label: 'Hardening', icon: Shield },
];

export default function SecurityTools() {
  const location = useLocation();
  const sectionRefs = useRef({});

  useEffect(() => {
    const hash = location.hash.replace('#', '');
    if (hash && sectionRefs.current[hash]) {
      sectionRefs.current[hash].scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [location.hash]);

  const currentHash = location.hash.replace('#', '');

  return (
    <div className="pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12 animate-slide-up">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand/10 border border-brand/20 rounded-full mb-4">
            <Monitor className="w-3.5 h-3.5 text-brand" />
            <span className="text-xs font-medium text-brand">Security Suite</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Security <span className="text-gradient">Tools</span>
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            A complete suite of offline security tools designed to detect, analyze, quarantine, and harden
            your Windows system — no cloud dependency required.
          </p>
        </div>

        <nav className="sticky top-20 z-10 mb-8 -mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto hide-scrollbar">
          <div className="flex sm:flex-col sm:w-48 lg:w-56 gap-1.5 sm:gap-1 pb-2 sm:pb-0 sm:float-left sm:mr-8 sm:sticky sm:top-28">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = currentHash === item.id || (!currentHash && item.id === 'duplicate-finder');
              return (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className={[
                    'flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap shrink-0',
                    isActive
                      ? 'bg-brand/10 text-brand border border-brand/20 shadow-sm'
                      : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent',
                  ].join(' ')}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="hidden sm:inline">{item.label}</span>
                </a>
              );
            })}
          </div>
        </nav>

        <div className="sm:pl-56 lg:pl-64">
          <div className="space-y-6">
            {tools.map(tool => {
              const Icon = tool.icon;
              return (
                <Card
                  key={tool.id}
                  variant="glass"
                  id={tool.id}
                  ref={el => { sectionRefs.current[tool.id] = el; }}
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-brand" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white">{tool.title}</h2>
                      <p className="text-sm text-gray-400 mt-1">{tool.description}</p>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-2 mb-5">
                    {tool.features.map((feature, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-gray-300">
                        <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Button
                    to="/download"
                    variant="primary"
                    size="sm"
                    icon={ArrowRight}
                  >
                    Open in Desktop App
                  </Button>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
