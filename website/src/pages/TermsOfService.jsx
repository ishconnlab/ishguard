import React from 'react';
import { FileText } from 'lucide-react';

export default function TermsOfService() {
  return (
    <div className="pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12 animate-slide-up">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand/10 border border-brand/20 rounded-full mb-4">
            <FileText className="w-3.5 h-3.5 text-brand" />
            <span className="text-xs font-medium text-brand">Legal</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Terms of <span className="text-gradient">Service</span>
          </h1>
        </div>

        <div className="space-y-6 text-sm text-gray-400">
          <section>
            <h2 className="text-lg font-bold text-white mb-3">1. Acceptance of Terms</h2>
            <p>By downloading, installing, or using ISHGuard ("the Software"), you agree to these Terms of Service. If you do not agree, do not use the Software.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">2. License</h2>
            <p>ISHGuard is licensed under the MIT License. You are free to use, modify, and distribute the Software subject to the terms of that license.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">3. No Warranty</h2>
            <p>The Software is provided "as is" without warranty of any kind. The authors make no guarantees regarding the Software's effectiveness in detecting or preventing security threats.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">4. Limitation of Liability</h2>
            <p>The authors shall not be liable for any damages arising from the use or inability to use the Software, including but not limited to data loss, system damage, or security breaches.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">5. Privacy</h2>
            <p>ISHGuard does not collect, store, or transmit any personal data. See our Privacy Policy for details.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
