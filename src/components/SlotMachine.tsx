'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import Reel, { ReelRefMethods } from './Reel';
import Controls from './Controls';
import WinPopup from './WinPopup';
import LoginPromptModal from './LoginPromptModal';
import OutOfSpinsModal from './OutOfSpinsModal';
import { spin, Symbol, SpinResult } from '@/lib/slotLogic';
import { getUserProfile, initializeOrResetSpins, saveUserWin, getCurrentDateString } from '../lib/firebase';
import { useAuth } from '@/contexts/AuthContext';

const SlotMachine = () => {
  const [spinning, setSpinning] = useState(false);
  const [finalSymbols, setFinalSymbols] = useState<Symbol[]>([]);
  const [winAmount, setWinAmount] = useState(0);
  const [attemptsLeft, setAttemptsLeft] = useState(1);
  const [guestSpinUsed, setGuestSpinUsed] = useState(false);
  const [showLoginPromptModal, setShowLoginPromptModal] = useState(false);
  const [showOutOfSpinsModal, setShowOutOfSpinsModal] = useState(false);
  const [showWinPopup, setShowWinPopup] = useState(false);
  const [winningWord, setWinningWord] = useState<string | null>(null);

  const { currentUser, isAuthLoading, signInWithGoogle } = useAuth();

  const completedReelsRef = useRef(0);
  const finalSymbolsRef = useRef(finalSymbols);
  const reelRefs = useRef<(ReelRefMethods | null)[]>([]);
  const latestWinAmountRef = useRef(0);
  const latestWinningWordRef = useRef<string | null>(null);

  useEffect(() => {
    finalSymbolsRef.current = finalSymbols;
  }, [finalSymbols]);

  useEffect(() => {
    if (isAuthLoading) {
      return;
    }

    const updateUserState = async () => {
      if (currentUser) {
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
        setAttemptsLeft(1);
        setGuestSpinUsed(false);
      }
    };

    updateUserState();
  }, [currentUser, isAuthLoading]);

  const handleSpin = useCallback(async () => {
    if (spinning || isAuthLoading) return;

    if (!currentUser && guestSpinUsed) {
      setShowLoginPromptModal(true);
      return;
    }

    if (currentUser && attemptsLeft <= 0) {
      setShowOutOfSpinsModal(true);
      return;
    }

    if (!currentUser && !guestSpinUsed) {
      setGuestSpinUsed(true);
    }

    if (currentUser && attemptsLeft > 0) {
      setAttemptsLeft(prev => prev - 1);
    } else if (currentUser && attemptsLeft <= 0) {
      setShowOutOfSpinsModal(true);
      return;
    }

    setSpinning(true);
    setWinAmount(0);
    setWinningWord(null);
    completedReelsRef.current = 0;

    const spinResult: SpinResult = spin();
    
    finalSymbolsRef.current = spinResult.symbols;
    setFinalSymbols(spinResult.symbols);

    latestWinAmountRef.current = spinResult.winAmount;
    latestWinningWordRef.current = spinResult.winningWord;

    setWinAmount(spinResult.winAmount);
    setWinningWord(spinResult.winningWord);

    reelRefs.current.forEach(reel => reel?.startSpinning(spinResult.symbols));
  }, [spinning, currentUser, guestSpinUsed, isAuthLoading, attemptsLeft]);

  const handleReelComplete = useCallback(() => {
    completedReelsRef.current += 1;

    if (completedReelsRef.current === 3) {
      setSpinning(false);

      const currentSpinWinAmount = latestWinAmountRef.current;
      const currentSpinWinningWord = latestWinningWordRef.current;

      if (currentSpinWinAmount > 0) {
        if (currentUser && finalSymbolsRef.current) {
          saveUserWin(
            currentUser.uid,
            currentSpinWinAmount,
            currentSpinWinningWord,
            finalSymbolsRef.current
          );
        }

        if (currentSpinWinningWord) {
        } else {
          setWinningWord(`Gewinn: ${currentSpinWinAmount} Punkte!`);
        }
        setShowWinPopup(true);
      }
    }
  }, [currentUser]);

  const handleCloseWinPopup = () => {
    setShowWinPopup(false);
    setWinningWord(null);
  };

  const handleSignInFromModal = async () => {
    await signInWithGoogle();
    setShowLoginPromptModal(false);
  };

  if (isAuthLoading) {
    return <div className="w-full h-screen flex items-center justify-center text-white">Loading Game...</div>;
  }

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto">
      {showWinPopup && winningWord && (
        <WinPopup 
          winAmount={winAmount} 
          winningWord={winningWord} 
          onClose={handleCloseWinPopup} 
        />
      )}

      {showLoginPromptModal && (
        <LoginPromptModal 
          onClose={() => setShowLoginPromptModal(false)} 
          onSignIn={handleSignInFromModal} 
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
