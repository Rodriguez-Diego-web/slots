'use client';

import { useEffect, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import dynamic from 'next/dynamic';

// Dynamischer Import für Confetti, um SSR-Probleme zu vermeiden
const ReactConfetti = dynamic(() => import('react-confetti'), {
  ssr: false,
});

interface WinPopupProps {
  winningWord: string | null;
  winAmount: number;
  onClose: () => void;
}

const WinPopup: React.FC<WinPopupProps> = ({ winningWord, onClose }) => {
  const [dimensions, setDimensions] = useState({ 
    width: typeof window !== 'undefined' ? window.innerWidth : 0, 
    height: typeof window !== 'undefined' ? window.innerHeight : 0 
  });

  useEffect(() => {
    // Setze die Fenstergröße beim Mount
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    // Event Listener für Fenstergrößenänderungen
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!winningWord) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 pointer-events-none">
        <ReactConfetti
          width={dimensions.width}
          height={dimensions.height}
          recycle={false}
          numberOfPieces={1000}
          gravity={0.5}
          initialVelocityY={20}
          tweenDuration={8000}
          colors={['#FFD700', '#FFA500', '#FF8C00', '#FF4500', '#FF0000', '#FF69B4', '#FF1493']}
          style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%' }}
        />
      </div>
      
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-800 p-6 md:p-8 rounded-lg shadow-xl text-center max-w-sm w-full">
          <h2 className="text-3xl md:text-4xl font-bold text-yellow-400 mb-4 font-barber-chop tracking-wider">
            Herzlichen Glückwunsch!
          </h2>
          <p className="text-white text-xl mb-2">Du hast gewonnen:</p>
          <p className="text-yellow-500 text-5xl md:text-6xl font-bold mb-6">{winningWord}</p>
          
          <p className="text-white text-md mb-3">Scanne diesen QR-Code, um deinen Gewinn abzuholen:</p>
          <div className="mb-6 p-2 bg-white inline-block rounded-lg border-4 border-yellow-400">
            <QRCodeCanvas value={winningWord} size={160} bgColor="#ffffff" fgColor="#000000" level="H" />
          </div>
          
          <button 
            onClick={onClose}
            className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-bold py-3 px-8 rounded-lg text-xl shadow-md transition duration-150 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-75"
          >
            Gewinn annehmen
          </button>
        </div>
      </div>
    </>
  );
};

export default WinPopup;
