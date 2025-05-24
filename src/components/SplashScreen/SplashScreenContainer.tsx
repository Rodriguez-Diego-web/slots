'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSwipeable } from 'react-swipeable';
import Cookies from 'js-cookie';
// Vollständige Pfade für lokale Komponenten verwenden
import SplashScreen from '@/components/SplashScreen/SplashScreen';
import SplashDots from '@/components/SplashScreen/SplashDots';

interface SplashScreenContainerProps {
  onComplete: () => void;
}

const COOKIE_NAME = 'cuxsnack_intro_viewed';
const COOKIE_EXPIRY = 365; // Tage

const SplashScreenContainer: React.FC<SplashScreenContainerProps> = ({ onComplete }) => {
  const [currentScreen, setCurrentScreen] = useState(0);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Prüfen, ob der Benutzer die Intro-Screens bereits gesehen hat
    const hasViewedIntro = Cookies.get(COOKIE_NAME);
    
    if (hasViewedIntro) {
      // Wenn ja, die Splash Screens überspringen
      setShowSplash(false);
      onComplete();
    }
  }, [onComplete]);

  // handleComplete zuerst definieren
  const handleComplete = useCallback(() => {
    // Cookie setzen, dass der Benutzer die Intro gesehen hat
    Cookies.set(COOKIE_NAME, 'true', { expires: COOKIE_EXPIRY });
    setShowSplash(false);
    if (onComplete) onComplete();
  }, [onComplete]);

  const handleNext = useCallback(() => {
    if (currentScreen < 3) { // Korrigiert: 4 Screens insgesamt, also bis Index 2 für 'Weiter'
      setCurrentScreen(prevScreen => prevScreen + 1);
    } else {
      handleComplete();
    }
  }, [currentScreen, handleComplete]);

  const handlePrevious = () => {
    if (currentScreen > 0) {
      setCurrentScreen(prevScreen => prevScreen - 1);
    }
  };

  const swipeHandlers = useSwipeable({
    onSwipedLeft: handleNext,
    onSwipedRight: handlePrevious,
    // Standard swipeable Optionen
    trackMouse: false
  });

  // Wenn showSplash false ist, nichts rendern
  if (!showSplash) return null;

  const splashContent = [
    {
      title: "Willkommen bei CuxSnack Slot Machine!",
      description: "Drehe die Walzen und gewinne tolle Snack-Preise. Wische nach links, um mehr zu erfahren!",
      image: "/splash/Design ohne Titel (3).png"
    },
    {
      title: "So funktioniert's",
      description: "Klicke auf DREHEN, um die Walzen zu starten. Drei gleiche Symbole bedeuten einen Gewinn!",
      image: "/splash/2.png"
    },
    {
      title: "Gewinne einlösen",
      description: "Bei einem Gewinn erhältst du einen einzigartigen Code. Zeige ihn im Laden vor, um deinen Preis zu erhalten!",
      image: "/splash/Design ohne Titel (4).png"
    },
    {
      title: "Unsere CuxSnack-Gewinne!",
      description: "Freu dich auf Takis, einen 10€ Gutschein, Doritos, Calypso, Snickers, Capri-Sonne oder knacke den Jackpot von 100€!",
      image: "/splash/Design ohne Titel (5).png"
    }
  ];

  return (
    <div 
      className="fixed inset-0 z-50 bg-black bg-opacity-90 overflow-hidden"
      {...swipeHandlers}
    >
      {/* Container mit absoluter Positionierung */}
      <div className="relative w-full h-full max-w-md mx-auto px-4">
        {/* Überspringen-Button */}
        <div className="absolute top-4 right-4">
          <button 
            onClick={handleComplete}
            className="text-white opacity-70 hover:opacity-100 px-4 py-2 text-sm"
          >
            Überspringen
          </button>
        </div>
        
        {/* Bild und Text im oberen Bereich */}
        <div className="absolute top-20 left-0 right-0">
          <SplashScreen 
            key={currentScreen} // Wichtig für die Transition
            title={splashContent[currentScreen].title}
            description={splashContent[currentScreen].description}
            image={splashContent[currentScreen].image}
            isLastScreen={currentScreen === 3} 
            isThirdScreen={currentScreen === 2} 
          />
        </div>

        {/* Dots und Button im unteren Bereich, absolut positioniert */}
        <div className="absolute bottom-24 left-0 right-0 flex flex-col items-center gap-6">
          <SplashDots 
            count={4} 
            active={currentScreen} 
            onDotClick={(index: number) => setCurrentScreen(index)} 
          />
          
          <button 
            onClick={currentScreen < 3 ? handleNext : handleComplete} 
            className="bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500 text-white font-bold py-3 px-8 rounded-lg w-full max-w-xs"
          >
            {currentScreen < 3 ? "Weiter" : "Los geht's!"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SplashScreenContainer;
