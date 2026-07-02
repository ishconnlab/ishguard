import React from 'react';
import { securityPhilosophy } from '../../data/features';

export default function Philosophy() {
  return (
    <section className="py-20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12 animate-slide-up">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand/10 border border-brand/20 rounded-full mb-4">
            <span className="text-xs font-medium text-brand">Our Principles</span>
          </div>
          <h2 className="section-heading mb-4">
            Security <span className="text-gradient">Philosophy</span>
          </h2>
          <p className="section-subheading">
            The principles that guide every feature we build
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {securityPhilosophy.map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className="glass-card rounded-xl p-6 group animate-scale-in" style={{ animationDelay: `${i * 100}ms` }}>
                <div className="inline-flex p-2.5 rounded-lg bg-brand/10 border border-brand/20 mb-4 text-brand">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{item.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
