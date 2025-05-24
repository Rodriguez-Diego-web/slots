'use client';

import React from 'react';

interface SplashDotsProps {
  count: number;
  active: number;
  onDotClick: (index: number) => void;
}

const SplashDots: React.FC<SplashDotsProps> = ({ count, active, onDotClick }) => {
  return (
    <div className="flex items-center justify-center space-x-3">
      {Array.from({ length: count }).map((_, index) => (
        <button
          key={index}
          onClick={() => onDotClick(index)}
          className={`w-3 h-3 rounded-full transition-all duration-300 ${
            active === index
              ? 'bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500 w-5'
              : 'bg-gray-600'
          }`}
          aria-label={`Gehe zu Seite ${index + 1}`}
        />
      ))}
    </div>
  );
};

export default SplashDots;
