'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { loadSounds, playSpinSound, stopSpinSound, playWinSound, stopAllSounds } from '@/lib/sounds';
import Reel, { ReelRefMethods } from './Reel';
import Controls from './Controls';
import WinPopup from './WinPopup';
import LoginPromptModal from './LoginPromptModal';
import OutOfSpinsModal from './OutOfSpinsModal';
import SpinLockOverlay from './SpinLockOverlay';
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

// Globales Spin-Lock-Timing (außerhalb der Komponente)
let GLOBAL_LAST_SPIN_TIME = 0;
const GLOBAL_MIN_TIME_BETWEEN_SPINS = 30000; // 30 Sekunden absolutes Minimum zwischen Spins

const SlotMachine = () => {
  const [spinning, setSpinning] = useState(false);
  const isSpinningRef = useRef(false); 
  const [finalSymbols, setFinalSymbols] = useState<SlotSymbol[]>([]);
  const [winAmount, setWinAmount] = useState(0);
  const [attemptsLeft, setAttemptsLeft] = useState(1);
  const [guestSpinUsed, setGuestSpinUsed] = useState(false);
  const [showLoginPromptModal, setShowLoginPromptModal] = useState(false);
  const [showOutOfSpinsModal, setShowOutOfSpinsModal] = useState(false);
  const [showWinPopup, setShowWinPopup] = useState(false);
  const [winningWord, setWinningWord] = useState<string | null>(null);
  const [displayedWinCode, setDisplayedWinCode] = useState<string | null>(null);
  const isWinSaved = useRef(false); 
  
  // States für absolutes globales Lock-Tracking
  const [buttonLocked, setButtonLocked] = useState(false);
  const [lockRemainingTime, setLockRemainingTime] = useState(0);
  
  // Timer Ref für regelmäßige Updates der verbleibenden Sperrzeit
  const lockTimerRef = useRef<number | null>(null);

  const { currentUser, isAuthLoading } = useAuth();

  const completedReelsRef = useRef(0);
  const currentSpinIdRef = useRef(0); 
  const finalSymbolsRef = useRef<SlotSymbol[]>(finalSymbols);
  const reelRefs = useRef<(ReelRefMethods | null)[]>([]);
  const latestWinAmountRef = useRef(0);
  const latestWinningWordRef = useRef<string | null>(null);
  const lastSpinTimeRef = useRef(0); // Ref zum Tracking der letzten Spin-Zeit

  useEffect(() => {
    finalSymbolsRef.current = finalSymbols;
  }, [finalSymbols]);

  useEffect(() => {
    if (currentUser && !isAuthLoading) {
      setShowLoginPromptModal(false);
    }
  }, [currentUser, isAuthLoading]);

  useEffect(() => {
    loadSounds().catch(console.error);
    
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
        clearGuestSpinFromLocalStorage();
        
        const profile = await getUserProfile(currentUser.uid);
        const currentDate = getCurrentDateString();

        if (!profile || (profile.lastSpinsResetDate && profile.lastSpinsResetDate < currentDate)) {
          const newProfile = await initializeOrResetSpins(currentUser.uid);
          setAttemptsLeft(newProfile.spinsLeft);
        } else if (profile) {
          setAttemptsLeft(profile.spinsLeft);
        } else {
          setAttemptsLeft(3); 
        }
        setGuestSpinUsed(false);
      } else {
        const hasUsedSpin = checkGuestSpinStatus();
        setGuestSpinUsed(hasUsedSpin);
        setAttemptsLeft(hasUsedSpin ? 0 : 1);
      }
    };

    updateUserState();
  }, [currentUser, isAuthLoading]);

  // Tracking der letzten Spin-Zeit, um ein absolutes Minimum zwischen Spins zu erzwingen
  useEffect(() => {
    // Bei Komponentenaufbau prüfen, ob ein globaler Lock aktiv sein sollte
    const now = Date.now();
    const timeSinceGlobalSpin = now - GLOBAL_LAST_SPIN_TIME;
    
    if (timeSinceGlobalSpin < GLOBAL_MIN_TIME_BETWEEN_SPINS) {
      // Es ist noch nicht genug Zeit seit dem letzten globalen Spin vergangen
      setButtonLocked(true);
      
      // Timer setzen, um den Button nach Ablauf der Mindestzeit zu entsperren
      const remainingLockTime = GLOBAL_MIN_TIME_BETWEEN_SPINS - timeSinceGlobalSpin;
      const unlockTimer = setTimeout(() => {
        setButtonLocked(false);
        console.log('Globale Sperre aufgehoben nach:', Math.round(GLOBAL_MIN_TIME_BETWEEN_SPINS/1000), 'Sekunden');
      }, remainingLockTime);
      
      return () => clearTimeout(unlockTimer);
    }
  }, []);

  const handleSpin = useCallback(async () => {
    // GLOBALER LOCK CHECK: Absolutes Minimum zwischen Spins: 30 Sekunden
    const now = Date.now();
    const timeSinceGlobalSpin = now - GLOBAL_LAST_SPIN_TIME;
    
    // Prüfen, ob seit dem letzten Spin genügend Zeit vergangen ist (globaler Check)
    if (timeSinceGlobalSpin < GLOBAL_MIN_TIME_BETWEEN_SPINS) {
      const remainingSeconds = Math.ceil((GLOBAL_MIN_TIME_BETWEEN_SPINS - timeSinceGlobalSpin) / 1000);
      console.log(`GLOBALER LOCK: Noch ${remainingSeconds}s Wartezeit bis zum nächsten Spin`);
      return; // Absolut keine Spins zulassen, wenn globale Mindestzeit nicht vergangen ist
    }
    
    // LOKALER LOCK CHECK: 
    const ABSOLUTE_MIN_TIME_BETWEEN_SPINS_MS = 20000; // 20 Sekunden lokales Minimum
    const timeSinceLastSpin = now - lastSpinTimeRef.current;
    
    // Prüfen, ob seit dem letzten Spin genügend Zeit vergangen ist (lokaler Check)
    if (timeSinceLastSpin < ABSOLUTE_MIN_TIME_BETWEEN_SPINS_MS) {
      console.log(`Zu früher Spin-Versuch: Nur ${Math.round(timeSinceLastSpin/1000)}s seit letztem Spin vergangen. Minimum: ${ABSOLUTE_MIN_TIME_BETWEEN_SPINS_MS/1000}s`);
      return; // Absolut keine Spins zulassen, wenn lokale Mindestzeit nicht vergangen ist
    }
    
    // UI-LOCK CHECK: Prüfen, ob bereits eine Drehung läuft (verhindert Doppelklicks)
    if (isSpinningRef.current || spinning || isAuthLoading || buttonLocked) {
      console.log('Drehung läuft bereits, Button ist gesperrt, oder Ladevorgang aktiv. Spin-Versuch ignoriert.');
      return;
    }
    
    // Aktuelle Zeit als letzten Spin-Zeitpunkt speichern (lokal und global)
    lastSpinTimeRef.current = now;
    GLOBAL_LAST_SPIN_TIME = now;
    
    // Button global sperren für die nächsten 30 Sekunden
    setButtonLocked(true);
    setLockRemainingTime(GLOBAL_MIN_TIME_BETWEEN_SPINS);
    
    // Timer für die Anzeige der verbleibenden Zeit starten
    if (lockTimerRef.current) {
      window.clearInterval(lockTimerRef.current);
    }
    
    // Alle 1000ms die verbleibende Zeit aktualisieren
    lockTimerRef.current = window.setInterval(() => {
      const elapsed = Date.now() - GLOBAL_LAST_SPIN_TIME;
      const remaining = Math.max(0, GLOBAL_MIN_TIME_BETWEEN_SPINS - elapsed);
      
      setLockRemainingTime(remaining);
      
      // Timer stoppen, wenn keine Zeit mehr übrig ist
      if (remaining <= 0) {
        if (lockTimerRef.current) {
          window.clearInterval(lockTimerRef.current);
          lockTimerRef.current = null;
        }
        setButtonLocked(false);
        console.log('Globale Sperre aufgehoben nach:', Math.round(GLOBAL_MIN_TIME_BETWEEN_SPINS/1000), 'Sekunden');
      }
    }, 1000);
    
    isWinSaved.current = false;
    
    isSpinningRef.current = true;
    setSpinning(true);
    currentSpinIdRef.current += 1; 
    const newSpinId = currentSpinIdRef.current;

    if (!currentUser && guestSpinUsed) {
      setShowLoginPromptModal(true);
      isSpinningRef.current = false;
      setSpinning(false);
      return;
    }

    if (currentUser && attemptsLeft <= 0) {
      setShowOutOfSpinsModal(true);
      isSpinningRef.current = false; 
      setSpinning(false);
      return;
    }

    if (!currentUser && !guestSpinUsed) {
      setGuestSpinUsed(true);
      saveGuestSpinToLocalStorage();
    }

    if (currentUser && attemptsLeft > 0) {
      const newAttemptsLeft = attemptsLeft - 1;
      setAttemptsLeft(newAttemptsLeft);
      
      try {
        updateUserSpinsCount(currentUser.uid, newAttemptsLeft);
      } catch (error) {
        console.error('Fehler beim Aktualisieren der Versuche:', error);
      }
    } else if (currentUser && attemptsLeft <= 0) {
      setShowOutOfSpinsModal(true);
      return;
    }

    playSpinSound();
    
    setWinAmount(0);
    setWinningWord(null);
    setShowWinPopup(false);
    setDisplayedWinCode(null);
    completedReelsRef.current = 0;
    
    const spinResult: SpinResult = spin();
    
    finalSymbolsRef.current = spinResult.symbols;
    setFinalSymbols(spinResult.symbols);

    latestWinAmountRef.current = spinResult.winAmount;
    latestWinningWordRef.current = spinResult.winningWord;
    
    reelRefs.current.forEach((reel) => { 
      if (reel) {
        reel.startSpinning(spinResult.symbols, newSpinId); 
      }
    });
  }, [spinning, currentUser, guestSpinUsed, isAuthLoading, attemptsLeft, buttonLocked]);

  // Speichern, welche Walzen fertig sind
  const completedReelIdsRef = useRef<Set<number>>(new Set());
  
  const handleReelComplete = useCallback(async (reelId: number, spinId: number) => { 
    // Nur fortfahren, wenn die spinId mit der aktuellen Spin-ID übereinstimmt
    if (spinId !== currentSpinIdRef.current) {
      console.log(`Reel ${reelId} completed for an old spin (spinId: ${spinId}, currentSpinId: ${currentSpinIdRef.current}). Ignoring.`);
      return;
    }

    console.log(`Reel ${reelId} completed. Spin ID: ${spinId}`);
    
    // Diese spezifische Walze als fertig markieren
    completedReelIdsRef.current.add(reelId);
    completedReelsRef.current = completedReelIdsRef.current.size;
    
    // Prüfen, ob wirklich ALLE Walzen (0, 1 UND 2) fertig sind
    const allReelsCompleted = [0, 1, 2].every(id => completedReelIdsRef.current.has(id));
    console.log(`Reel ${reelId} stopped. Status: ${Array.from(completedReelIdsRef.current).join(', ')} (${completedReelsRef.current}/3 complete)`);
    
    // Warte absichtlich bis alle Walzen KOMPLETT angehalten sind (0, 1 UND 2), bevor wir weitermachen
    if (allReelsCompleted) {
      console.log(`ALL REELS COMPLETELY STOPPED: [${Array.from(completedReelIdsRef.current).join(', ')}]`);
      
      // Alle Walzen zurücksetzen für den nächsten Spin
      completedReelIdsRef.current.clear();
      console.log(`All reels completed for spin ID: ${spinId}. Processing result...`);
      if (latestWinAmountRef.current > 0) {
        playWinSound();

        if (currentUser && !isWinSaved.current) {
          saveUserWin(currentUser.uid, latestWinAmountRef.current, latestWinningWordRef.current || '', finalSymbolsRef.current)
            .then(winData => { 
              setDisplayedWinCode(winData ? winData.winCode : null); 
              isWinSaved.current = true; 
              setTimeout(() => {
                setShowWinPopup(true);
                stopSpinSound(); 
              }, 500);
            })
            .catch(error => {
              console.error('Fehler beim Speichern des Gewinns:', error);
              setTimeout(() => {
                setShowWinPopup(true);
                stopSpinSound();
              }, 500);
            });
        } else if (!currentUser && latestWinAmountRef.current > 0) { 
          if (!isWinSaved.current) {
            saveGuestSpinToLocalStorage(); 
            setGuestSpinUsed(true); 
            isWinSaved.current = true;
          }
          setTimeout(() => {
            setShowWinPopup(true);
            stopSpinSound();
          }, 500);
        }
      } else {
        // ABSOLUT WICHTIG: Bei keinem Gewinn erst nach SEHR langer Verzögerung entsperren
        stopSpinSound();
        
        // Berechnung: Mindestens 15 Sekunden ab Start des Spins bis zur Entsperrung
        const spinStartTime = lastSpinTimeRef.current;
        const currentTime = Date.now();
        const elapsedSinceSpinStart = currentTime - spinStartTime;
        const MINIMUM_TOTAL_LOCK_TIME = 15000; // 15 Sekunden Mindestsperre
        
        // Berechnen, wie viel länger wir noch warten müssen, um auf 15 Sekunden zu kommen
        const remainingLockTime = Math.max(MINIMUM_TOTAL_LOCK_TIME - elapsedSinceSpinStart, 5000);
        
        console.log(`Sperre wird nach ${remainingLockTime/1000} weiteren Sekunden aufgehoben (Gesamt: ${(elapsedSinceSpinStart + remainingLockTime)/1000}s seit Spin-Start)`); 
        
        setTimeout(() => {
          console.log('Final button unlock after extended lock period');
          setSpinning(false);
          isSpinningRef.current = false;
        }, remainingLockTime);
      }
    }
  }, [currentUser]);

  const handleCloseWinPopup = () => {
    stopAllSounds();
    setShowWinPopup(false);
    setWinningWord(null);
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
      {/* Absoluter Overlay zum Blockieren aller Interaktionen während des Spins */}
      {(spinning || buttonLocked) && (
        <SpinLockOverlay 
          isActive={spinning || buttonLocked} 
          remainingTime={lockRemainingTime}
        />
      )}
      
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
        spinning={spinning || buttonLocked} // Entweder aktuell am Drehen oder global gesperrt
        attemptsLeft={attemptsLeft} 
        isGuest={!currentUser}
        guestSpinUsed={guestSpinUsed}
        showLoginPrompt={() => setShowLoginPromptModal(true)} 
      />
    </div>
  );
};

export default SlotMachine;
