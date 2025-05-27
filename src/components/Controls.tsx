'use client';

import React from 'react';

interface ControlsProps {
  onSpin: () => void;
  spinning: boolean;
  attemptsLeft: number;
  isGuest?: boolean;
  isLoggedIn?: boolean; 
  guestSpinUsed?: boolean; 
  isTestMode?: boolean; 
  showLoginPrompt?: () => void;
}

const Controls: React.FC<ControlsProps> = ({ 
  onSpin, 
  spinning, 
  attemptsLeft, 
  isGuest, 
  isLoggedIn, 
  guestSpinUsed, 
  isTestMode, 
  showLoginPrompt 
}) => {
  // Logic from SlotMachine for when guest has spun and should be prompted to login
  const guestShouldLogin = isGuest && guestSpinUsed;

  // Determine if the user can spin
  let canSpinByUserAttempts = true;
  if (isGuest) {
    canSpinByUserAttempts = !guestSpinUsed;
  } else if (isLoggedIn) {
    canSpinByUserAttempts = isTestMode ? true : attemptsLeft > 0;
  }

  const canSpin = !spinning && canSpinByUserAttempts;
  
  let buttonText = 'DREHEN';
  if (spinning) {
    buttonText = 'Dreht...';
  } else if (guestShouldLogin) {
    buttonText = 'Anmelden für +3 Spins';
  }

  return (
    <div className="flex flex-col items-center justify-center p-4 w-full">
      <button 
        onClick={() => {
          // Extrem wichtig: Absolut keine Klicks während des Drehens zulassen
          if (spinning) {
            console.log('BUTTON IST GESPERRT! KLICK WIRD IGNORIERT!');
            return;
          }
          
          if (guestShouldLogin && showLoginPrompt) {
            showLoginPrompt();
          } else if (canSpin) {
            onSpin();
          }
        }}
        // Extrem wichtig: CSS pointer-events: none während des Drehens und div disabled
        style={spinning ? { pointerEvents: 'none', cursor: 'not-allowed' } : {}}
        disabled={spinning || (!canSpin && !guestShouldLogin)}
        className={`
          w-full max-w-xs py-4 px-8 text-2xl font-bold font-white-gorilla rounded-lg shadow-lg transition-all duration-300 ease-in-out 
          transform hover:scale-105 focus:outline-none focus:ring-4
          ${spinning ? 'bg-gray-700 opacity-70 cursor-wait' : // Eindeutig anderer Stil für den drehenden Zustand
           (!canSpin && !guestShouldLogin) ? 'bg-gray-500 cursor-not-allowed' : 
           'bg-gradient-to-r from-yellow-500 to-red-500 text-white cursor-pointer hover:from-yellow-600 hover:to-red-600 focus:ring-red-300'}
        `}
      >
        {buttonText}
      </button>
      {!isTestMode && !canSpinByUserAttempts && isLoggedIn && !spinning && (
        <p className="text-red-400 mt-2 text-sm">
          Keine Versuche mehr für heute!
        </p>
      )}
       {guestShouldLogin && (
        <p className="text-yellow-400 mt-2 text-sm">
          Klicke oben, um dich anzumelden und weiterzuspielen!
        </p>
      )}
    </div>
  );
};

export default Controls;
