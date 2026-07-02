import React from 'react';
import Hero from '../components/home/Hero';
import TrustIndicators from '../components/home/TrustIndicators';
import Features from '../components/home/Features';
import LivePreview from '../components/home/LivePreview';
import Philosophy from '../components/home/Philosophy';

export default function Home() {
  return (
    <>
      <Hero />
      <TrustIndicators />
      <Features />
      <LivePreview />
      <Philosophy />
    </>
  );
}
