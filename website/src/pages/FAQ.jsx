import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

const faqs = [
  { q: 'What is ISHGuard?', a: 'ISHGuard is an enterprise AI cybersecurity platform that provides comprehensive protection for Windows and Android devices. It features AI-powered threat detection, behavioral analysis, and security hardening — all running 100% offline with zero data collection.' },
  { q: 'Is ISHGuard really free?', a: 'Yes. ISHGuard is completely free with no subscriptions, no premium tiers, and no hidden costs. Enterprise features are available at no charge.' },
  { q: 'Does ISHGuard collect my data?', a: 'No. ISHGuard is built on a privacy-first architecture. All security analysis runs locally on your device. Zero data is collected, transmitted, or stored externally.' },
  { q: 'Does ISHGuard require an internet connection?', a: 'No. All core features including AI threat detection, malware scanning, and security hardening work completely offline. Internet is only needed for updates.' },
  { q: 'What platforms are supported?', a: 'ISHGuard Desktop Agent supports Windows 10/11 (64-bit). The mobile companion supports Android. A web dashboard is available for all modern browsers.' },
  { q: 'What types of threats does ISHGuard detect?', a: 'ISHGuard detects malware, ransomware, cryptominers, rootkits, trojans, worms, phishing attempts, credential theft, process injection, shortcut viruses, AutoRun infectors, and suspicious processes.' },
  { q: 'How does the AI security engine work?', a: 'The AI engine uses behavioral analysis to detect threats based on patterns and heuristics rather than relying on cloud-based signatures. It analyzes process behavior, network activity, file modifications, and system anomalies to identify potential threats.' },
  { q: 'Can ISHGuard run alongside other antivirus software?', a: 'Yes. ISHGuard complements existing security solutions without conflicts. Its behavioral analysis and system hardening features work alongside Windows Defender and other antivirus software.' },
  { q: 'How do I update ISHGuard?', a: 'ISHGuard checks for updates automatically. You can also download the latest version from our website. Updates include new detection signatures, hardening checks, and feature improvements.' },
  { q: 'Is ISHGuard open source?', a: 'Yes. ISHGuard is open source and publicly audited. The source code is available on GitHub for review and contribution.' },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <div className="pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12 animate-slide-up">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand/10 border border-brand/20 rounded-full mb-4">
            <HelpCircle className="w-3.5 h-3.5 text-brand" />
            <span className="text-xs font-medium text-brand">FAQ</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Frequently Asked <span className="text-gradient">Questions</span>
          </h1>
        </div>

        <div className="space-y-2">
          {faqs.map((faq, i) => (
            <div key={i} className="glass-card rounded-xl overflow-hidden transition-all">
              <button onClick={() => setOpenIndex(openIndex === i ? null : i)} className="w-full flex items-center justify-between p-4 text-left focus-ring">
                <span className="text-sm font-medium text-white pr-4">{faq.q}</span>
                <ChevronDown className={`w-4 h-4 text-gray-500 flex-shrink-0 transition-transform duration-200 ${openIndex === i ? 'rotate-180' : ''}`} />
              </button>
              <div className={`overflow-hidden transition-all duration-300 ${openIndex === i ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                <p className="px-4 pb-4 text-sm text-gray-400 leading-relaxed">{faq.a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
