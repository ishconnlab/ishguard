import React from 'react';

export default function Skeleton({ className = '', variant = 'text', width, height }) {
  const base = 'animate-pulse bg-white/5 rounded-lg';
  const variants = {
    text: 'h-4 w-full',
    title: 'h-6 w-3/4',
    avatar: 'h-10 w-10 rounded-full',
    card: 'h-32 w-full',
    metric: 'h-20 w-full',
    button: 'h-9 w-24',
  };
  return <div className={`${base} ${variants[variant]} ${className}`} style={{ width, height }} />;
}

export function SkeletonCard() {
  return (
    <div className="card space-y-3">
      <Skeleton variant="title" />
      <Skeleton variant="text" className="w-1/2" />
      <Skeleton variant="text" />
      <Skeleton variant="text" className="w-2/3" />
    </div>
  );
}

export function SkeletonMetric() {
  return (
    <div className="card">
      <Skeleton variant="text" className="w-1/3 mb-2" />
      <Skeleton variant="metric" />
    </div>
  );
}

export function SkeletonList({ count = 3 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02]">
          <Skeleton variant="avatar" />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" className="w-1/2" />
            <Skeleton variant="text" className="w-1/4" />
          </div>
        </div>
      ))}
    </div>
  );
}
