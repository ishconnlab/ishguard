import React, { useCallback } from 'react';

/**
 * @typedef {'default' | 'glass' | 'accent' | 'dark' | 'interactive'} CardVariant
 */

/**
 * Premium card component with multiple visual variants and interaction modes.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Card content
 * @param {string} [props.className=''] - Additional CSS classes
 * @param {CardVariant} [props.variant='default'] - Visual variant
 * @param {boolean} [props.hover=false] - Enable enhanced hover lift + glow
 * @param {boolean} [props.glow=false] - Enable outer orange glow
 * @param {boolean} [props.accent=false] - Orange left border accent
 * @param {boolean} [props.padding=true] - Apply standard padding
 * @param {function} [props.onClick] - Click handler (adds cursor-pointer + keyboard support)
 */
export default function Card({
  children,
  className = '',
  variant = 'default',
  hover = false,
  glow = false,
  accent = false,
  onClick,
  padding = true,
  ...props
}) {
  const handleKeyDown = useCallback(
    (e) => {
      if (onClick && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        onClick(e);
      }
    },
    [onClick],
  );

  const variantClass = {
    default: 'glass-card',
    glass: 'glass-card bg-white/[0.03]',
    accent: 'glass-card-accent',
    dark: 'bg-dark-900/80 border border-white/5',
    interactive: 'glass-card cursor-pointer group',
  }[variant] || 'glass-card';

  const hoverClasses = hover
    ? 'transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-xl hover:shadow-orange-500/10'
    : '';

  const glowClasses = glow ? 'glow-orange' : '';

  const accentClasses = accent
    ? 'border-l-2 border-l-orange-500'
    : '';

  const paddingClasses = padding ? 'p-5' : '';

  const clickClasses = onClick && variant !== 'interactive' ? 'cursor-pointer' : '';

  return (
    <div
      className={[
        'rounded-xl',
        variantClass,
        hoverClasses,
        glowClasses,
        accentClasses,
        paddingClasses,
        clickClasses,
        onClick ? 'focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-dark-950 outline-none' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={handleKeyDown}
      {...props}
    >
      {children}
    </div>
  );
}
