'use client';

import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface LoginFormProps {
  onLoginSuccess?: () => void;
}

const LoginForm = ({ onLoginSuccess }: LoginFormProps) => {
  const { 
    currentUser, 
    signInWithGoogle, 
    isAuthLoading 
  } = useAuth();
  
  // Überwache Änderungen am Authentication-Status
  useEffect(() => {
    if (currentUser && !isAuthLoading && onLoginSuccess) {
      onLoginSuccess();
    }
  }, [currentUser, isAuthLoading, onLoginSuccess]);

  return (
    <div className="bg-gray-900 p-6 rounded-lg shadow-lg max-w-md w-full">
      <h2 className="text-2xl font-bold mb-6 text-center text-white">Anmelden</h2>
      
      <div className="mt-4 flex flex-col gap-4">
        <p className="text-center text-white mb-2">
          Melde dich mit deinem Google-Konto an, um deine Gewinne zu speichern und täglich neue Drehungen zu erhalten.
        </p>
        
        <button 
          onClick={signInWithGoogle}
          disabled={isAuthLoading}
          className="flex items-center justify-center bg-white text-gray-700 py-3 px-4 rounded-md hover:bg-gray-100 transition duration-300 font-medium"
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.79-.07-1.54-.19-2.27h-11.3v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
            />
            <path
              fill="#34A853"
              d="M12.255 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96h-3.98v3.09c1.97 3.92 6.02 6.62 10.71 6.62z"
            />
            <path
              fill="#FBBC05"
              d="M5.525 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29v-3.09h-3.98c-.8 1.61-1.26 3.43-1.26 5.38s.46 3.77 1.26 5.38l3.98-3.09z"
            />
            <path
              fill="#EA4335"
              d="M12.255 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42c-2.07-1.94-4.78-3.13-8.02-3.13-4.69 0-8.74 2.7-10.71 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"
            />
          </svg>
          Mit Google anmelden
        </button>
      </div>
      
      <div className="mt-6 text-center text-gray-400 text-sm">
        <p>Wir nutzen nur Google-Anmeldung, um Fake-Accounts zu verhindern und ein faires Spielerlebnis zu gewährleisten.</p>
      </div>
    </div>
  );
};

export default LoginForm;
