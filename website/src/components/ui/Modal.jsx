import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export default function Modal({ open, onClose, title, children, actions }) {
  const overlayRef = useRef(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      const handler = (e) => { if (e.key === 'Escape') onClose(); };
      window.addEventListener('keydown', handler);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handler);
      };
    }
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in" />
      <div className="relative w-full max-w-md animate-slide-up">
        <div className="bg-dark-800/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl shadow-black/50 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
            <h3 className="text-sm font-semibold text-white">{title}</h3>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-500 hover:text-white transition-colors rounded-lg hover:bg-white/5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="px-5 py-4 text-sm text-gray-300 leading-relaxed max-h-[60vh] overflow-y-auto">
            {children}
          </div>
          {actions && (
            <div className="flex justify-end items-center gap-2 px-5 py-3 border-t border-white/5 bg-black/20">
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
