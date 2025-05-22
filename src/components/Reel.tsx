'use client';

import { useEffect, useState, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import Image from 'next/image';
import { SlotSymbol, symbols as allSymbolsFromLogic } from '@/lib/slotLogic'; // Import all symbols

// Typ-Alias, um bestehenden Code mit SlotSymbol kompatibel zu machen
type Symbol = SlotSymbol;

export interface ReelRefMethods {
  startSpinning: (finalSymbolsForReels: SlotSymbol[]) => void;
}

interface ReelProps {
  spinning: boolean;
  finalSymbol: SlotSymbol | null; // This might become less directly used if imperative startSpinning always provides target
  onSpinComplete: () => void;
  delayStart?: number;
  reelId: number; // Add a unique ID for each reel for debugging/keying if needed
}

const REEL_STRIP_LENGTH = 30; // Länge des Symbolstreifens für jede Rolle
const SYMBOL_HEIGHT = 120; // Höhe jedes Symbols in Pixeln
const VISIBLE_SYMBOLS = 3; // Anzahl der sichtbaren Symbole

// Animation-Konstanten - optimiert für flüssigere Animationen
const MAX_SPEED = 40; // Erhöhte Maximalgeschwindigkeit für flüssigere Animation
const ACCELERATION = 0.5; // Schnellere Beschleunigung
const DECELERATION_FACTOR = 0.95; // Schnelleres Abbremsen (war 0.97)
const TARGETED_STOP_ANTICIPATION_SPINS = 1.0; // Reduzierte "Extra"-Umdrehungen vor dem Zielstopp
const MIN_SPEED_NEAR_TARGET = 1.0; // Erhöhte Mindestgeschwindigkeit nahe dem Ziel
const VERY_MIN_SPEED = 0.5; // Erhöhte sehr niedrige Geschwindigkeit

// Helper function to initialize the reel strip
const initializeReelStrip = (): Symbol[] => {
  const newStrip: Symbol[] = [];
  const baseSymbols = [...allSymbolsFromLogic]; // Ensure all symbols are available
  for (let i = 0; i < REEL_STRIP_LENGTH; i++) {
    newStrip.push(baseSymbols[i % baseSymbols.length]);
  }
  // Shuffle the strip for some randomness
  for (let i = newStrip.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newStrip[i], newStrip[j]] = [newStrip[j], newStrip[i]];
  }
  return newStrip;
};

