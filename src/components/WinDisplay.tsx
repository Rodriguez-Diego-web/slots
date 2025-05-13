'use client';

import { useEffect, useState } from 'react';

interface WinDisplayProps {
  winAmount: number;
  jackpot: boolean;
  spinning: boolean;
}

const WinDisplay = ({ winAmount, jackpot, spinning }: WinDisplayProps) => {
  const [animateWin, setAnimateWin] = useState(false);
  
  useEffect(() => {
    // Reset animation state when spinning starts
    if (spinning) {
      setAnimateWin(false);
      return;
    }
    
    // Trigger animation when win amount changes (and it's greater than 0)
    if (winAmount > 0 && !spinning) {
      setAnimateWin(true);
      
      // Reset animation after a delay for potential future wins
      const timer = setTimeout(() => {
        setAnimateWin(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [winAmount, spinning]);
  
  return (
    <div className="text-center px-4 py-2">
      {jackpot ? (
        <div className={`relative transform transition-all duration-700 ${animateWin ? 'scale-110' : 'scale-100'}`}>
          <h2 className="text-4xl font-extrabold mb-1 text-gray-200 animate-pulse">JACKPOT!</h2>
          <div className="text-6xl font-bold text-gray-100 drop-shadow-md">777</div>
          
          {/* Confetti-like elements */}
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(30)].map((_, i) => (
              <div 
                key={i}
                className="absolute w-2 h-2 rounded-full bg-gray-400 animate-ping"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${1 + Math.random() * 3}s`
                }}
              />
            ))}
          </div>
        </div>
      ) : winAmount > 0 ? (
        <div className={`transform transition-all duration-500 ${animateWin ? 'scale-110 text-gray-100' : 'scale-100 text-gray-300'}`}>
          <p className="text-2xl font-semibold">Gewinn:</p>
          <p className="text-5xl font-bold">{winAmount}</p>
        </div>
      ) : (
        <div className="h-20">
          {/* <p className="text-gray-500">Dreh die Walzen!</p> */}
        </div>
      )}
    </div>
  );
};

export default WinDisplay;
