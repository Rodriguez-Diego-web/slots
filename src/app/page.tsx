'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamisch importierte Komponenten mit SSR ausgeschaltet
const SlotMachine = dynamic(() => import('@/components/SlotMachine'), { ssr: false });
const SplashScreenContainer = dynamic(
  () => import('@/components/SplashScreen/SplashScreenContainer'),
  { ssr: false }
);

export default function Home() {
  // State zur Nachverfolgung, ob die Splash Screens abgeschlossen wurden
  // (derzeit nur für zukünftige Funktionalität verwendet)
  const [, setSplashCompleted] = useState(false);

  // Splash Screen abgeschlossen-Handler
  const handleSplashComplete = () => {
    setSplashCompleted(true);
  };

  // The main page structure (Header, Footer, main content padding for fixed elements)
  // is handled by src/app/layout.tsx.
  // The SlotMachine component itself uses max-w-md and mx-auto for its sizing and centering.
  return (
    <>
      {/* Splash Screen Container wird bei erstem Besuch angezeigt */}
      <SplashScreenContainer onComplete={handleSplashComplete} />
      
      {/* Slot Machine wird immer gerendert, aber Splash Screen überlagert sie bei Bedarf */}
      <SlotMachine />
    </>
  );
}
