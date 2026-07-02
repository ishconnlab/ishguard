import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, ArrowRight, Play, Star, ChevronDown } from 'lucide-react';

export default function Hero() {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-brand/5 via-transparent to-dark-900 pointer-events-none" />
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-brand/10 rounded-full blur-[128px] animate-pulse" />
      <div className="absolute bottom-1/4 -right-32 w-80 h-80 bg-brand/5 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-16">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="space-y-8 animate-slide-up">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand/10 border border-brand/20 rounded-full">
              <span className="w-2 h-2 bg-brand rounded-full animate-pulse" />
              <span className="text-xs font-medium text-brand tracking-wide">v3.0 Enterprise AI Platform</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold leading-[1.1] tracking-tight">
              <span className="text-white">Enterprise AI</span>
              <br />
              <span className="text-gradient">Cybersecurity</span>
              <br />
              <span className="text-white/80">That Respects Your Privacy</span>
            </h1>

            <p className="text-lg sm:text-xl text-gray-400 max-w-xl leading-relaxed">
              AI-powered, offline-first security platform. Protect your devices with intelligent threat detection, behavioral analysis, and enterprise-grade protection — all without compromising your privacy.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/download"
                className="inline-flex items-center justify-center gap-2.5 px-8 py-4 bg-brand hover:bg-brand-dark text-white font-semibold rounded-xl transition-all duration-200 shadow-2xl shadow-brand/30 hover:shadow-brand/50 hover:-translate-y-0.5 text-base"
              >
                <Shield className="w-5 h-5" />
                Get ISHGuard Free
              </Link>
              <Link
                to="/dashboard"
                className="inline-flex items-center justify-center gap-2.5 px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-xl border border-white/10 transition-all duration-200 text-base"
              >
                <Play className="w-5 h-5" />
                Live Demo
              </Link>
            </div>

            <div className="flex items-center gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-warning fill-warning" />
                <span>100% Offline</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-safe" />
                <span>No Data Collection</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-safe rounded-full" />
                <span>AI-Powered</span>
              </div>
            </div>
          </div>

          <div className="relative animate-fade-in hidden lg:block">
            <div className="relative glass-card rounded-2xl p-6 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-brand/5 to-transparent pointer-events-none" />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-risk rounded-full" />
                    <div className="w-3 h-3 bg-warning rounded-full" />
                    <div className="w-3 h-3 bg-safe rounded-full" />
                  </div>
                  <span className="text-xs text-gray-500 font-mono">SOC Dashboard v3</span>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  {[
                    { label: 'CPU', value: '23%', status: 'safe' },
                    { label: 'Memory', value: '6.2 GB', status: 'safe' },
                    { label: 'Network', value: 'Secured', status: 'safe' },
                    { label: 'Processes', value: '142', status: 'safe' },
                  ].map(m => (
                    <div key={m.label} className="bg-dark-900/50 rounded-lg p-3 border border-white/5">
                      <div className="text-xs text-gray-500 mb-1">{m.label}</div>
                      <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full bg-${m.status}`} />
                        <span className="text-sm font-semibold text-white">{m.value}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-dark-900/50 rounded-lg p-3 border border-white/5 mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500">AI Risk Assessment</span>
                    <span className="text-xs text-safe font-medium">Low Risk</span>
                  </div>
                  <div className="w-full h-1.5 bg-dark-800 rounded-full overflow-hidden">
                    <div className="h-full w-1/4 bg-gradient-to-r from-safe to-warning rounded-full" />
                  </div>
                </div>

                <div className="space-y-2">
                  {[
                    { icon: '🛡️', text: 'All systems operational', time: '2m ago' },
                    { icon: '✓', text: 'AI engine analyzed 1,247 processes', time: '5m ago' },
                    { icon: '✓', text: 'Last full scan: No threats found', time: '15m ago' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <span>{item.icon}</span>
                      <span className="text-gray-400 flex-1">{item.text}</span>
                      <span className="text-gray-600">{item.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="absolute -top-4 -right-4 w-20 h-20 bg-brand/20 rounded-full blur-2xl animate-pulse" />
            <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-brand/10 rounded-full blur-xl animate-pulse" style={{ animationDelay: '1.5s' }} />
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <ChevronDown className="w-5 h-5 text-gray-600" />
      </div>
    </section>
  );
}
