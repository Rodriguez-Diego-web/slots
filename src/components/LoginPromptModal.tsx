'use client';

import React, { useState } from 'react';
import LoginForm from './LoginForm';

interface LoginPromptModalProps {
  onClose: () => void;
}

const LoginPromptModal: React.FC<LoginPromptModalProps> = ({ onClose }) => {
  const [showLoginForm, setShowLoginForm] = useState(false);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 p-6 sm:p-8 rounded-lg shadow-xl text-center w-full max-w-md">
        {!showLoginForm ? (
          <>
            <h2 className="text-xl sm:text-2xl text-white font-bold mb-4">Mehr Spins gefällig?</h2>
            <p className="text-white mb-6 text-sm sm:text-base">
              Melde dich an, um tägliche Spins zu erhalten und deine Gewinne zu speichern!
            </p>
            <button
              onClick={() => setShowLoginForm(true)}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-lg text-base sm:text-lg flex items-center justify-center space-x-2 mx-auto mb-3"
            >
              <span>+3 SPINS MIT LOGIN</span>
            </button>
            <button
              onClick={onClose}
              className="w-full text-gray-400 hover:text-white text-sm sm:text-base py-2"
            >
              Später vielleicht
            </button>
          </>
        ) : (
          <>
            <div className="flex justify-end mb-2">
              <button
                onClick={() => setShowLoginForm(false)}
                className="text-gray-400 hover:text-white"
              >
                ← Zurück
              </button>
            </div>
            <LoginForm onLoginSuccess={() => onClose()} />
          </>
        )}
      </div>
    </div>
  );
};

export default LoginPromptModal;
