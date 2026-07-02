import React, { useState, useEffect } from 'react';
import { Download as DownloadIcon, Monitor, Smartphone, Globe, Shield, Star, CheckCircle, Phone, Mail } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

const platforms = [
  {
    icon: Monitor,
    name: 'Windows',
    version: 'v3.0.0',
    size: '~45 MB',
    type: 'Desktop Agent',
    features: ['Full AI protection suite', 'Real-time monitoring', 'System tray integration', 'All scanner modules', 'Quarantine management', 'Security hardening'],
    installers: [
      { label: 'Installer (.exe) — 71 MB', file: 'ISHGuard-Setup-3.0.0.exe', primary: true },
      { label: 'Portable (.exe) — 71 MB', file: 'ISHGuard.exe' },
    ],
  },
  {
    icon: Smartphone,
    name: 'Android',
    version: 'v1.0.0',
    size: '~12 MB',
    type: 'Mobile Companion',
    features: ['Device health monitoring', 'Permission auditing', 'AI security analysis', 'Content vault', 'Network security check', 'Biometric auth'],
    installers: [
      { label: 'APK Download', file: 'ISHGuard-Mobile-1.0.0.apk', primary: true },
      { label: 'Request APK via WhatsApp', external: 'https://wa.me/250787377750' },
    ],
  },
  {
    icon: Globe,
    name: 'Web Dashboard',
    version: 'v3.0.0',
    size: 'PWA',
    type: 'Browser App',
    features: ['SOC-style dashboard', 'Live system metrics', 'AI risk assessment', 'Content vault access', 'Documentation', 'Install as PWA'],
    installers: [
      { label: 'Open Dashboard', to: '/dashboard', primary: true },
      { label: 'Install PWA', action: 'pwa', primary: false },
    ],
  },
];

export default function Download() {
  const [selected, setSelected] = React.useState('Windows');

  return (
    <div className="pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16 animate-slide-up">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand/10 border border-brand/20 rounded-full mb-4">
            <DownloadIcon className="w-3.5 h-3.5 text-brand" />
            <span className="text-xs font-medium text-brand">Free Download</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            Get <span className="text-gradient">ISHGuard</span> Free
          </h1>
          <p className="text-lg text-gray-400 max-w-xl mx-auto">
            Enterprise AI cybersecurity, free for everyone. No subscriptions. No data collection. No cloud dependency.
          </p>
        </div>

        <div className="flex justify-center gap-3 mb-12">
          {platforms.map(p => (
            <button
              key={p.name}
              onClick={() => setSelected(p.name)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                selected === p.name ? 'bg-brand text-white shadow-lg shadow-brand/25' : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <p.icon className="w-4 h-4" />
              {p.name}
            </button>
          ))}
        </div>

        {platforms.filter(p => p.name === selected).map((platform) => (
          <div key={platform.name} className="grid lg:grid-cols-5 gap-8">
            <div className="lg:col-span-3 space-y-6">
              <Card glass>
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 rounded-xl bg-brand/10 border border-brand/20">
                    <platform.icon className="w-8 h-8 text-brand" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">{platform.name} {platform.type}</h2>
                    <p className="text-sm text-gray-400">Version {platform.version} &middot; {platform.size}</p>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-3 mb-6">
                  {platform.features.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-gray-400">
                      <CheckCircle className="w-4 h-4 text-safe flex-shrink-0" />
                      {f}
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  {platform.installers.map((inst, i) => {
                    if (inst.to) return <Button key={i} to={inst.to} variant={inst.primary ? 'primary' : 'secondary'} size="lg" icon={inst.primary ? DownloadIcon : Globe} className="w-full justify-center">{inst.label}</Button>;
                    if (inst.external) return <Button key={i} href={inst.external} variant={inst.primary ? 'primary' : 'secondary'} size="lg" icon={DownloadIcon} className="w-full justify-center">{inst.label}</Button>;
                    if (inst.action === 'pwa') return <Button key={i} variant="secondary" size="lg" icon={DownloadIcon} className="w-full justify-center" onClick={() => { if (window.deferredPrompt) { window.deferredPrompt.prompt(); } }}>{inst.label}</Button>;
                    if (inst.file) return <Button key={i} href={`/downloads/${inst.file}`} variant={inst.primary ? 'primary' : 'secondary'} size="lg" icon={DownloadIcon} className="w-full justify-center">{inst.label}</Button>;
                    return null;
                  })}
                </div>
              </Card>
            </div>

            <div className="lg:col-span-2 space-y-4">
              <Card glass>
                <h3 className="text-sm font-semibold text-white mb-3">System Requirements</h3>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-brand" />Windows 10/11 (64-bit)</li>
                  <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-brand" />4GB RAM minimum</li>
                  <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-brand" />200MB disk space</li>
                  <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-brand" />Internet for updates only</li>
                </ul>
              </Card>
              <Card glass>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Shield className="w-4 h-4 text-safe" />
                  <span>Digitally signed by ISHGuard</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400 mt-2">
                  <Star className="w-4 h-4 text-warning" />
                  <span>Open source &amp; audited</span>
                </div>
              </Card>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
