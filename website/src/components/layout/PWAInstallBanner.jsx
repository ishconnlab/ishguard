import React, { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';

const DISMISSED_KEY = 'pwa-install-dismissed';

export default function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!localStorage.getItem(DISMISSED_KEY)) {
        setVisible(true);
      }
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    if (result.outcome === 'accepted') setDeferredPrompt(null);
    setVisible(false);
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, 'true');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-sm mx-auto md:mx-4 md:left-auto md:right-auto">
      <div className="glass-card rounded-xl p-4 flex items-center gap-3">
        <div className="flex-1">
          <p className="text-sm font-medium text-white">Install ISHGuard</p>
          <p className="text-xs text-gray-400 mt-0.5">Get the app for offline access</p>
        </div>
        <button onClick={handleInstall} className="flex items-center gap-1.5 px-3 py-1.5 bg-brand hover:bg-brand-dark text-white text-xs font-semibold rounded-lg transition-colors">
          <Download className="w-3.5 h-3.5" />
          Install
        </button>
        <button onClick={handleDismiss} className="p-1.5 text-gray-500 hover:text-white transition-colors" aria-label="Dismiss">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
