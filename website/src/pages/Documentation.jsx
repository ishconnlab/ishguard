import React, { useState } from 'react';
import {
  BookOpen, Download, Cpu, Shield, Layers,
  Bluetooth, Search, Check, HardDrive, AlertTriangle
} from 'lucide-react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';

const sections = [
  {
    id: 'getting-started',
    number: 1,
    title: 'Getting Started',
    icon: Download,
    intro: 'Everything you need to install, set up, and start using ISHGuard. From downloading the installer to understanding AI risk scores — this section covers the fundamentals.',
    items: [
      {
        title: 'Download & Install',
        blocks: [
          { type: 'text', value: 'Visit the ISHGuard Download page at ishguard.com/download. You have two options:' },
          { type: 'features', items: [
            'Installer (.exe) — 71 MB — Recommended for most users. Includes setup wizard.',
            'Portable (.exe) — 71 MB — No installation needed. Run directly from USB drive.',
            'For mobile: Request the APK via WhatsApp at +250 787 377 750 or email ishconnlab@gmail.com.',
            'All downloads are free. No registration required.',
          ]},
          { type: 'subtitle', value: 'Installation Steps' },
          { type: 'steps', items: [
            'Run the downloaded ISHGuard-Setup-3.0.0.exe file',
            'If Windows SmartScreen appears, click "More info" then "Run anyway"',
            'Choose your preferred language and click OK',
            'Select installation folder (default: C:\\Program Files\\ISHGuard)',
            'Check "Create desktop shortcut" for easy access',
            'Click Install and wait for the process to complete (30–60 seconds)',
            'Check "Run ISHGuard" and click Finish',
          ]},
          { type: 'text', value: 'The app launches automatically and appears in your system tray (bottom-right corner).' },
          { type: 'subtitle', value: 'System Requirements' },
          { type: 'features', items: [
            'Windows 10 or 11 (64-bit only)',
            '4 GB RAM minimum (8 GB recommended)',
            '200 MB free disk space',
            'Internet connection for updates only',
            'All security scans run 100% OFFLINE — no data leaves your device',
          ]},
        ],
      },
      {
        title: 'First-Time Setup',
        blocks: [
          { type: 'text', value: 'When you launch ISHGuard for the first time:' },
          { type: 'steps', items: [
            'The app opens to the Security Dashboard',
            'AI Engine loads automatically (31 modules verified)',
            'A FIRST-RUN SYSTEM SCAN starts automatically after 3 seconds',
            'The scan checks your system for malware, threats, and security issues',
            'Results appear in the Threat Scanner tab',
            'AI analyzes the results and shows a risk score (0–100)',
          ]},
          { type: 'text', value: 'Your system is being protected from the moment you install.' },
        ],
      },
      {
        title: 'Dashboard Overview',
        blocks: [
          { type: 'text', value: 'The dashboard provides a real-time view of your system security:' },
          { type: 'features', items: [
            'AI Risk Meter — Circular gauge showing your security score',
            'System Metrics — CPU, Memory, Disk usage',
            'Protection Status — Protected / Attention / Critical',
            'Recent Timeline — Security events and scan history',
            'Quick Actions — One-click access to scans and tools',
            'AI Observations — Key findings from the latest analysis',
          ]},
          { type: 'text', value: 'Metrics update automatically every 5 seconds. AI refreshes every 30 seconds.' },
        ],
      },
      {
        title: 'Understanding AI Risk Scores',
        blocks: [
          { type: 'text', value: 'ISHGuard evaluates your system security and assigns a risk score from 0 to 100:' },
          { type: 'features', items: [
            '0–14: LOW — System is healthy. No action needed.',
            '15–39: MEDIUM — Minor issues found. Review recommendations.',
            '40–69: HIGH — Significant threats detected. Take action soon.',
            '70–100: CRITICAL — Immediate action required. System at risk.',
          ]},
          { type: 'text', value: 'Each finding includes an explanation, impact assessment, and step-by-step remediation guide.' },
        ],
      },
    ],
  },
  {
    id: 'malware-scanner',
    number: 2,
    title: 'Malware Scanner',
    icon: Shield,
    intro: 'Run comprehensive threat scans across your system with real-time progress tracking and detailed results. ISHGuard detects malware, ransomware, cryptominers, rootkits, and more.',
    items: [
      {
        title: 'Running a Threat Scan',
        blocks: [
          { type: 'text', value: 'To start a malware scan:' },
          { type: 'steps', items: [
            'Click "Threat Scanner" in the left sidebar',
            'Choose either "Scan System" to scan your user folder (recommended) or "Select Folder" to choose a specific directory',
            'Watch the circular scan animation as files are checked — the ring fills up as scanning progresses',
            'Results show detected threats, suspicious files, and safe items',
            'Click "Quarantine All" to isolate threats safely',
          ]},
          { type: 'subtitle', value: 'What ISHGuard Detects' },
          { type: 'features', items: [
            'Malware — Viruses, trojans, worms, and spyware',
            'Ransomware — File encryption pattern detection',
            'Cryptominers — Hidden cryptocurrency mining software',
            'Rootkits — Kernel-level threat identification',
            'Phishing — Credential harvesting attempt detection',
            'Process Injection — Hidden code in legitimate processes',
          ]},
        ],
      },
    ],
  },
  {
    id: 'usb-drive-scan',
    number: 3,
    title: 'USB Drive Scan',
    icon: HardDrive,
    intro: 'USB drives can carry shortcut viruses and AutoRun malware. ISHGuard detects and removes threats from removable drives before they infect your system.',
    items: [
      {
        title: 'Scanning USB Drives',
        blocks: [
          { type: 'steps', items: [
            'Click "USB Drive Scan" in the sidebar',
            'Insert your USB drive into the computer',
            'Click "Scan All Drives"',
            'All detected removable drives are checked automatically',
            'Threats are highlighted in red with detailed information',
            'Click "Clean Drive" to remove suspicious files',
          ]},
          { type: 'subtitle', value: 'Detection Capabilities' },
          { type: 'features', items: [
            'Shortcut viruses (.lnk files pointing to malware)',
            'AutoRun infectors that execute on drive mount',
            'Hidden executables on drive roots',
            'VBS/Obfuscated scripts on removable media',
            'Suspicious autorun.inf configurations',
          ]},
        ],
      },
    ],
  },
  {
    id: 'duplicate-finder',
    number: 4,
    title: 'Duplicate Finder',
    icon: Layers,
    intro: 'Free up disk space by finding and removing duplicate files. ISHGuard uses SHA256 content hashing to detect exact duplicates regardless of file name or location.',
    items: [
      {
        title: 'Finding Duplicates',
        blocks: [
          { type: 'text', value: 'ISHGuard compares files by their SHA256 content hash — if the hash matches, the files are identical.' },
          { type: 'steps', items: [
            'Click "Duplicate Finder" in the sidebar',
            'Click "Scan User Folders" or "Select Folder" to choose a custom directory',
            'ISHGuard compares files by SHA256 content hash across the selected directory',
            'Results show duplicate groups with file sizes and locations',
            'Review duplicates and delete unnecessary copies to reclaim space',
          ]},
          { type: 'code', label: 'Verify a file hash manually', code: 'certutil -hashfile "path\\to\\file.txt" SHA256' },
          { type: 'features', items: [
            'SHA256 content-based comparison — no false positives from same-name files',
            'Groups duplicates by hash for easy batch processing',
            'Shows file sizes and paths for informed deletion decisions',
            'Works on any locally accessible directory',
          ]},
        ],
      },
    ],
  },
  {
    id: 'quarantine-manager',
    number: 5,
    title: 'Quarantine Manager',
    icon: AlertTriangle,
    intro: 'Safely isolate detected threats in the quarantine zone. ISHGuard gives you full control to review, restore false positives, or permanently remove malicious files.',
    items: [
      {
        title: 'Quarantining Threats',
        blocks: [
          { type: 'text', value: 'When a threat is detected during a scan, you can isolate it immediately:' },
          { type: 'steps', items: [
            'Run a threat scan using the Malware Scanner',
            'Review detected threats in the results panel',
            'Click "Quarantine All" to isolate all threats at once, or select individual items',
            'Files are moved to a secure quarantine directory and disabled from execution',
            'Each quarantined item is logged with original path, threat type, and timestamp',
          ]},
        ],
      },
      {
        title: 'Managing Quarantined Items',
        blocks: [
          { type: 'text', value: 'The Quarantine Manager provides complete control over isolated threats:' },
          { type: 'features', items: [
            'View all quarantined items with threat type, file name, and date',
            'Restore false positives to their original location with one click',
            'Permanently delete confirmed threats from the quarantine zone',
            'Empty quarantine to remove all items at once',
            'View quarantine statistics: total count, total size, oldest item',
            'All operations are reversible except permanent deletion',
          ]},
          { type: 'code', label: 'Quarantine storage location', code: 'C:\\Users\\<you>\\AppData\\Local\\ISHGuard\\quarantine\\' },
        ],
      },
    ],
  },
  {
    id: 'ai-advisor',
    number: 6,
    title: 'AI Advisor',
    icon: Cpu,
    intro: 'ISHGuard\'s built-in AI engine analyzes scan results to detect advanced threats and provides actionable recommendations — 100% offline with no cloud dependency.',
    items: [
      {
        title: 'AI-Powered Analysis',
        blocks: [
          { type: 'text', value: 'Every scan result is analyzed by ISHGuard\'s offline AI engine. It evaluates findings across multiple dimensions:' },
          { type: 'features', items: [
            'Ransomware Detection — Identifies file encryption patterns',
            'Cryptominer Detection — Finds hidden cryptocurrency miners',
            'Phishing Detection — Detects credential harvesting attempts',
            'Rootkit Detection — Identifies kernel-level threats',
            'Process Injection — Spots hidden code in legitimate processes',
            'Anomaly Detection — Flags unusual behavior patterns',
          ]},
          { type: 'text', value: 'The AI produces a risk score (0–100), risk level (Low/Medium/High/Critical), a natural language summary with per-finding explanations, and actionable recommendations for each finding.' },
        ],
      },
      {
        title: 'Security Hardening',
        blocks: [
          { type: 'text', value: 'ISHGuard checks 10 critical Windows security settings and provides one-click fix commands:' },
          { type: 'features', items: [
            'Windows Firewall — Must be active',
            'UAC (User Account Control) — Should be enabled',
            'Windows Defender — Real-time protection must be on',
            'Remote Desktop — Should be disabled if unused',
            'SMB Protocol — Secure configuration required',
            'Guest Account — Should be disabled',
            'Automatic Updates — Should be enabled',
            'Windows Defender SmartScreen — Must be active',
            'PowerShell Execution Policy — Restricted recommended',
            'BitLocker — Encryption recommended for sensitive data',
          ]},
        ],
      },
      {
        title: 'AI Reader Mode',
        blocks: [
          { type: 'text', value: 'Analyze any text content with the built-in AI Reader — perfect for studying, research, and content comprehension:' },
          { type: 'steps', items: [
            'Open Content Vault and select AI Reader',
            'Paste or type the text you want to analyze',
            'Click "AI Analyze"',
            'Get instant results: Summary, Key Points, Key Concepts, Word Count',
            'Save analyses to your Vault for later reference',
          ]},
        ],
      },
    ],
  },
  {
    id: 'bluetooth-security',
    number: 7,
    title: 'Bluetooth Security',
    icon: Bluetooth,
    intro: 'Monitor Bluetooth file transfers and discover nearby devices for potential security risks. ISHGuard automatically scans incoming Bluetooth transfers for malware.',
    items: [
      {
        title: 'Bluetooth File Scanning',
        blocks: [
          { type: 'text', value: 'ISHGuard monitors files received via Bluetooth for malware and threats. When a Bluetooth transfer is detected:' },
          { type: 'steps', items: [
            'The file is automatically flagged as an incoming transfer',
            'ISHGuard scans it using the same malware detection engine (25+ signatures)',
            'If safe — the file is marked as SAFE and remains accessible',
            'If a threat is detected — you get a 3-button prompt with actions',
          ]},
          { type: 'subtitle', value: 'Threat Prompt Options' },
          { type: 'features', items: [
            'DELETE — Permanently removes the infected file from your system',
            'QUARANTINE — Isolates the file in the quarantine zone for later review',
            'CANCEL — Cancels the action, leaving the file in place (not recommended for threats)',
          ]},
        ],
      },
      {
        title: 'Discovering Bluetooth Devices',
        blocks: [
          { type: 'text', value: 'ISHGuard scans for nearby Bluetooth devices to help you monitor connections and identify unknown devices that may pose a security risk.' },
          { type: 'features', items: [
            'Lists all paired and available Bluetooth devices',
            'Shows connection status (Connected / Disconnected)',
            'Displays device names and pairing state',
            'Helps identify unknown or unauthorized devices',
          ]},
          { type: 'text', value: 'To scan: Open Bluetooth Security in the desktop app and click "Scan Devices".' },
        ],
      },
      {
        title: 'Monitoring Transfer Directories',
        blocks: [
          { type: 'text', value: 'ISHGuard watches these common Bluetooth transfer folders for new files:' },
          { type: 'code', label: 'Monitored directories', code: 'C:\\Users\\<you>\\Downloads\\Bluetooth\\\nC:\\Users\\<you>\\Documents\\Bluetooth\\\nWindows Temp directories' },
          { type: 'text', value: 'When new files appear, they are automatically queued for scanning. Click "Check Transfers" to scan any pending files. Use the desktop agent for real-time protection.' },
        ],
      },
    ],
  },
];

