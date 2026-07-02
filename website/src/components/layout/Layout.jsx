import React from 'react';
import Header from './Header';
import Footer from './Footer';
import AIChat from './AIChat';
import PWAInstallBanner from './PWAInstallBanner';

export default function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-dark-900">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-brand focus:text-white focus:rounded-lg">
        Skip to main content
      </a>
      <Header />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <Footer />
      <AIChat />
      <PWAInstallBanner />
    </div>
  );
}
