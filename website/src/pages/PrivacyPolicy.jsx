import React from 'react';
import { Shield, Lock, Eye, Server, Database, Globe, CheckCircle, XCircle } from 'lucide-react';

const guarantees = [
  { icon: Eye, title: 'Zero Data Collection', desc: 'ISHGuard does not collect, store, or transmit any personal data, system information, or usage statistics.' },
  { icon: Server, title: '100% Local Processing', desc: 'All security analysis, AI processing, and threat detection runs entirely on your device. No cloud dependency.' },
  { icon: Lock, title: 'No Telemetry', desc: 'ISHGuard contains no telemetry, analytics, or usage tracking systems. No data leaves your device.' },
  { icon: Database, title: 'Local Storage Only', desc: 'Vault content, quarantine files, and settings are stored exclusively on your local device.' },
];

export default function PrivacyPolicy() {
  return (
    <div className="pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12 animate-slide-up">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand/10 border border-brand/20 rounded-full mb-4">
            <Shield className="w-3.5 h-3.5 text-brand" />
            <span className="text-xs font-medium text-brand">Privacy</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Privacy <span className="text-gradient">Policy</span>
          </h1>
          <p className="text-gray-400">Last updated: July 2026</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mb-12">
          {guarantees.map((g, i) => {
            const Icon = g.icon;
            return (
              <div key={i} className="glass-card rounded-xl p-5">
                <div className="p-2 rounded-lg bg-safe/10 border border-safe/20 w-fit mb-3">
                  <Icon className="w-4 h-4 text-safe" />
                </div>
                <h3 className="text-sm font-semibold text-white mb-1">{g.title}</h3>
                <p className="text-xs text-gray-400">{g.desc}</p>
              </div>
            );
          })}
        </div>

        <div className="prose prose-invert max-w-none space-y-6 text-sm text-gray-400">
          <section>
            <h2 className="text-lg font-bold text-white mb-3">1. Information We Do NOT Collect</h2>
            <p>ISHGuard is designed with privacy as its foundation. We do not collect:</p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Personal information (name, email, address)</li>
              <li>System information (hardware specs, installed software)</li>
              <li>Usage statistics or analytics</li>
              <li>Browsing history or website visits</li>
              <li>File contents or document data</li>
              <li>Network traffic or communications</li>
              <li>Location data</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">2. What Information We Store</h2>
            <p>All data is stored locally on your device:</p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Application settings and preferences</li>
              <li>Quarantine index and vault content</li>
              <li>Malware signature database (updated with app updates)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">3. Third-Party Services</h2>
            <p>ISHGuard does not integrate with any third-party analytics, advertising, or tracking services. The application operates entirely offline by default.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">4. Data Security</h2>
            <p>Since no data leaves your device, there is no data to secure in transit. All local data is protected by your device's existing security measures (Windows Hello, BitLocker, etc.).</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">5. Updates</h2>
            <p>ISHGuard updates may include new detection signatures, features, or security improvements. Update files are downloaded from our servers but contain no personally identifiable information.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">6. Contact</h2>
            <p>For privacy-related questions, contact us at <a href="https://ishconnect.rw" className="text-brand hover:underline">ishconnect.rw</a>.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