function CodeBlock({ code, label }) {
  if (!code) return null;
  return (
    <div className="space-y-1.5">
      {label && (
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</span>
      )}
      <pre className="bg-dark-900/90 border border-white/5 rounded-lg p-4 overflow-x-auto">
        <code className="text-sm font-mono text-gray-300 leading-relaxed whitespace-pre">{code}</code>
      </pre>
    </div>
  );
}

function FeatureList({ items }) {
  if (!items?.length) return null;
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-2.5">
          <Check className="w-4 h-4 text-safe mt-0.5 shrink-0" />
          <span className="text-sm text-gray-400 leading-relaxed">{item}</span>
        </div>
      ))}
    </div>
  );
}

function StepList({ items }) {
  if (!items?.length) return null;
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-2.5">
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-brand/10 border border-brand/20 text-brand text-xs font-bold shrink-0 mt-0.5">
            {i + 1}
          </span>
          <span className="text-sm text-gray-400 leading-relaxed pt-0.5">{item}</span>
        </div>
      ))}
    </div>
  );
}

function ContentBlock({ block }) {
  switch (block.type) {
    case 'text':
      return <p className="text-sm text-gray-400 leading-relaxed">{block.value}</p>;
    case 'subtitle':
      return <h4 className="text-sm font-semibold text-white">{block.value}</h4>;
    case 'features':
      return <FeatureList items={block.items} />;
    case 'steps':
      return <StepList items={block.items} />;
    case 'code':
      return <CodeBlock code={block.code} label={block.label} />;
    default:
      return null;
  }
}

