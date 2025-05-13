'use client';

import React from 'react';

interface LoginPromptModalProps {
  onClose: () => void;
  onSignIn: () => Promise<void>; // Assuming signIn can be async
}

const LoginPromptModal: React.FC<LoginPromptModalProps> = ({ onClose, onSignIn }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 p-6 sm:p-8 rounded-lg shadow-xl text-center w-full max-w-md">
        <h2 className="text-xl sm:text-2xl text-white font-bold mb-4">Mehr Spins gefällig?</h2>
        <p className="text-white mb-6 text-sm sm:text-base">
          Melde dich an, um tägliche Spins zu erhalten und deine Gewinne zu speichern!
        </p>
        <button 
          onClick={async () => {
            await onSignIn();
            // onClose(); // Closing is handled by SlotMachine after successful sign-in or if needed here
          }}
          className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-base sm:text-lg flex items-center justify-center space-x-2 mx-auto mb-3"
        >
          <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/><path d="M1 1h22v22H1z" fill="none"/></svg>
          <span>Sign In with Google</span>
        </button>
        <button 
          onClick={onClose} 
          className="w-full text-gray-400 hover:text-white text-sm sm:text-base py-2"
        >
          Später vielleicht
        </button>
      </div>
    </div>
  );
};

export default LoginPromptModal;
