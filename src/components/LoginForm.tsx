'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

enum AuthMode {
  LOGIN = 'login',
  REGISTER = 'register',
  RESET_PASSWORD = 'reset'
}

interface LoginFormProps {
  onLoginSuccess?: () => void;
}

const LoginForm = ({ onLoginSuccess }: LoginFormProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<AuthMode>(AuthMode.LOGIN);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  
  const { currentUser, signInWithGoogle, signInWithEmail, signUpWithEmail, sendPasswordResetEmail, authError, isAuthLoading } = useAuth();
  
  // Überwache Änderungen am Authentication-Status
  useEffect(() => {
    // Wenn der Benutzer eingeloggt ist und nicht mehr im Ladezustand, rufe onLoginSuccess auf
    if (currentUser && !isAuthLoading && onLoginSuccess) {
      onLoginSuccess();
    }
  }, [currentUser, isAuthLoading, onLoginSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (mode === AuthMode.LOGIN) {
        await signInWithEmail(email, password);
      } else if (mode === AuthMode.REGISTER) {
        await signUpWithEmail(email, password);
      } else if (mode === AuthMode.RESET_PASSWORD) {
        const success = await sendPasswordResetEmail(email);
        if (success) {
          setResetEmailSent(true);
        }
      }
    } catch (error) {
      console.error('Login/Registration error:', error);
    }
  };

  const renderForm = () => {
    switch (mode) {
      case AuthMode.LOGIN:
        return (
          <>
            <h2 className="text-2xl font-bold mb-6 text-center text-white">Anmelden</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-white mb-2">E-Mail</label>
                <input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-orange-500"
                  required
                />
              </div>
              <div>
                <label className="block text-white mb-2">Passwort</label>
                <input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-orange-500"
                  required
                />
              </div>
              
              <div>
                <button 
                  type="submit"
                  disabled={isAuthLoading}
                  className="w-full bg-orange-500 text-white py-2 px-4 rounded-md hover:bg-orange-600 transition duration-300"
                >
                  {isAuthLoading ? 'Wird angemeldet...' : 'Anmelden'}
                </button>
              </div>
            </form>
            
            <div className="mt-4 flex flex-col gap-2">
              <button 
                onClick={() => setMode(AuthMode.RESET_PASSWORD)}
                className="text-orange-400 hover:text-orange-500 text-sm"
              >
                Passwort vergessen?
              </button>
              
              <button 
                onClick={() => setMode(AuthMode.REGISTER)}
                className="text-orange-400 hover:text-orange-500 text-sm"
              >
                Noch kein Konto? Jetzt registrieren
              </button>
              
              <div className="my-4 flex items-center">
                <div className="flex-grow border-t border-gray-300"></div>
                <span className="mx-4 flex-shrink text-gray-400">oder</span>
                <div className="flex-grow border-t border-gray-300"></div>
              </div>
              
              <button 
                onClick={signInWithGoogle}
                disabled={isAuthLoading}
                className="flex items-center justify-center bg-white text-gray-700 py-2 px-4 rounded-md hover:bg-gray-100 transition duration-300"
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
          </>
        );
        
      case AuthMode.REGISTER:
        return (
          <>
            <h2 className="text-2xl font-bold mb-6 text-center text-white">Registrieren</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-white mb-2">E-Mail</label>
                <input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-orange-500"
                  required
                />
              </div>
              <div>
                <label className="block text-white mb-2">Passwort</label>
                <input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-orange-500"
                  required
                />
              </div>
              
              <div>
                <button 
                  type="submit"
                  disabled={isAuthLoading}
                  className="w-full bg-orange-500 text-white py-2 px-4 rounded-md hover:bg-orange-600 transition duration-300"
                >
                  {isAuthLoading ? 'Wird registriert...' : 'Registrieren'}
                </button>
              </div>
            </form>
            
            <div className="mt-4">
              <button 
                onClick={() => setMode(AuthMode.LOGIN)}
                className="text-orange-400 hover:text-orange-500 text-sm"
              >
                Bereits registriert? Jetzt anmelden
              </button>
            </div>
          </>
        );
        
      case AuthMode.RESET_PASSWORD:
        return (
          <>
            <h2 className="text-2xl font-bold mb-6 text-center text-white">Passwort zurücksetzen</h2>
            
            {resetEmailSent ? (
              <div className="text-center">
                <p className="text-white mb-4">
                  Eine E-Mail mit Anweisungen zum Zurücksetzen deines Passworts wurde an {email} gesendet.
                </p>
                <button 
                  onClick={() => {
                    setMode(AuthMode.LOGIN);
                    setResetEmailSent(false);
                  }}
                  className="text-orange-400 hover:text-orange-500"
                >
                  Zurück zum Login
                </button>
              </div>
            ) : (
              <>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-white mb-2">Deine E-Mail Adresse</label>
                    <input 
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-orange-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <button 
                      type="submit"
                      disabled={isAuthLoading}
                      className="w-full bg-orange-500 text-white py-2 px-4 rounded-md hover:bg-orange-600 transition duration-300"
                    >
                      {isAuthLoading ? 'Wird gesendet...' : 'Link zum Zurücksetzen senden'}
                    </button>
                  </div>
                </form>
                
                <div className="mt-4">
                  <button 
                    onClick={() => setMode(AuthMode.LOGIN)}
                    className="text-orange-400 hover:text-orange-500 text-sm"
                  >
                    Zurück zum Login
                  </button>
                </div>
              </>
            )}
          </>
        );
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 rounded-lg bg-gray-800 bg-opacity-80 shadow-lg">
      {authError && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {authError}
        </div>
      )}
      {renderForm()}
    </div>
  );
};

export default LoginForm;
