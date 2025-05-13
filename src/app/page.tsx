'use client';

import dynamic from 'next/dynamic';

// Dynamically import SlotMachine component with no SSR
const SlotMachine = dynamic(() => import('@/components/SlotMachine'), { ssr: false });

export default function Home() {
  // The main page structure (Header, Footer, main content padding for fixed elements)
  // is handled by src/app/layout.tsx.
  // The SlotMachine component itself uses max-w-md and mx-auto for its sizing and centering.
  return (
    <SlotMachine />
  );
}
