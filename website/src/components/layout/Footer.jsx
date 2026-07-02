import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Mail, Phone, Globe, Github } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="relative border-t border-brand/20 bg-gradient-to-b from-dark-900/80 via-dark-900/95 to-dark-900 backdrop-blur-xl">
      <div className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-brand/40 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">

          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="p-2 rounded-lg bg-brand/10 border border-brand/20">
                <Shield className="w-5 h-5 text-brand" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">
                ISH<span className="text-brand">Guard</span>
              </span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed mb-4">
              Enterprise-grade AI cybersecurity platform protecting your digital world with proactive threat detection.
            </p>
            <p className="text-xs text-gray-500 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
              Powered by{' '}
              <a href="https://ishconnect.rw" target="_blank" rel="noopener noreferrer" className="text-brand hover:text-brand-light font-semibold transition-colors">
                ISHConnect
              </a>
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white mb-5 uppercase tracking-wider">Quick Links</h3>
            <ul className="space-y-3">
              {[
                { to: '/', label: 'Home' },
                { to: '/dashboard', label: 'Dashboard' },
                { to: '/scanner', label: 'Scanner' },
                { to: '/vault', label: 'Vault' },
                { to: '/docs', label: 'Documentation' },
                { to: '/download', label: 'Downloads' }
              ].map(item => (
                <li key={item.to}>
                  <Link to={item.to} className="text-sm text-gray-400 hover:text-brand transition-colors flex items-center gap-2 group">
                    <span className="w-1 h-1 rounded-full bg-gray-600 group-hover:bg-brand transition-colors" />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white mb-5 uppercase tracking-wider">Security Tools</h3>
            <ul className="space-y-3">
              {[
                { to: '/duplicate-finder', label: 'Duplicate Finder' },
                { to: '/usb-scan', label: 'USB Scan' },
                { to: '/bluetooth-security', label: 'Bluetooth Security' },
                { to: '/quarantine', label: 'Quarantine' },
                { to: '/hardening', label: 'Hardening' }
              ].map(item => (
                <li key={item.to}>
                  <Link to={item.to} className="text-sm text-gray-400 hover:text-brand transition-colors flex items-center gap-2 group">
                    <span className="w-1 h-1 rounded-full bg-gray-600 group-hover:bg-brand transition-colors" />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white mb-5 uppercase tracking-wider">Contact</h3>
            <ul className="space-y-4">
              <li>
                <a href="https://wa.me/250787377750" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-gray-400 hover:text-brand transition-colors group">
                  <div className="p-2 rounded-lg bg-white/5 group-hover:bg-brand/10 transition-colors">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">WhatsApp</p>
                    <p className="text-sm text-white">+250 787 377 750</p>
                  </div>
                </a>
              </li>
              <li>
                <a href="mailto:ishconnlab@gmail.com" className="flex items-center gap-3 text-sm text-gray-400 hover:text-brand transition-colors group">
                  <div className="p-2 rounded-lg bg-white/5 group-hover:bg-brand/10 transition-colors">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="text-sm text-white">ishconnlab@gmail.com</p>
                  </div>
                </a>
              </li>
              <li>
                <div className="flex items-center gap-3 text-sm text-gray-400 group">
                  <div className="p-2 rounded-lg bg-white/5">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Location</p>
                    <p className="text-sm text-white">Kigali, Rwanda</p>
                  </div>
                </div>
              </li>
            </ul>
          </div>

        </div>

        <div className="mt-12 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-500">
            &copy; 2026 ISHGuard. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link to="/privacy" className="text-xs text-gray-500 hover:text-brand transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="text-xs text-gray-500 hover:text-brand transition-colors">Terms of Service</Link>
            <Link to="/license" className="text-xs text-gray-500 hover:text-brand transition-colors">License</Link>
            <span className="w-px h-4 bg-white/10" />
            <a href="https://github.com/ishconnlab/ishguard" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-white/5 hover:bg-brand/10 text-gray-400 hover:text-brand transition-all" aria-label="GitHub">
              <Github className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