const blockGap = (blocks, idx) => {
  if (idx === 0) return '';
  const prev = blocks[idx - 1];
  if (prev.type === 'subtitle') return 'mt-4';
  if (prev.type === 'code') return 'mt-4';
  return 'mt-3';
};

export default function Documentation() {
  const [searchQuery, setSearchQuery] = useState('');

  const handleTocClick = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="pt-24 pb-16">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* ── Header ── */}
        <div className="text-center mb-12 animate-slide-up">
          <Badge variant="premium" size="lg" dot glow className="mb-4">
            <BookOpen className="w-3.5 h-3.5" />
            Documentation
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            <span className="text-gradient">Documentation</span>
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Complete guide to ISHGuard's security features, offline AI engine, system architecture, and
            everything you need to stay protected.
          </p>
        </div>

        {/* ── Search — decorative ── */}
        <div className="relative mb-10 max-w-md mx-auto animate-slide-up delay-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Search documentation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-dark-800/50 border border-white/5 rounded-xl text-sm text-white placeholder-gray-500 outline-none focus:border-brand/30 focus:ring-1 focus:ring-brand/20 transition-all"
          />
        </div>

        {/* ── Layout ── */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* ── TOC — sticky card on desktop, horizontal on mobile ── */}
          <div className="lg:w-56 shrink-0">
            <Card variant="glass" className="hidden lg:block lg:sticky lg:top-24" padding={false}>
              <nav className="p-3 space-y-1">
                <span className="block px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  On this page
                </span>
                {sections.map((s) => {
                  const Icon = s.icon;
                  return (
                    <button
                      key={s.id}
                      onClick={() => handleTocClick(s.id)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all border border-transparent hover:border-white/5"
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{s.title}</span>
                    </button>
                  );
                })}
              </nav>
            </Card>

            {/* Mobile TOC — horizontal scroll */}
            <div className="lg:hidden -mx-4 px-4 mb-6 overflow-x-auto scrollbar-none animate-slide-up delay-1">
              <div className="flex gap-2 pb-2 min-w-max">
                {sections.map((s) => {
                  const Icon = s.icon;
                  return (
                    <button
                      key={s.id}
                      onClick={() => handleTocClick(s.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-dark-800/60 border border-white/5 text-gray-400 hover:text-white hover:border-brand/30 transition-all whitespace-nowrap"
                    >
                      <Icon className="w-3 h-3" />
                      <span>{s.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── Content ── */}
          <div className="flex-1 min-w-0 space-y-8">
            {sections.map((section, idx) => {
              const Icon = section.icon;
              return (
                <div
                  key={section.id}
                  id={section.id}
                  className={`animate-slide-up delay-${Math.min(idx + 1, 8)}`}
                >
                  <Card variant="glass" hover={false}>
                    {/* Section Header */}
                    <div className="flex items-center gap-3 mb-2">
                      <Badge variant="premium" size="sm" glow>
                        {String(section.number).padStart(2, '0')}
                      </Badge>
                      <div className="flex items-center gap-2.5">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand/10 border border-brand/20">
                          <Icon className="w-4 h-4 text-brand" />
                        </div>
                        <h2 className="text-xl font-bold">
                          <span className="text-gradient-subtle">{section.title}</span>
                        </h2>
                      </div>
                    </div>

                    {/* Intro */}
                    <p className="text-sm text-gray-400 leading-relaxed ml-14 mb-6">
                      {section.intro}
                    </p>

                    {/* Items */}
                    <div className="space-y-6">
                      {section.items.map((item, i) => (
                        <div key={i} className="border-t border-white/5 pt-5 first:border-0 first:pt-0">
                          <h3 className="text-base font-semibold text-white mb-3">{item.title}</h3>
                          <div className="space-y-0">
                            {item.blocks.map((block, bi) => (
                              <div key={bi} className={blockGap(item.blocks, bi)}>
                                <ContentBlock block={block} />
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
