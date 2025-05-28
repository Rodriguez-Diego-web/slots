'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

interface SplashScreenProps {
  title: string;
  description: string;
  image: string;
  isLastScreen?: boolean;
  isThirdScreen?: boolean;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ title, description, image, isLastScreen = false, isThirdScreen = false }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div 
      className={`flex flex-col items-center justify-center w-full h-full 
                  -mt-10 sm:-mt-16 md:-mt-20 /* Reduzierter negativer Margin auf Mobilgeräten */
                  transition-all duration-700 ease-out 
                  ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'} /* Sanftere Slide-In Animation */
                `}
    >
      {/* BildContainer: Etwas größere Bilder für bessere Sichtbarkeit */}
      <div className={`flex items-center justify-center w-full relative mb-1 ${isLastScreen ? 'pt-2' : ''}`}> 
        {/* Optimierte Bildgrößen - etwas größer als vorher */}
        <div className={`w-72 h-72 sm:w-80 sm:h-80 md:w-96 md:h-96 relative ${isThirdScreen ? 'mt-4 sm:mt-6' : ''}`}>
          <Image
            src={image}
            alt={title}
            fill
            className="object-contain" 
            sizes="(max-width: 640px) 70vw, 40vw"
            priority
          />
        </div>
      </div>
      
      {/* TextContainer: Breiterer Text für bessere Lesbarkeit */}
      <div className={`text-center mb-4 sm:mb-6 md:mb-8 
                     ${isLastScreen ? '-mt-2 sm:-mt-3 md:-mt-4' : ''} 
                     ${isThirdScreen ? '-mt-4 sm:-mt-6 md:-mt-8' : ''} /* Reduzierte negative Margins */ 
                  `}> 
        <h2 className="text-xl sm:text-2xl md:text-3xl font-barber-chop text-white mb-2 sm:mb-3 md:mb-4 bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500 bg-clip-text text-transparent whitespace-pre-line">
          {title}
        </h2>
        <p className="text-gray-300 text-sm sm:text-sm md:text-base max-w-sm mx-auto leading-relaxed px-4">
          {description}
        </p>
      </div>
    </div>
  );
};

export default SplashScreen;
