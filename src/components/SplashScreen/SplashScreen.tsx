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
                  -mt-20 /* Konsistente Grundposition für Text auf S1/S2 */
                  transition-all duration-700 ease-out 
                  ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'} /* Sanftere Slide-In Animation */
                `}
    >
      {/* BildContainer: Nur auf dem letzten Screen das Bild tiefer setzen */}
      <div className={`flex items-center justify-center w-full relative mb-1 ${isLastScreen ? 'pt-5' : ''}`}> 
        {/* Innere Div für spezifische Bildverschiebung auf Screen 3 */}
        <div className={`w-120 h-120 sm:w-120 sm:h-120 relative ${isThirdScreen ? 'mt-10' : ''}`}> 
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
      <div className={`text-center mb-8 
                     ${isLastScreen ? '-mt-5' : ''} 
                     ${isThirdScreen ? '-mt-10' : ''} /* Text auf Screen 3 ANHEBEN */ 
                  `}> 
        <h2 className="text-2xl sm:text-3xl font-barber-chop text-white mb-4 bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500 bg-clip-text text-transparent">
          {title}
        </h2>
        <p className="text-gray-300 text-sm sm:text-base max-w-xs mx-auto">
          {description}
        </p>
      </div>
    </div>
  );
};

export default SplashScreen;
