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
      className={`flex flex-col items-center justify-start w-full h-full 
                  -mt-10 sm:-mt-16 md:-mt-20 /* Reduzierter negativer Margin auf Mobilgeräten */
                  transition-all duration-700 ease-out 
                  ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'} /* Sanftere Slide-In Animation */
                `}
    >
      {/* BildContainer: Nur auf dem letzten Screen das Bild tiefer setzen */}
      <div className={`flex items-center justify-center w-full relative mb-1 ${isLastScreen ? 'pt-5' : ''}`}> 
        {/* Innere Div für spezifische Bildverschiebung auf Screen 3 */}
        <div className={`w-80 h-80 sm:w-100 sm:h-100 md:w-120 md:h-120 relative ${isThirdScreen ? 'mt-6 sm:mt-10' : ''}`}> 
          <Image
            src={image}
            alt={title}
            fill
            className="object-contain" 
            sizes="(max-width: 640px) 80vw, 50vw"
            priority
          />
        </div>
      </div>
      
      {/* TextContainer: Auf dem letzten Screen Text hoch, auf Screen 3 Text ebenfalls hochziehen */}
      <div className={`text-center mb-4 sm:mb-6 md:mb-8 
                     ${isLastScreen ? '-mt-2 sm:-mt-4 md:-mt-5' : ''} 
                     ${isThirdScreen ? '-mt-6 sm:-mt-8 md:-mt-10' : ''} /* Text auf Screen 3 ANHEBEN mit angepasster Höhe für Mobile */ 
                  `}> 
        <h2 className="text-xl sm:text-2xl md:text-3xl font-barber-chop text-white mb-2 sm:mb-3 md:mb-4 bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500 bg-clip-text text-transparent">
          {title}
        </h2>
        <p className="text-gray-300 text-xs sm:text-sm md:text-base max-w-xs mx-auto">
          {description}
        </p>
      </div>
    </div>
  );
};

export default SplashScreen;
