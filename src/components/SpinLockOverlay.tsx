'use client';

import React from 'react';

interface SpinLockOverlayProps {
  isActive: boolean;
}

/**
 * A transparent overlay that blocks all user interaction during spins
 * This is an absolute failsafe to prevent any clicks or interactions during spinning
 */
const SpinLockOverlay: React.FC<SpinLockOverlayProps> = ({ isActive }) => {
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
      {/* Wartezeit-Anzeige entfernt */}
    </div>
  );
};

export default SpinLockOverlay;
