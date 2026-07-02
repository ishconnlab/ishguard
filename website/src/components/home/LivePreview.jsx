import React from 'react';
import { Shield, Cpu, Network, Zap } from 'lucide-react';

const liveStats = [
  { icon: Cpu, label: 'Threats Blocked', value: '12,847', suffix: 'today' },
  { icon: Shield, label: 'Active Users', value: '3,421', suffix: 'protected' },
  { icon: Network, label: 'Scans Completed', value: '89.2K', suffix: 'total' },
  { icon: Zap, label: 'Response Time', value: '<50ms', suffix: 'average' },
];

export default function LivePreview() {
  return (
    <section className="py-20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-2xl border border-brand/10 bg-gradient-to-br from-dark-800 via-dark-800 to-brand/5">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand/5 rounded-full blur-3xl" />
          
          <div className="relative p-8 sm:p-12">
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3">
                Real-Time <span className="text-gradient">Protection Metrics</span>
              </h2>
              <p className="text-gray-400 max-w-xl mx-auto">
                Live statistics from our global protection network
              </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {liveStats.map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <div key={i} className="glass-card rounded-xl p-6 text-center group animate-scale-in" style={{ animationDelay: `${i * 100}ms` }}>
                    <Icon className="w-6 h-6 text-brand mx-auto mb-3" />
                    <div className="text-2xl sm:text-3xl font-bold text-white mb-1">{stat.value}</div>
                    <div className="text-xs text-gray-500">{stat.label}</div>
                    <div className="text-[10px] text-gray-600 mt-0.5">{stat.suffix}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
