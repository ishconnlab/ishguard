import React from 'react';
import { trustIndicators } from '../../data/features';

export default function TrustIndicators() {
  return (
    <section className="py-20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12 animate-slide-up">
          <h2 className="section-heading mb-4">
            Built for <span className="text-gradient">Trust</span>
          </h2>
          <p className="section-subheading">
            Every decision we make prioritizes your security and privacy
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {trustIndicators.map((item, i) => (
            <div key={i} className="glass-card rounded-xl p-5 text-center group animate-scale-in" style={{ animationDelay: `${i * 80}ms` }}>
              <div className="text-2xl sm:text-3xl font-bold text-gradient mb-1">{item.value}</div>
              <div className="text-sm font-medium text-white mb-1">{item.label}</div>
              <div className="text-xs text-gray-500">{item.detail}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