const Reel = forwardRef<ReelRefMethods, ReelProps>(({ 
  spinning, 
  finalSymbol, // Prop for final symbol (can be overridden by imperative call)
  onSpinComplete, 
  delayStart = 0,
  reelId
}: ReelProps, ref) => {
  const [reelStrip] = useState<Symbol[]>(initializeReelStrip); // Initialize directly
  // stripScrollPosition represents the pixel offset of the top of the strip
  const [stripScrollPosition, setStripScrollPosition] = useState(0); 
  const currentSpeedRef = useRef(0); 
  const animationFrameIdRef = useRef<number | undefined>(undefined);
  const [isAnimating, setIsAnimating] = useState(false);
  const targetScrollPositionRef = useRef<number | null>(null); // For targeted stopping
  const latestStripScrollPositionRef = useRef(stripScrollPosition);
  const latestIsAnimatingRef = useRef(isAnimating); // This one is sufficient
  const [imagesLoaded, setImagesLoaded] = useState(false); // Track image loading status

  // Effekt zum Aktualisieren der Refs
  useEffect(() => {
    latestStripScrollPositionRef.current = stripScrollPosition;
  }, [stripScrollPosition]);

  useEffect(() => {
    latestIsAnimatingRef.current = isAnimating;
  }, [isAnimating]);
  
  // Neuer Effekt zum Vorladen der Bilder
  useEffect(() => {
    // Keine Vorladung notwendig, wenn bereits geladen
    if (imagesLoaded || reelStrip.length === 0) return;
    
    let loadedCount = 0;
    const totalImages = reelStrip.length;
    
    // Bild-Lade-Status-Tracker
    const imageLoadTracker = () => {
      loadedCount++;
      if (loadedCount >= totalImages) {
        console.log(`Reel ${reelId}: Alle Bilder erfolgreich geladen`);
        setImagesLoaded(true);
      }
    };
    
    // Bilder vorladen
    const preloadImages = reelStrip.map(symbol => {
      const img = new window.Image();
      img.src = symbol.image;
      img.onload = imageLoadTracker;
      img.onerror = () => {
        console.error(`Fehler beim Laden des Bildes ${symbol.image}`);
        imageLoadTracker(); // Trotzdem als "geladen" zählen, um nicht zu blockieren
      };
      return img;
    });
    
    // Aufräumen beim Unmount
    return () => {
      preloadImages.forEach(img => {
        img.onload = null;
        img.onerror = null;
      });
    };
  }, [reelStrip, reelId, imagesLoaded]);

  // Animation loop for scrolling the strip
  useEffect(() => {
    if (!isAnimating || reelStrip.length === 0) {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = undefined;
      }
      return;
    }
    const animateStrip = () => {
      const currentTarget = targetScrollPositionRef.current;
      // Read from ref for calculations, newPosition will be passed to setState
      const currentPositionForCalc = latestStripScrollPositionRef.current;
      let newPosition = currentPositionForCalc; 

      if (currentTarget !== null) { // ---- TARGETED STOPPING MODE ----
        // const currentPosition = stripScrollPosition; // Use ref's value
        const remainingDistance = currentTarget - currentPositionForCalc; 

        // Log current state for debugging the stop
        console.log(
          `Reel ${reelId} Stopping: Target=${currentTarget.toFixed(2)}, Pos=${currentPositionForCalc.toFixed(2)}, RemDist=${remainingDistance.toFixed(2)}, Speed=${currentSpeedRef.current.toFixed(2)}`
        );

        // --- Snapping Condition: Determine if we should snap to target and stop animation ---
        const willPassTargetThisFrame = 
            (remainingDistance > 0 && (currentPositionForCalc + currentSpeedRef.current) >= currentTarget) ||
            (remainingDistance < 0 && (currentPositionForCalc - currentSpeedRef.current) <= currentTarget && currentSpeedRef.current > 0) || 
            (remainingDistance < 0 && (currentPositionForCalc + currentSpeedRef.current) <= currentTarget && currentSpeedRef.current < 0); 


        if (
            Math.abs(remainingDistance) < 1.0 || 
            (Math.abs(currentSpeedRef.current) <= VERY_MIN_SPEED && Math.abs(remainingDistance) < SYMBOL_HEIGHT * 0.45) || 
            (willPassTargetThisFrame && Math.abs(remainingDistance) < SYMBOL_HEIGHT * 1.0) 
           ) {
          console.log(
            `%cReel ${reelId} SNAPPING: Target=${currentTarget.toFixed(2)}, Pos=${currentPositionForCalc.toFixed(2)}, RemDist=${remainingDistance.toFixed(2)}, Speed=${currentSpeedRef.current.toFixed(2)}, WillPass=${willPassTargetThisFrame}`,
            'color: green; font-weight: bold;'
          );
          setStripScrollPosition(currentTarget); 
          setIsAnimating(false); // Stop animation flag
          currentSpeedRef.current = 0; // Reset speed
          targetScrollPositionRef.current = null; // Clear the target
          onSpinComplete(); // Notify parent component
          if (animationFrameIdRef.current) {
            cancelAnimationFrame(animationFrameIdRef.current);
            animationFrameIdRef.current = undefined; // Clear animation frame ID
          }
          return; // Exit the animation loop for this reel
        }

        // --- Deceleration Logic ---
        // currentSpeedRef.current should represent the MAGNITUDE of speed for deceleration calculations.
        // Direction will be applied when calculating moveStep.
        // Ensure currentSpeedRef.current is treated as a positive magnitude here.
        let speedMagnitude = Math.abs(currentSpeedRef.current);

        const absRemainingDistance = Math.abs(remainingDistance);
        // Define how far out we start slowing down. Adjusted to start slowing down closer to the target.
        const stoppingDistanceThreshold = SYMBOL_HEIGHT * (VISIBLE_SYMBOLS > 1 ? 1.0 : 0.75); 

        if (absRemainingDistance <= stoppingDistanceThreshold && speedMagnitude > MIN_SPEED_NEAR_TARGET) {
          // We are within the main stopping threshold, decelerate.
          speedMagnitude = Math.max(
            MIN_SPEED_NEAR_TARGET,
            speedMagnitude * DECELERATION_FACTOR
          );
        }
        
        if (absRemainingDistance <= SYMBOL_HEIGHT * 0.5 && speedMagnitude > VERY_MIN_SPEED) {
          // We are very close to the target, reduce speed further to VERY_MIN_SPEED.
          speedMagnitude = VERY_MIN_SPEED;
        }
        
        currentSpeedRef.current = speedMagnitude; // Update speed magnitude

        // Calculate movement for this frame
        // moveStep will be positive if target is "below" currentPosition, negative if "above".
        const direction = Math.sign(remainingDistance || (currentTarget > currentPositionForCalc ? 1 : -1) || 1); 
        const moveStep = currentSpeedRef.current * direction;
        newPosition = currentPositionForCalc + moveStep;
        
        // The snapping logic at the beginning of this block should handle most overshoots by snapping directly.
        // If more complex overshoot behavior (like a bounce-back) is desired,
        // it would require additional logic here, possibly adjusting currentSpeedRef.current
        // and its direction if newPosition significantly overshoots.
        // For now, we rely on aggressive deceleration and the comprehensive snapping condition.

        // console.log(`Reel ${reelId} Stepping: NewPos=${newPosition.toFixed(2)}, NewSpeed=${currentSpeedRef.current.toFixed(2)}, MoveStep=${moveStep.toFixed(2)}, Dir=${direction}`);

      } else { // ---- FREE SPINNING MODE ----
        currentSpeedRef.current = Math.min(MAX_SPEED, currentSpeedRef.current + ACCELERATION); // Ensure max speed during free spin
        newPosition = currentPositionForCalc + currentSpeedRef.current;
        const totalStripHeight = reelStrip.length * SYMBOL_HEIGHT;
        // Ensure strip wraps around for continuous spinning visual
        if (totalStripHeight > 0 && newPosition >= totalStripHeight) { 
          newPosition = (newPosition % totalStripHeight);
        }
      }
      
      setStripScrollPosition(newPosition); // Apply the new position
      // Request the next frame if still animating
      if (latestIsAnimatingRef.current) { // Use the existing latestIsAnimatingRef
          animationFrameIdRef.current = requestAnimationFrame(animateStrip);
      } else if (animationFrameIdRef.current) { // Ensure cleanup if isAnimating became false but frame was pending
          cancelAnimationFrame(animationFrameIdRef.current);
          animationFrameIdRef.current = undefined;
      }
    };

    animationFrameIdRef.current = requestAnimationFrame(animateStrip);

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = undefined;
      }
    };
  // Corrected dependencies. finalSymbol is kept as it influences target setting which animateStrip respects.
  // reelStrip.length ensures the effect runs/re-runs if the strip itself changes (e.g. becomes available).
  }, [isAnimating, reelStrip.length, onSpinComplete, reelId, finalSymbol]); 

  // Function to calculate a random stop position (basic placeholder if not fully implemented)
  const calculateRandomStopPosition = useCallback(() => {
    if (reelStrip.length === 0) return 0;
    const randomIndex = Math.floor(Math.random() * reelStrip.length);
    const baseTargetPosition = randomIndex * SYMBOL_HEIGHT;
    const stripTotalHeight = reelStrip.length * SYMBOL_HEIGHT;
    const middleVisibleSymbolIndex = Math.floor(VISIBLE_SYMBOLS / 2);
    const visibleWindowTopToMiddleSymbolOffset = middleVisibleSymbolIndex * SYMBOL_HEIGHT;
    let calculatedTargetScroll = baseTargetPosition - visibleWindowTopToMiddleSymbolOffset;
    if (stripTotalHeight > 0) {
        calculatedTargetScroll = (calculatedTargetScroll % stripTotalHeight + stripTotalHeight) % stripTotalHeight;
    }
    const fullSpins = TARGETED_STOP_ANTICIPATION_SPINS * (stripTotalHeight > 0 ? stripTotalHeight : SYMBOL_HEIGHT * 5); // Ensure some spinning
    return calculatedTargetScroll + fullSpins;
  }, [reelStrip]);

  const calculateStopPositionForSymbol = useCallback((targetSymbol: Symbol): number | null => {
    if (!reelStrip || reelStrip.length === 0) {
      console.error(`Reel: Cannot calculate stop position, reelStrip is empty or null.`);
      return null;
    }
    const targetSymbolIndex = reelStrip.findIndex(s => s.id === targetSymbol.id);

    if (targetSymbolIndex === -1) {
      console.warn(`Reel: Target symbol "${targetSymbol.name}" (ID: ${targetSymbol.id}) not found in reelStrip. Cannot calculate specific stop position.`);
      return calculateRandomStopPosition(); // Fallback to random if symbol not found (should not happen if startSpinning checks first)
    }

    const stripHeight = reelStrip.length * SYMBOL_HEIGHT;
    const currentPosition = stripScrollPosition;

    // Calculate the position that would place the targetSymbol.id at the center.
    // The center visible slot is index Math.floor(VISIBLE_SYMBOLS / 2).
    // We want the symbol at targetSymbolIndex to appear in this slot.
    // The scroll position makes the symbol at (targetSymbolIndex - centerSlotIndex) appear at the top.
    const centerSlotIndex = Math.floor(VISIBLE_SYMBOLS / 2);
    const desiredSymbolAtTopIndex = (targetSymbolIndex - centerSlotIndex + reelStrip.length) % reelStrip.length;
    
    let targetPosition = desiredSymbolAtTopIndex * SYMBOL_HEIGHT;

    // Ensure the target position is in the future and allows for multiple spins for visual effect.
    const minFullSpins = 2; // How many full loops the reel should make AT LEAST.
    targetPosition += minFullSpins * stripHeight;

    // Adjust so it's always forward from current position
    while (targetPosition <= currentPosition + SYMBOL_HEIGHT) { // must be at least a symbol away
      targetPosition += stripHeight; // Add a full strip revolution
    }
    
    console.log(`Reel: calculateStopPositionForSymbol for "${targetSymbol.name}" (index ${targetSymbolIndex}) -> desiredSymbolAtTopIndex ${desiredSymbolAtTopIndex}, calculated targetPosition: ${targetPosition}`);
    return targetPosition;

  }, [reelStrip, stripScrollPosition, calculateRandomStopPosition]);

  useImperativeHandle(ref, () => ({
    startSpinning: (finalSymbolsForReels: Symbol[]) => {
      // 1. Sicherstellen, dass es Symbole gibt und die Bilder geladen sind
      if (reelStrip.length === 0) {
        console.error(`Reel ${reelId}: reelStrip ist leer, kann nicht drehen.`);
        return;
      }
      
      // Wenn Bilder noch nicht geladen sind, kurz warten und erneut versuchen
      if (!imagesLoaded) {
        console.log(`Reel ${reelId}: Warte auf Bildladung vor dem Start...`);
        // Statt rekursiven Aufruf setzen wir einfach einen Timer, der erneut prüft
        window.setTimeout(() => {
          // Starte die Animation trotzdem
          if (finalSymbolsForReels) {
            // Ziel setzen und Animation starten auch wenn nicht alle Bilder geladen sind
            const specificFinalSymbol = finalSymbolsForReels[reelId];
            if (specificFinalSymbol) {
              targetScrollPositionRef.current = calculateStopPositionForSymbol(specificFinalSymbol) || 
                                               calculateRandomStopPosition();
            } else {
              targetScrollPositionRef.current = calculateRandomStopPosition();
            }
            setIsAnimating(true);
          }
        }, 100);
        return;
      }

      const specificFinalSymbol = finalSymbolsForReels[reelId];
      
      // 2. Optimiertes Logging (reduziert)
      console.log(`Reel ${reelId}: Start Drehen für Symbol: ${specificFinalSymbol?.name || 'Random'}`);

      // 3. Zielsymbol-Behandlung
      if (!specificFinalSymbol) {
        // Bei fehlendem Zielsymbol auf zufälliges Symbol setzen
        targetScrollPositionRef.current = calculateRandomStopPosition();
      } else {
        // Symbol in der Rollenstreifen finden
        const targetSymbolIndex = reelStrip.findIndex(
          (symbol) => symbol.id === specificFinalSymbol.id // Nach ID statt Name vergleichen (eindeutiger)
        );

        if (targetSymbolIndex !== -1) {
          targetScrollPositionRef.current = calculateStopPositionForSymbol(specificFinalSymbol);
          if (!targetScrollPositionRef.current) {
            targetScrollPositionRef.current = calculateRandomStopPosition();
          }
        } else {
          targetScrollPositionRef.current = calculateRandomStopPosition();
        }
      }
      
      // 4. Animation starten - mit optimierter Geschwindigkeit für flachere Beschleunigungskurve
      currentSpeedRef.current = MIN_SPEED_NEAR_TARGET; // Mit Grundgeschwindigkeit starten statt bei 0
      
      // 5. Mit Verzögerung starten (gestaffelt nach Rollennummer)
      const actualDelay = delayStart + (reelId * 100); // Staffelung der Rollen
      window.setTimeout(() => {
        if (!latestIsAnimatingRef.current) {
            setIsAnimating(true);
        }
      }, actualDelay);
    }
  }), [reelStrip, reelId, calculateRandomStopPosition, delayStart, calculateStopPositionForSymbol, imagesLoaded]); // Unnötige stripScrollPosition-Abhängigkeit entfernt

  useEffect(() => {
    let startDelayTimer: number | undefined;
    const currentFinalSymbol = finalSymbol; // Capture for current effect execution

    if (spinning && reelStrip.length > 0) {
      // If spinning is true, and no target is currently set (e.g., by an imperative call),
      // then this effect can try to set one up based on the finalSymbol prop.
      // Otherwise, if a target is already set, we assume the imperative call is in charge.
      if (targetScrollPositionRef.current === null && currentFinalSymbol) {
        console.log(`Reel ${reelId}: 'spinning' prop is true, no target set. Attempting to set target from prop: ${currentFinalSymbol.id}`);
        currentSpeedRef.current = MAX_SPEED;
        const targetIndex = reelStrip.findIndex(s => s.id === currentFinalSymbol.id);
        if (targetIndex !== -1) {
          targetScrollPositionRef.current = calculateStopPositionForSymbol(currentFinalSymbol); 
          if (targetScrollPositionRef.current !== null) {
            console.log(`Reel ${reelId}: Spinning (prop). Target set for ${currentFinalSymbol.id} at index ${targetIndex} to ${targetScrollPositionRef.current.toFixed(2)} (using specific calculation). Target set: true`);
          } else {
            console.warn(`Reel ${reelId}: Spinning (prop). Target for ${currentFinalSymbol.id} found, but calculateStopPositionForSymbol returned null. Defaulting to random. Target set: false`);
            targetScrollPositionRef.current = calculateRandomStopPosition();
          }
        } else {
          console.warn(`Reel ${reelId}: Spinning (prop). Final symbol ${currentFinalSymbol.id} not found. Defaulting to random. Target set: false`);
          targetScrollPositionRef.current = calculateRandomStopPosition();
        }
      } else if (targetScrollPositionRef.current !== null) {
        console.log(`Reel ${reelId}: 'spinning' prop is true, but a target ${targetScrollPositionRef.current.toFixed(2)} is already set (likely by imperative call). Honoring existing target.`);
        // Ensure speed is appropriate if we are just joining an in-progress spin setup
        if (!latestIsAnimatingRef.current) currentSpeedRef.current = MAX_SPEED;
      } else if (!currentFinalSymbol) {
        console.warn(`Reel ${reelId}: 'spinning' prop is true, but no currentFinalSymbol prop available and no target set. Defaulting to random.`);
        currentSpeedRef.current = MAX_SPEED;
        targetScrollPositionRef.current = calculateRandomStopPosition();
      }

      // This timeout primarily ensures that setIsAnimating(true) happens after delayStart,
      // but only if a target is actually established.
      startDelayTimer = window.setTimeout(() => {
        if (!spinning) {
          console.log(`%cReel ${reelId}: Spin cancelled during start delay (useEffect for prop).`, 'color: orange');
          return;
        }
        // Log current state *before* deciding to animate
        console.log(`%cReel ${reelId}: useEffect[spinning] - Start delay ended. Current IsAnimating: ${latestIsAnimatingRef.current}. Has Target: ${targetScrollPositionRef.current !== null}`, 'color: cyan');
        
        if (targetScrollPositionRef.current !== null && !latestIsAnimatingRef.current) {
          console.log(`%cReel ${reelId}: useEffect[spinning] - Target is set, was not animating. Setting isAnimating to true.`, 'color: green');
          setIsAnimating(true); 
        } else if (targetScrollPositionRef.current === null) {
          console.warn(`%cReel ${reelId}: useEffect[spinning] - Start delay ended but NO TARGET IS SET. Cannot start animation.`, 'color: red');
        } else if (latestIsAnimatingRef.current) {
          console.log(`%cReel ${reelId}: useEffect[spinning] - Start delay ended. Animation already in progress.`, 'color: blue');
        }
      }, delayStart);

    } else if (!spinning && latestIsAnimatingRef.current) {
      // This handles external stop if 'spinning' prop turns false AND no target was set imperatively.
      // If a target IS set, the animation loop will handle deceleration.
      if (targetScrollPositionRef.current === null) {
        console.warn(`Reel ${reelId}: 'spinning' prop became false, no target set. Setting random stop.`);
        targetScrollPositionRef.current = calculateRandomStopPosition();
      }
    } else if (!spinning && !latestIsAnimatingRef.current) {
      // Already stopped, or was never started, do nothing.
    }

    return () => {
      if (startDelayTimer) window.clearTimeout(startDelayTimer);
    };
  // Corrected dependencies: reelStrip is used by findIndex
  }, [spinning, finalSymbol, reelStrip, delayStart, reelId, calculateRandomStopPosition, calculateStopPositionForSymbol]); 

  // Calculate currently visible symbols from the reelStrip based on stripScrollPosition
  const getVisibleSymbols = useCallback(() => {
    if (reelStrip.length === 0) return [];

    const totalStripHeight = reelStrip.length * SYMBOL_HEIGHT;
    // Normalize scroll position to be within one strip height for calculating start index
    const normalizedScrollPosition = stripScrollPosition >= 0 ? stripScrollPosition % totalStripHeight : (stripScrollPosition % totalStripHeight + totalStripHeight) % totalStripHeight;

    const startIndex = Math.floor(normalizedScrollPosition / SYMBOL_HEIGHT);
    const visible: Symbol[] = [];
    for (let i = 0; i < VISIBLE_SYMBOLS + 2; i++) { // +2 for buffer to make wrap-around smooth
      visible.push(reelStrip[(startIndex + i + reelStrip.length) % reelStrip.length]);
    }
    return visible;
  }, [reelStrip, stripScrollPosition]);

  const visibleSymbolsToRender = getVisibleSymbols();
  const totalStripHeight = reelStrip.length * SYMBOL_HEIGHT;
  const normalizedScrollPosition = totalStripHeight > 0 ? (stripScrollPosition >= 0 ? stripScrollPosition % totalStripHeight : (stripScrollPosition % totalStripHeight + totalStripHeight) % totalStripHeight) : 0;
  const fineTuneOffset = normalizedScrollPosition % SYMBOL_HEIGHT;

  return (
    <div className="relative w-full h-full overflow-hidden" style={{ height: `${VISIBLE_SYMBOLS * SYMBOL_HEIGHT}px` }}>
      <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-black/50 to-transparent z-20"></div> {/* Increased z-index to z-20 */}
      <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-black/50 to-transparent z-20"></div> {/* Increased z-index to z-20 */}
      
      <div 
        className="absolute left-0 right-0 flex flex-col items-center"
        style={{ 
          transform: `translateY(${-fineTuneOffset}px)`,
          // The top of this div should be aligned with the first fully/partially visible symbol from reelStrip
          // If visibleSymbolsToRender starts at index 0 of what should be shown,
          // then this translateY should be negative stripScrollPosition % SYMBOL_HEIGHT.
          // The actual symbols are then rendered from visibleSymbolsToRender[1] for the middle one.
        }}
      >
        {/* Render VISIBLE_SYMBOLS + some buffer for smooth looping effect */}
        {visibleSymbolsToRender.map((symbol, index) => (
          <div 
            key={`${reelId}-${index}-${symbol?.id || 'empty'}`} 
            className="flex items-center justify-center py-2"
            style={{ height: `${SYMBOL_HEIGHT}px` }}
          >
            {symbol ? (
              <Image src={symbol.image} alt={symbol.name} width={80} height={80} className="object-contain" />
            ) : (
              <div style={{ width: 80, height: 80, backgroundColor: 'rgba(200,200,200,0.1)' }}></div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
});

Reel.displayName = 'Reel'; // for better debugging
export default Reel;
