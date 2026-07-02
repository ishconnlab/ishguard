import React from 'react';
import { Shield, Download, Monitor, Smartphone, Globe, Lock, Brain, Cpu, Network, FileSearch, Bell, Zap, Server, Layers, RefreshCw, Siren, Eye, ShieldAlert } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

const serviceCategories = [
  {
    title: 'Detection & Prevention',
    icon: Shield,
    items: [
      { icon: Brain, title: 'AI Behavioral Analysis', desc: 'Detects ransomware, cryptominers, rootkits, and zero-day threats using heuristic behavioral patterns.' },
      { icon: FileSearch, title: 'Advanced Malware Scanner', desc: 'Signature-based, heuristic, and entropy analysis across all file types. Scans archives, executables, and documents.' },
      { icon: Siren, title: 'Ransomware Protection', desc: 'Real-time monitoring for file encryption activity, ransom note creation, and unauthorized modifications.' },
      { icon: Eye, title: 'Process Monitoring', desc: 'Continuous analysis of running processes for injection, hooking, credential theft, and suspicious behavior.' },
    ],
  },
  {
    title: 'Platform Protection',
    icon: Monitor,
    items: [
      { icon: ShieldAlert, title: 'USB Drive Security', desc: 'AutoRun infector detection, shortcut virus scanning, and hidden executable discovery on removable media.' },
      { icon: Lock, title: 'Browser Protection', desc: 'Extension risk analysis, phishing site detection, and secure browsing recommendations for all major browsers.' },
      { icon: Cpu, title: 'System Health Monitor', desc: 'Real-time CPU, memory, disk, and process monitoring with intelligent optimization recommendations.' },
      { icon: Network, title: 'Network Security', desc: 'Interface monitoring, public WiFi detection, firewall status, and Wi-Fi encryption analysis.' },
    ],
  },
  {
    title: 'Enterprise Features',
    icon: Server,
    items: [
      { icon: Bell, title: 'Smart Alert System', desc: 'Context-aware notifications with risk scoring, anomaly detection, and actionable remediation steps.' },
      { icon: RefreshCw, title: 'Security Hardening', desc: '10+ Windows Group Policy checks with one-click fixes for firewall, UAC, Defender, RDP, and more.' },
      { icon: Layers, title: 'Quarantine Manager', desc: 'Full quarantine lifecycle: isolate threats, restore false positives, delete permanently, or empty all.' },
      { icon: Zap, title: 'Performance Optimized', desc: 'Minimal footprint (<50MB), efficient scanning, background operation with no system slowdown.' },
    ],
  },
];

export default function Services() {
  return (
    <div className="pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16 animate-slide-up">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand/10 border border-brand/20 rounded-full mb-4">
            <Shield className="w-3.5 h-3.5 text-brand" />
            <span className="text-xs font-medium text-brand">Platform Features</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            Enterprise <span className="text-gradient">Protection Suite</span>
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Comprehensive security features powered by our AI engine, designed for modern enterprises
          </p>
        </div>

        {serviceCategories.map((category, ci) => {
          const CatIcon = category.icon;
          return (
            <div key={ci} className="mb-16">
              <div className="flex items-center gap-3 mb-8">
                <CatIcon className="w-6 h-6 text-brand" />
                <h2 className="text-xl font-bold text-white">{category.title}</h2>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {category.items.map((item, ii) => {
                  const Icon = item.icon;
                  return (
                    <Card key={ii} glass hover>
                      <div className="p-2.5 rounded-lg bg-brand/10 border border-brand/20 w-fit mb-4">
                        <Icon className="w-5 h-5 text-brand" />
                      </div>
                      <h3 className="text-sm font-semibold text-white mb-2">{item.title}</h3>
                      <p className="text-xs text-gray-400 leading-relaxed">{item.desc}</p>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}

        <div className="text-center mt-12">
          <Button to="/download" size="lg" icon={Download}>Get Started Free</Button>
        </div>
      </div>
    </div>
  );
}
