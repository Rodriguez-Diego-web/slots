'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { loadSounds, playSpinSound, stopSpinSound, playWinSound, stopAllSounds } from '@/lib/sounds';
import Reel, { ReelRefMethods } from './Reel';
import Controls from './Controls';
import WinPopup from './WinPopup';
import LoginPromptModal from './LoginPromptModal';
import OutOfSpinsModal from './OutOfSpinsModal';
import { spin, SlotSymbol, SpinResult } from '@/lib/slotLogic';
import { 
  getUserProfile, 
  initializeOrResetSpins, 
  saveUserWin, 
  getCurrentDateString,
  saveGuestSpinToLocalStorage,
  checkGuestSpinStatus,
  clearGuestSpinFromLocalStorage,
  updateUserSpinsCount
} from '../lib/firebase';
import { useAuth } from '@/contexts/AuthContext';

const SlotMachine = () => {
  const [spinning, setSpinning] = useState(false);
  const isSpinningRef = useRef(false); // Zusätzliche Ref um Race Conditions zu vermeiden
  const [finalSymbols, setFinalSymbols] = useState<SlotSymbol[]>([]);
  const [winAmount, setWinAmount] = useState(0);
  const [attemptsLeft, setAttemptsLeft] = useState(1);
  const [guestSpinUsed, setGuestSpinUsed] = useState(false);
  const [showLoginPromptModal, setShowLoginPromptModal] = useState(false);
  const [showOutOfSpinsModal, setShowOutOfSpinsModal] = useState(false);
  const [showWinPopup, setShowWinPopup] = useState(false);
  const [winningWord, setWinningWord] = useState<string | null>(null);
  const [displayedWinCode, setDisplayedWinCode] = useState<string | null>(null);
  const isWinSaved = useRef(false); // Vermeidet mehrfaches Speichern eines Gewinns

  const { currentUser, isAuthLoading } = useAuth();

  const completedReelsRef = useRef(0);
  const currentSpinIdRef = useRef(0); // NEU: Ref für die aktuelle Spin-ID
  const finalSymbolsRef = useRef<SlotSymbol[]>(finalSymbols);
  const reelRefs = useRef<(ReelRefMethods | null)[]>([]);
  const latestWinAmountRef = useRef(0);
  const latestWinningWordRef = useRef<string | null>(null);

  useEffect(() => {
    finalSymbolsRef.current = finalSymbols;
  }, [finalSymbols]);

  // Automatisch das Login-Modal schließen, wenn der Benutzer angemeldet ist
  useEffect(() => {
    if (currentUser && !isAuthLoading) {
      setShowLoginPromptModal(false);
    }
  }, [currentUser, isAuthLoading]);

  // Sound beim ersten Laden initialisieren
  useEffect(() => {
    loadSounds().catch(console.error);
    
    // Aufräumfunktion für den Sound zurückgeben
    return () => {
      stopSpinSound();
    };
  }, []);

  useEffect(() => {
    if (isAuthLoading) {
      return;
    }

    const updateUserState = async () => {
      if (currentUser) {
        // Beim Login lokalen Gast-Spin-Status löschen
        clearGuestSpinFromLocalStorage();
        
        const profile = await getUserProfile(currentUser.uid);
        const currentDate = getCurrentDateString();

        if (!profile || (profile.lastSpinsResetDate && profile.lastSpinsResetDate < currentDate)) {
          const newProfile = await initializeOrResetSpins(currentUser.uid);
          setAttemptsLeft(newProfile.spinsLeft);
        } else if (profile) {
          setAttemptsLeft(profile.spinsLeft);
        } else {
          setAttemptsLeft(3); // Default spins for new/error state
        }
        setGuestSpinUsed(false);
      } else {
        // Gast-Status aus dem LocalStorage prüfen
        const hasUsedSpin = checkGuestSpinStatus();
        setGuestSpinUsed(hasUsedSpin);
        setAttemptsLeft(hasUsedSpin ? 0 : 1);
      }
    };

    updateUserState();
  }, [currentUser, isAuthLoading]);

  const handleSpin = useCallback(async () => {
    // Prüfen, ob bereits eine Drehung läuft (verhindert Doppelklicks)
    if (isSpinningRef.current || spinning || isAuthLoading) {
      console.log('Drehung läuft bereits oder Ladevorgang aktiv, Button-Klick ignoriert');
      return;
    }
    
    // Zurücksetzen des Win-Saved-Status für einen neuen Spin
    isWinSaved.current = false;
    
    // Spinning-Status setzen, bevor irgendwelche anderen Prüfungen durchgeführt werden
    isSpinningRef.current = true;
    setSpinning(true);
    currentSpinIdRef.current += 1; // NEU: Spin-ID für diesen Spin erhöhen
    const newSpinId = currentSpinIdRef.current; // NEU: Aktuelle Spin-ID für diesen Durchlauf speichern

    // User ohne Anmeldung kann nur einmal drehen
    if (!currentUser && guestSpinUsed) {
      setShowLoginPromptModal(true);
      isSpinningRef.current = false; // Zurücksetzen, da wir nur das Modal zeigen
      setSpinning(false);
      return;
    }

    if (currentUser && attemptsLeft <= 0) {
      setShowOutOfSpinsModal(true);
      isSpinningRef.current = false; // Zurücksetzen, da wir nur das Modal zeigen
      setSpinning(false);
      return;
    }

    if (!currentUser && !guestSpinUsed) {
      setGuestSpinUsed(true);
      // Speichere den Gast-Spin im localStorage für Seitenaktualisierungen
      saveGuestSpinToLocalStorage();
    }

    if (currentUser && attemptsLeft > 0) {
      // Reduziere die Anzahl der Versuche lokal
      const newAttemptsLeft = attemptsLeft - 1;
      setAttemptsLeft(newAttemptsLeft);
      
      // Speichere den aktualisierten Wert in der Datenbank
      try {
        updateUserSpinsCount(currentUser.uid, newAttemptsLeft);
      } catch (error) {
        console.error('Fehler beim Aktualisieren der Versuche:', error);
      }
    } else if (currentUser && attemptsLeft <= 0) {
      setShowOutOfSpinsModal(true);
      return;
    }

    // Spin-Sound abspielen
    playSpinSound();
    
    // Zustand zurücksetzen
    setWinAmount(0);
    setWinningWord(null);
    setShowWinPopup(false);
    setDisplayedWinCode(null);
    completedReelsRef.current = 0;
    
    // Spin-Ergebnis generieren
    const spinResult: SpinResult = spin();
    
    finalSymbolsRef.current = spinResult.symbols;
    setFinalSymbols(spinResult.symbols);

    latestWinAmountRef.current = spinResult.winAmount;
    latestWinningWordRef.current = spinResult.winningWord;
    
    // Rollen drehen
    reelRefs.current.forEach((reel) => { // Geändert: 'index' entfernt
      if (reel) {
        // Übergebe die finalen Symbole und die aktuelle Spin-ID an jede Walze
        reel.startSpinning(spinResult.symbols, newSpinId); // NEU: newSpinId übergeben
      }
    });
  }, [spinning, currentUser, guestSpinUsed, isAuthLoading, attemptsLeft]);

  const handleReelComplete = useCallback(async (reelId: number, spinId: number) => { // NEU: spinId als Parameter
    // Nur fortfahren, wenn die spinId mit der aktuellen Spin-ID übereinstimmt
    if (spinId !== currentSpinIdRef.current) {
      console.log(`Reel ${reelId} completed for an old spin (spinId: ${spinId}, currentSpinId: ${currentSpinIdRef.current}). Ignoring.`);
      return;
    }

    completedReelsRef.current += 1;

    if (completedReelsRef.current === 3) {
      // Alle Walzen sind gestoppt
      if (latestWinAmountRef.current > 0) {
        playWinSound();

        // Speichern des Gewinns in Firebase (nur wenn noch nicht gespeichert)
        if (currentUser && !isWinSaved.current) {
          saveUserWin(currentUser.uid, latestWinAmountRef.current, latestWinningWordRef.current || '', finalSymbolsRef.current)
            .then(winData => { 
              setDisplayedWinCode(winData ? winData.winCode : null); 
              isWinSaved.current = true; 
              // Verzögerung hinzufügen, bevor das Popup angezeigt wird, um den Walzen Zeit zum Stoppen zu geben
              setTimeout(() => {
                setShowWinPopup(true);
                // Spin-Sound hier stoppen, da das Popup erscheint
                stopSpinSound(); 
              }, 500);
            })
            .catch(error => {
              console.error('Fehler beim Speichern des Gewinns:', error);
              // Fallback: Popup trotzdem anzeigen, aber ohne Code oder mit Fehlermeldung?
              // Fürs Erste: Popup anzeigen, Spinning bleibt true.
              setTimeout(() => {
                setShowWinPopup(true);
                stopSpinSound();
              }, 500);
            });
        } else if (!currentUser && latestWinAmountRef.current > 0) { // Gast-Gewinn
          // Für Gäste den Gewinn im LocalStorage speichern, falls noch nicht geschehen
          if (!isWinSaved.current) {
            saveGuestSpinToLocalStorage(); 
            setGuestSpinUsed(true); // Gast-Spin als verbraucht markieren
            isWinSaved.current = true;
          }
          setTimeout(() => {
            setShowWinPopup(true);
            stopSpinSound();
          }, 500);
        }
      } else {
        // Bei keinem Gewinn nach einer kurzen Verzögerung den Spinning-Status zurücksetzen,
        // damit die Benutzer genug Zeit haben, das Ergebnis zu sehen
        setTimeout(() => {
          stopSpinSound();
          setSpinning(false);
          isSpinningRef.current = false;
        }, 2500); // TEST: Erhöht von 1200ms auf 2500ms
      }
    }
  }, [currentUser]);

  const handleCloseWinPopup = () => {
    // Alle Sounds stoppen, wenn das Win-Popup geschlossen wird
    stopAllSounds();
    setShowWinPopup(false);
    setWinningWord(null);
    // Erst hier den Spinning-Status zurücksetzen, wenn ein Gewinn vorlag
    if (latestWinAmountRef.current > 0) {
      setSpinning(false);
      isSpinningRef.current = false;
    }
  };

  if (isAuthLoading) {
    return <div className="w-full h-screen flex items-center justify-center text-white">Loading Game...</div>;
  }

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto">
      {showWinPopup && (
        <WinPopup 
          winAmount={winAmount} 
          winningWord={winningWord} 
          onClose={handleCloseWinPopup} 
          symbols={finalSymbolsRef.current} 
          winCode={displayedWinCode} 
        />
      )}

      {showLoginPromptModal && (
        <LoginPromptModal 
          onClose={() => setShowLoginPromptModal(false)} 
        />
      )}

      {showOutOfSpinsModal && (
        <OutOfSpinsModal 
          onClose={() => setShowOutOfSpinsModal(false)} 
        />
      )}

      <div className="text-center pt-8 pb-6">
        <span className="text-white font-bold text-3xl font-barber-chop">Gewinnspiel</span>
      </div>

      <div className="grid grid-cols-3 gap-0 p-4 border-4 border-white rounded-lg shadow-xl mb-6 w-full">
        {[0, 1, 2].map((reelIndex) => (
          <div 
            key={`reel-wrapper-${reelIndex}`}
            className={`${reelIndex < 2 ? 'border-r-2 border-white' : ''} flex items-center justify-center relative`}
          >
            <Reel 
              reelId={reelIndex} 
              spinning={spinning} 
              finalSymbol={finalSymbols[reelIndex]} 
              onSpinComplete={handleReelComplete} 
              delayStart={reelIndex * 200} 
              ref={(el) => {
                if (el) {
                  reelRefs.current[reelIndex] = el;
                } else {
                  reelRefs.current[reelIndex] = null;
                }
              }}
            />
          </div>
        ))}
      </div>

      {latestWinAmountRef.current > 0 && !showWinPopup && (
        <div className="text-center text-xl font-bold text-white mt-4">
          {(() => {
            if (latestWinningWordRef.current) {
              return latestWinningWordRef.current;
            }
            if (finalSymbols && finalSymbols.length === 3 &&
                finalSymbols[0].id === finalSymbols[1].id &&
                finalSymbols[1].id === finalSymbols[2].id) {
              return `${finalSymbols[0].name}!`;
            }
            return `Gewinn: ${latestWinAmountRef.current}`;
          })()}
        </div>
      )}

      <div className="text-center pb-4 pt-2">
        {currentUser ? (
          attemptsLeft <= 1 ? (
            <p className="text-white text-xl font-medium font-barber-chop">Letzter Versuch</p>
          ) : (
            <p className="text-white text-xl font-medium font-barber-chop">Versuche: {attemptsLeft}</p>
          )
        ) : (
          guestSpinUsed ? (
            <p className="text-white text-xl font-medium font-barber-chop">Keine Versuche mehr</p>
          ) : (
            <p className="text-white text-xl font-medium font-barber-chop">1 Versuch verfügbar</p>
          )
        )}
      </div>

      <Controls 
        onSpin={handleSpin} 
        spinning={spinning} 
        attemptsLeft={attemptsLeft} 
        isGuest={!currentUser}
        guestSpinUsed={guestSpinUsed}
        showLoginPrompt={() => setShowLoginPromptModal(true)} 
      />
    </div>
  );
};

export default SlotMachine;
