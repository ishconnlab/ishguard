import React from 'react';
import { features } from '../../data/features';

const categoryColors = {
  ai: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  protection: 'bg-brand/10 text-brand border-brand/20',
  network: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  performance: 'bg-green-500/10 text-green-400 border-green-500/20',
  privacy: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  scanning: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  monitoring: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  alerts: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  identity: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  maintenance: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
  platform: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
};

export default function Features() {
  const [activeCategory, setActiveCategory] = React.useState('all');
  const categories = ['all', ...new Set(features.map(f => f.category))];
  const filtered = activeCategory === 'all' ? features : features.filter(f => f.category === activeCategory);

  return (
    <section className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16 animate-slide-up">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand/10 border border-brand/20 rounded-full mb-4">
            <span className="text-xs font-medium text-brand">Comprehensive Platform</span>
          </div>
          <h2 className="section-heading mb-4">
            Enterprise-Grade <span className="text-gradient">Security Features</span>
          </h2>
          <p className="section-subheading">
            Over 48 engine modules providing comprehensive protection across every attack vector
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-lg text-xs font-medium capitalize transition-all duration-200 ${
                activeCategory === cat
                  ? 'bg-brand text-white shadow-lg shadow-brand/25'
                  : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {cat === 'all' ? 'All Features' : cat}
            </button>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((feature, i) => {
            const Icon = feature.icon;
            const colors = categoryColors[feature.category] || categoryColors.platform;
            return (
              <div key={i} className="glass-card rounded-xl p-6 group animate-scale-in" style={{ animationDelay: `${i * 50}ms` }}>
                <div className={`inline-flex p-2.5 rounded-lg border ${colors} mb-4`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
