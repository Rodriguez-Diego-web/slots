'use client';

import React from 'react';

interface OutOfSpinsModalProps {
  onClose: () => void;
}

const OutOfSpinsModal: React.FC<OutOfSpinsModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 p-6 sm:p-8 rounded-lg shadow-xl text-center w-full max-w-md">
        <h2 className="text-xl sm:text-2xl text-white font-bold mb-4">Keine Spins mehr!</h2>
        <p className="text-white mb-6 text-sm sm:text-base">
          Du hast heute leider keine Versuche mehr. Komm morgen wieder, um erneut dein Glück zu versuchen!
        </p>
        <button 
          onClick={onClose}
          className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-base sm:text-lg mx-auto"
        >
          Verstanden
        </button>
      </div>
    </div>
  );
};

export default OutOfSpinsModal;
