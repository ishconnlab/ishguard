import React from 'react';

const variants = {
  default: 'bg-brand/10 text-brand border-brand/20',
  success: 'bg-green-500/10 text-green-400 border-green-500/20',
  warning: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  danger: 'bg-red-500/10 text-red-400 border-red-500/20',
  info: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  premium: 'bg-gradient-to-r from-brand/20 to-purple-500/20 text-gradient-subtle border-brand/20',
  outline: 'bg-transparent border-gray-600/50 text-gray-400',
};

const sizes = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
  lg: 'px-3 py-1.5 text-sm',
};

const dotColors = {
  default: 'bg-brand',
  success: 'bg-green-400',
  warning: 'bg-yellow-400',
  danger: 'bg-red-400',
  info: 'bg-blue-400',
  premium: 'bg-brand',
  outline: 'bg-gray-400',
};

const glowStyles = {
  default: 'shadow-[0_0_8px_rgba(249,115,22,0.25)]',
  success: 'shadow-[0_0_8px_rgba(74,222,128,0.25)]',
  warning: 'shadow-[0_0_8px_rgba(250,204,21,0.25)]',
  danger: 'shadow-[0_0_8px_rgba(239,68,68,0.25)]',
  info: 'shadow-[0_0_8px_rgba(96,165,250,0.25)]',
  premium: 'shadow-[0_0_12px_rgba(249,115,22,0.35)]',
  outline: 'shadow-none',
};

export default function Badge({
  children, variant = 'default', size = 'md', dot = false,
  glow = false, className = '', ...props
}) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 rounded-full font-medium border',
        variants[variant] || variants.default,
        sizes[size] || sizes.md,
        glow && (glowStyles[variant] || glowStyles.default),
        className,
      ].filter(Boolean).join(' ')}
      {...props}
    >
      {dot && (
        <span className={['w-1.5 h-1.5 rounded-full', dotColors[variant] || dotColors.default].join(' ')} />
      )}
      {children}
    </span>
  );
}
