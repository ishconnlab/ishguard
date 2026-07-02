import { Shield, Cpu, Network, FileSearch, Lock, Brain, CameraOff, Wifi, Zap, Server, Globe, Layers, Download, Cloud, Monitor, Smartphone, Users, Award, BarChart3, Bell, RefreshCw, Eye, ShieldAlert, Siren, Fingerprint } from 'lucide-react';

export const features = [
  { icon: Brain, category: 'ai', title: 'AI-Powered Threat Detection', description: 'Behavioral analysis engine detects ransomware, cryptominers, rootkits, and zero-day threats in real-time, 100% offline.' },
  { icon: Shield, category: 'protection', title: 'Multi-Layered Protection', description: 'Quick, full, custom, USB, registry, memory, browser, and startup scans provide comprehensive defense coverage.' },
  { icon: Network, category: 'network', title: 'Network Security Analyzer', description: 'Monitor network interfaces, detect public WiFi risks, check firewall status, and identify unsecured connections.' },
  { icon: Cpu, category: 'performance', title: 'System Health Monitoring', description: 'Real-time CPU, memory, disk, and process monitoring with intelligent performance optimization recommendations.' },
  { icon: Lock, category: 'privacy', title: 'Privacy-First Architecture', description: '100% offline operation. Zero data collection. No telemetry. No cloud dependency. Your data stays on your device.' },
  { icon: FileSearch, category: 'scanning', title: 'Advanced Malware Scanner', description: 'Signature-based detection, heuristic analysis, entropy scanning, and SHA256 hash verification against known threats.' },
  { icon: Siren, category: 'protection', title: 'Ransomware Protection', description: 'Detects ransomware behavior patterns, file encryption activity, and blocks unauthorized modifications in real-time.' },
  { icon: Eye, category: 'monitoring', title: 'Process Behavior Analysis', description: 'Monitor running processes for injection, hooking, credential theft, and other advanced attack techniques.' },
  { icon: ShieldAlert, category: 'protection', title: 'USB Drive Security', description: 'AutoRun infector detection, shortcut virus scanning, and hidden executable discovery on removable drives.' },
  { icon: Bell, category: 'alerts', title: 'Smart Alert System', description: 'Context-aware notifications with risk scoring, anomaly detection, and actionable remediation recommendations.' },
  { icon: Fingerprint, category: 'identity', title: 'Identity Protection', description: 'Monitor for credential theft, keyloggers, phishing attempts, and unauthorized access to sensitive data.' },
  { icon: RefreshCw, category: 'maintenance', title: 'Automated Hardening', description: '10+ Windows security policy checks with one-click fixes. Firewall, UAC, Defender, RDP, and more.' },
  { icon: Download, category: 'platform', title: 'Desktop Agent', description: 'Native Windows application with system tray, context menus, global notifications, and background protection.' },
  { icon: Monitor, category: 'platform', title: 'Web Dashboard', description: 'Real-time SOC dashboard with live metrics, AI risk meter, feature validation, and security timeline.' },
  { icon: Smartphone, category: 'platform', title: 'Mobile Companion', description: 'Android app with device health monitoring, permission auditing, AI assistant, and vault synchronization.' },
  { icon: Globe, category: 'platform', title: 'Browser Protection', description: 'Extension risk analysis, phishing site detection, and secure browsing recommendations.' },
];

export const trustIndicators = [
  { value: '100%', label: 'Offline & Private', detail: 'No data leaves your device' },
  { value: '<50MB', label: 'Lightweight', detail: 'Minimal system footprint' },
  { value: '48+', label: 'Engine Modules', detail: 'Comprehensive coverage' },
  { value: 'Zero', label: 'Data Collection', detail: 'Privacy by design' },
  { value: '10+', label: 'Hardening Checks', detail: 'Enterprise security policies' },
  { value: '24/7', label: 'Real-Time Protection', detail: 'Always monitoring' },
];

export const securityPhilosophy = [
  { icon: Lock, title: 'Privacy by Design', description: 'Built from the ground up with no cloud dependency. All analysis happens locally on your device.' },
  { icon: Brain, title: 'Intelligence First', description: 'AI-driven behavioral analysis that learns threat patterns without compromising your privacy.' },
  { icon: Shield, title: 'Enterprise Grade', description: 'Professional security tools used by organizations worldwide, now available for everyone.' },
  { icon: Award, title: 'Continuous Innovation', description: 'Regular updates with new detection signatures, hardening checks, and security improvements.' },
];
