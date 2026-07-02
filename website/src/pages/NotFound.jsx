import React from 'react';
import { Shield, Home } from 'lucide-react';
import Button from '../components/ui/Button';

export default function NotFound() {
  return (
    <div className="pt-24 pb-16 min-h-screen flex items-center justify-center">
      <div className="text-center animate-scale-in">
        <div className="inline-flex p-4 rounded-2xl bg-brand/10 border border-brand/20 mb-6">
          <Shield className="w-12 h-12 text-brand" />
        </div>
        <h1 className="text-5xl sm:text-7xl font-bold text-gradient mb-4">404</h1>
        <h2 className="text-xl font-semibold text-white mb-2">Page Not Found</h2>
        <p className="text-gray-400 mb-8 max-w-md mx-auto">The page you're looking for doesn't exist or has been moved to a new location.</p>
        <Button to="/" icon={Home} size="lg">Back to Home</Button>
      </div>
    </div>
  );
}
