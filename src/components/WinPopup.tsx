'use client';

import { QRCodeCanvas } from 'qrcode.react';

interface WinPopupProps {
  winningWord: string | null;
  winAmount: number;
  onClose: () => void;
}

const WinPopup: React.FC<WinPopupProps> = ({ winningWord, onClose /* winAmount is unused for now */ }) => {
  if (!winningWord) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 p-6 md:p-8 rounded-lg shadow-xl text-center max-w-sm w-full">
        <h2 className="text-3xl md:text-4xl font-bold text-yellow-400 mb-4 font-barber-chop tracking-wider">Herzlichen Glückwunsch!</h2>
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
          Schließen
        </button>
      </div>
    </div>
  );
};

export default WinPopup;
