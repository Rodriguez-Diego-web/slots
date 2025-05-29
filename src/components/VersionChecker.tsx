'use client';

import { useEffect, useState } from 'react';
import { APP_VERSION } from '@/app/version';

// Diese Komponente überprüft, ob eine neue Version verfügbar ist
// und erzwingt einen Reload, wenn nötig
export default function VersionChecker() {
  const [needsUpdate, setNeedsUpdate] = useState(false);

  useEffect(() => {
    // Prüfe alle 5 Minuten auf Updates
    const checkVersion = async () => {
      try {
        // Füge einen Cache-Buster hinzu, um sicherzustellen, dass wir immer die neueste Version erhalten
        const response = await fetch('/api/version?t=' + new Date().getTime());
        if (response.ok) {
          const data = await response.json();
          
          // Vergleiche die Server-Version mit der lokalen Version
          if (data.version && data.version !== APP_VERSION) {
            console.log(`Neue Version verfügbar: ${data.version} (Aktuell: ${APP_VERSION})`);
            setNeedsUpdate(true);
          }
        }
      } catch (error) {
        console.error('Fehler beim Prüfen der Version:', error);
      }
    };

    // Prüfe sofort beim Laden
    checkVersion();
    
    // Prüfe regelmäßig
    const interval = setInterval(checkVersion, 5 * 60 * 1000); // 5 Minuten
    
    return () => clearInterval(interval);
  }, []);

  // Wenn ein Update nötig ist, zeige einen Modal-Dialog
  if (needsUpdate) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-gray-800 p-6 rounded-lg shadow-xl text-center max-w-sm w-full">
          <h2 className="text-2xl font-bold text-yellow-400 mb-4">Neue Version verfügbar!</h2>
          <p className="text-white mb-6">Es gibt eine neue Version der CUXSNACK Slot Machine mit verbesserten Funktionen.</p>
          <button 
            onClick={() => { window.location.reload(); }}
            className="bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold py-3 px-6 rounded-lg text-xl shadow-md transition duration-150 hover:scale-105"
          >
            Jetzt aktualisieren
          </button>
        </div>
      </div>
    );
  }

  // Wenn kein Update nötig ist, rendere nichts
  return null;
}
