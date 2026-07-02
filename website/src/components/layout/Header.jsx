import React, { useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { ShieldCheck, Menu, X } from 'lucide-react';

const navItems = [
  { path: '/', label: 'Home' },
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/scanner', label: 'Scanner' },
  { path: '/vault', label: 'Vault' },
  { path: '/docs', label: 'Documentation' },
  { path: '/download', label: 'Downloads' },
];

const linkClass = ({ isActive }) =>
  `px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
    isActive
      ? 'text-brand bg-brand/10 shadow-sm shadow-brand/5'
      : 'text-gray-400 hover:text-white hover:bg-white/5'
  }`;

const mobileLinkClass = ({ isActive }) =>
  `block px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
    isActive
      ? 'text-brand bg-brand/10'
      : 'text-gray-400 hover:text-white hover:bg-white/5'
  }`;

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-dark-900/80 backdrop-blur-xl border-b border-white/10 shadow-lg shadow-black/30'
          : 'bg-dark-900/40 backdrop-blur-sm'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-18">
          <Link to="/" className="flex items-center gap-2.5 group flex-shrink-0">
            <div className="relative">
              <ShieldCheck className="w-7 h-7 text-brand transition-transform duration-300 group-hover:scale-110 group-hover:drop-shadow-glow-sm" />
              <div className="absolute inset-0 w-7 h-7 bg-brand/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <span className="text-lg font-bold text-white tracking-tight">
              ISH<span className="text-brand">Guard</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <NavLink key={item.path} to={item.path} className={linkClass} end={item.path === '/'}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/download"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-brand to-brand-light text-white text-sm font-semibold rounded-lg transition-all duration-200 shadow-lg shadow-brand/25 hover:shadow-brand/40 hover:-translate-y-0.5 hover:from-brand-dark hover:to-brand"
            >
              <ShieldCheck className="w-4 h-4" />
              Get ISHGuard
            </Link>
          </div>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/5"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <div
        className={`md:hidden transition-all duration-300 ease-in-out overflow-hidden ${
          mobileOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <nav className="mx-4 mb-4 p-3 space-y-1 rounded-xl border border-white/10 bg-dark-800/90 backdrop-blur-xl shadow-xl shadow-black/30">
          {navItems.map((item) => (
            <NavLink key={item.path} to={item.path} className={mobileLinkClass} end={item.path === '/'}>
              {item.label}
            </NavLink>
          ))}
          <Link
            to="/download"
            className="flex items-center justify-center gap-2 mt-2 px-4 py-2.5 bg-gradient-to-r from-brand to-brand-light text-white text-sm font-semibold rounded-lg transition-all hover:from-brand-dark hover:to-brand shadow-lg shadow-brand/20"
          >
            <ShieldCheck className="w-4 h-4" />
            Get ISHGuard
          </Link>
        </nav>
      </div>
    </header>
  );
}
