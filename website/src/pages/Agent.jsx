import React from 'react';
import { Monitor, Download, Star, Cpu, Shield, Bell, Wifi, HardDrive, Activity, Layers, Clock, RefreshCw, Gauge } from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

const features = [
  { icon: Cpu, title: 'Real-Time Monitoring', desc: 'Continuous CPU, memory, disk, and network monitoring with intelligent alerts.' },
  { icon: Shield, title: 'AI Threat Detection', desc: 'Behavioral analysis engine detects threats without cloud dependency.' },
  { icon: Bell, title: 'System Tray Integration', desc: 'Background operation with quick access menu and real-time status icon.' },
  { icon: Wifi, title: 'Network Security', desc: 'Monitor WiFi security, detect public networks, and check firewall status.' },
  { icon: Layers, title: 'Quarantine Management', desc: 'Isolate, restore, and manage threats with full quarantine lifecycle.' },
  { icon: Gauge, title: 'Performance Dashboard', desc: 'Real-time SOC dashboard with live metrics, risk score, and AI insights.' },
  { icon: RefreshCw, title: 'Security Hardening', desc: 'Apply Windows security policies with one-click fixes.' },
  { icon: HardDrive, title: 'USB Drive Scanner', desc: 'Detect shortcut viruses and AutoRun infectors on removable drives.' },
];

export default function Agent() {
  return (
    <div className="pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-20 animate-slide-up">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand/10 border border-brand/20 rounded-full mb-4">
              <Monitor className="w-3.5 h-3.5 text-brand" />
              <span className="text-xs font-medium text-brand">Windows Desktop Agent</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
              Desktop <span className="text-gradient">Security Agent</span>
            </h1>
            <p className="text-lg text-gray-400 mb-6">
              Native Windows application with real-time protection, AI-powered threat detection, and enterprise-grade security tools. All running 100% offline.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button to="/download" size="lg" icon={Download}>Download for Windows</Button>
              <Button to="/dashboard" variant="secondary" size="lg" icon={Activity}>Live Demo</Button>
            </div>
            <div className="flex items-center gap-6 mt-6 text-sm text-gray-500">
              <div className="flex items-center gap-2"><Star className="w-4 h-4 text-warning fill-warning" /><span>Windows 10/11</span></div>
              <div className="flex items-center gap-2"><Star className="w-4 h-4 text-warning fill-warning" /><span>x64</span></div>
              <div className="flex items-center gap-2"><Star className="w-4 h-4 text-warning fill-warning" /><span>&lt;50MB</span></div>
            </div>
          </div>
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 bg-risk rounded-full" />
              <div className="w-3 h-3 bg-warning rounded-full" />
              <div className="w-3 h-3 bg-safe rounded-full" />
              <span className="text-xs text-gray-500 font-mono ml-2">ISHGuard Agent v3.0</span>
            </div>
            <div className="space-y-3">
              {[
                { icon: Cpu, label: 'CPU', value: '18%', status: 'safe' },
                { icon: Activity, label: 'Memory', value: '4.2 GB / 16 GB', status: 'safe' },
                { icon: HardDrive, label: 'Disk', value: '245 GB free', status: 'safe' },
                { icon: Wifi, label: 'Network', value: 'Secured - Private', status: 'safe' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-dark-900/50 border border-white/5">
                  <div className="flex items-center gap-2">
                    <item.icon className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-400">{item.label}</span>
                  </div>
                  <span className={`text-sm font-medium ${item.status === 'safe' ? 'text-safe' : 'text-warning'}`}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-white text-center mb-8">Agent Features</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <Card key={i} glass hover>
                <Icon className="w-5 h-5 text-brand mb-3" />
                <h3 className="text-sm font-semibold text-white mb-1">{f.title}</h3>
                <p className="text-xs text-gray-400">{f.desc}</p>
              </Card>
            );
          })}
        </div>

        <div className="glass-card rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Ready to Secure Your Device?</h2>
          <p className="text-gray-400 mb-6">Download the ISHGuard desktop agent and get enterprise-grade protection in minutes.</p>
          <Button to="/download" size="xl" icon={Download}>Download Free</Button>
        </div>
      </div>
    </div>
  );
}
