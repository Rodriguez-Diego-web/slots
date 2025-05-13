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
    // For logged-in users, normally check attemptsLeft. 
    // If isTestMode is true, they can always spin (unless already spinning).
    canSpinByUserAttempts = isTestMode ? true : attemptsLeft > 0;
  }

  const canSpin = !spinning && canSpinByUserAttempts;
  
  let buttonText = 'DREHEN';
  if (spinning) {
    buttonText = 'Dreht...';
  } else if (guestShouldLogin) {
    buttonText = 'Anmelden für +3 Spins';
  }

  // The onClick for the button should directly call onSpin.
  // The SlotMachine's onSpin (handleSpin) will decide if it's a real spin or if it should show login modal.
  return (
    <div className="flex flex-col items-center justify-center p-4 w-full">
      <button 
        onClick={() => {
          if (guestShouldLogin && showLoginPrompt) {
            showLoginPrompt();
          } else {
            onSpin();
          }
        }}
        disabled={!canSpin && !guestShouldLogin} // Allow click for guest to login, disable if actually cannot spin
        className={`
          w-full max-w-xs py-4 px-8 text-2xl font-bold rounded-lg shadow-lg transition-all duration-300 ease-in-out 
          transform hover:scale-105 focus:outline-none focus:ring-4
          font-barber-chop tracking-wider
          ${(canSpin || guestShouldLogin) 
            ? 'bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500 text-white hover:from-yellow-500 hover:via-red-600 hover:to-pink-600 focus:ring-yellow-300'
            : 'bg-gray-600 text-gray-400 cursor-not-allowed'}
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
