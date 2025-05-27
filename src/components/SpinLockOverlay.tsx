'use client';

import React from 'react';

interface SpinLockOverlayProps {
  isActive: boolean;
  remainingTime?: number;
}

/**
 * A transparent overlay that blocks all user interaction during spins
 * This is an absolute failsafe to prevent any clicks or interactions during spinning
 */
const SpinLockOverlay: React.FC<SpinLockOverlayProps> = ({ isActive, remainingTime }) => {
  if (!isActive) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-transparent" 
      style={{ pointerEvents: 'all', cursor: 'not-allowed' }}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('OVERLAY KLICK BLOCKIERT! Bitte warten bis die Animation fertig ist.');
      }}
    >
      {remainingTime && remainingTime > 0 && (
        <div className="absolute bottom-20 left-0 right-0 flex justify-center">
          <div className="bg-black bg-opacity-70 text-white py-2 px-4 rounded-full">
            Bitte warten... {Math.ceil(remainingTime / 1000)}s
          </div>
        </div>
      )}
    </div>
  );
};

export default SpinLockOverlay;
