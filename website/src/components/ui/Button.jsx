import React from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const variants = {
  primary: 'bg-gradient-to-r from-brand to-brand-light text-white hover:shadow-lg hover:shadow-brand/25 hover:-translate-y-0.5',
  secondary: 'bg-dark-700/50 text-gray-200 border border-dark-600/50 hover:bg-dark-600/50 hover:border-brand/30',
  danger: 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/40',
  ghost: 'text-gray-400 hover:text-white hover:bg-white/5',
  outline: 'border border-brand/30 text-brand hover:bg-brand/10 hover:border-brand/50',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-7 py-3 text-base',
  xl: 'px-10 py-4 text-lg',
};

const base =
  'inline-flex items-center gap-2 font-medium rounded-xl border transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 focus-visible:ring-offset-dark-900 disabled:opacity-50 disabled:pointer-events-none select-none';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  href,
  to,
  icon: Icon,
  iconRight: IconRight,
  loading,
  disabled,
  className = '',
  ...props
}) {
  const isDisabled = disabled || loading;

  const classes = `${base} ${variants[variant]} ${sizes[size]} ${className}`;

  const content = (
    <>
      {loading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
      {!loading && Icon && <Icon className="w-4 h-4 shrink-0" />}
      {children && <span className="truncate">{children}</span>}
      {!loading && IconRight && <IconRight className="w-4 h-4 shrink-0" />}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={classes} aria-disabled={isDisabled} {...props}>
        {content}
      </Link>
    );
  }

  if (href) {
    return (
      <a
        href={isDisabled ? undefined : href}
        className={classes}
        target="_blank"
        rel="noopener noreferrer"
        aria-disabled={isDisabled}
        {...props}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      type="button"
      disabled={isDisabled}
      className={classes}
      {...props}
    >
      {content}
    </button>
  );
}
