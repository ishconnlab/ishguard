import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import ErrorBoundary from './components/ui/ErrorBoundary';

const Home = lazy(() => import('./pages/Home'));
const Services = lazy(() => import('./pages/Services'));
const Agent = lazy(() => import('./pages/Agent'));
const Download = lazy(() => import('./pages/Download'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Vault = lazy(() => import('./pages/Vault'));
const Documentation = lazy(() => import('./pages/Documentation'));
const SecurityRules = lazy(() => import('./pages/SecurityRules'));
const Changelog = lazy(() => import('./pages/Changelog'));
const FAQ = lazy(() => import('./pages/FAQ'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const License = lazy(() => import('./pages/License'));
const Scanner = lazy(() => import('./pages/Scanner'));
const SecurityTools = lazy(() => import('./pages/SecurityTools'));
const NotFound = lazy(() => import('./pages/NotFound'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <div className="flex flex-col items-center gap-5 animate-fade-in">
        <div className="relative">
          <div className="w-12 h-12 border-[3px] border-brand/20 border-t-brand rounded-full animate-spin" />
          <div className="absolute inset-0 w-12 h-12 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-brand animate-pulse" />
          </div>
        </div>
        <div className="text-center">
          <p className="text-gray-400 text-sm font-medium">Loading ISHGuard</p>
          <p className="text-gray-600 text-xs mt-1">Preparing security modules...</p>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Layout>
      <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/services" element={<Services />} />
          <Route path="/agent" element={<Agent />} />
          <Route path="/download" element={<Download />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/vault" element={<Vault />} />
          <Route path="/docs" element={<Documentation />} />
          <Route path="/security-rules" element={<SecurityRules />} />
          <Route path="/changelog" element={<Changelog />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/license" element={<License />} />
          <Route path="/scanner" element={<Scanner />} />
          <Route path="/duplicate-finder" element={<SecurityTools />} />
          <Route path="/usb-scan" element={<SecurityTools />} />
          <Route path="/bluetooth-security" element={<SecurityTools />} />
          <Route path="/quarantine" element={<SecurityTools />} />
          <Route path="/hardening" element={<SecurityTools />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      </ErrorBoundary>
    </Layout>
  );
}
