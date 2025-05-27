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

  const handleSpin = useCallback(async () => {
    // ABSOLUTER MINIMUM-ABSTAND zwischen Spins: 20 Sekunden
    const ABSOLUTE_MIN_TIME_BETWEEN_SPINS_MS = 20000;
    const now = Date.now();
    const timeSinceLastSpin = now - lastSpinTimeRef.current;
    
    // Prüfen, ob seit dem letzten Spin genügend Zeit vergangen ist
    if (timeSinceLastSpin < ABSOLUTE_MIN_TIME_BETWEEN_SPINS_MS) {
      console.log(`Zu früher Spin-Versuch: Nur ${Math.round(timeSinceLastSpin/1000)}s seit letztem Spin vergangen. Minimum: ${ABSOLUTE_MIN_TIME_BETWEEN_SPINS_MS/1000}s`);
      return; // Absolut keine Spins zulassen, wenn Mindestzeit nicht vergangen ist
    }
    
    // Prüfen, ob bereits eine Drehung läuft (verhindert Doppelklicks)
    if (isSpinningRef.current || spinning || isAuthLoading) {
      console.log('Drehung läuft bereits oder Ladevorgang aktiv, Button-Klick ignoriert');
      return;
    }
    
    // Aktuelle Zeit als letzten Spin-Zeitpunkt speichern
    lastSpinTimeRef.current = now;
    
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
  }, [spinning, currentUser, guestSpinUsed, isAuthLoading, attemptsLeft]);

  const handleReelComplete = useCallback(async (reelId: number, spinId: number) => { 
    // Nur fortfahren, wenn die spinId mit der aktuellen Spin-ID übereinstimmt
    if (spinId !== currentSpinIdRef.current) {
      console.log(`Reel ${reelId} completed for an old spin (spinId: ${spinId}, currentSpinId: ${currentSpinIdRef.current}). Ignoring.`);
      return;
    }

    console.log(`Reel ${reelId} completed. Spin ID: ${spinId}`);
    completedReelsRef.current += 1;
    
    // Warte absichtlich bis alle Walzen KOMPLETT angehalten sind, bevor wir weitermachen
    if (completedReelsRef.current === 3) {
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
