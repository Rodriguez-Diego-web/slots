'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { currentUser, isAuthLoading, signInWithGoogle, signOutUser } = useAuth();

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const closeMenu = () => {
    setMenuOpen(false);
  };

  const handleSignIn = async () => {
    await signInWithGoogle();
    setMenuOpen(false); // Close menu after sign in attempt
  };

  const handleSignOut = async () => {
    await signOutUser();
    setMenuOpen(false); // Close menu after sign out attempt
  };

  return (
    <header className="fixed top-0 left-0 right-0 w-full z-40 pt-4 pb-4 px-6 bg-black border-b border-gray-800">
      <div className="flex items-center justify-between max-w-screen-xl mx-auto">
        <div className="flex items-center">
          <Link href="/" className="cursor-pointer">
            <Image src="/logo.png" alt="CUXSNACK Logo" width={160} height={40} style={{ height: 'auto' }} priority />
          </Link>
        </div>

        <button
          onClick={toggleMenu}
          className="p-2 focus:outline-none relative w-10 h-10 flex items-center justify-center md:hidden" // md:hidden to hide on larger screens if you have a different nav
          aria-label="Menu"
        >
          <div className={`absolute w-7 h-0.5 bg-white transform transition-all duration-300 ${menuOpen ? 'rotate-45' : 'translate-y-[-8px]'}`}></div>
          <div className={`absolute w-7 h-0.5 bg-white transition-all duration-300 ${menuOpen ? 'opacity-0' : ''}`}></div>
          <div className={`absolute w-7 h-0.5 bg-white transform transition-all duration-300 ${menuOpen ? '-rotate-45' : 'translate-y-[8px]'}`}></div>
        </button>

        {/* Desktop Navigation (optional, falls du eine andere für Desktop willst) */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link href="/" className="text-white hover:text-yellow-400 transition-colors">SPIEL</Link>
          <Link href="/info" className="text-white hover:text-yellow-400 transition-colors">INFOS</Link>
          <Link href="/agb" className="text-white hover:text-yellow-400 transition-colors">AGB</Link>
          <Link href="/kontakt" className="text-white hover:text-yellow-400 transition-colors">KONTAKT</Link>
          {currentUser && (
            <Link href="/admin" className="text-white hover:text-yellow-400 transition-colors font-bold">ADMIN</Link>
          )}
          {isAuthLoading ? (
            <div className="text-white">...</div>
          ) : currentUser ? (
            <button
              onClick={handleSignOut} // Use new handler
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
            >
              Sign Out
            </button>
          ) : (
            <button
              onClick={handleSignIn} // Use new handler
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Sign In with Google
            </button>
          )}
        </nav>
      </div>

      {/* Mobile Menu Overlay */}
      <div
        className={`
          fixed top-[70px] left-0 right-0 bottom-0 w-full bg-black z-30 transition-opacity duration-300 shadow-lg overflow-auto md:hidden
          ${menuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        `}
      >
        <nav className="flex flex-col items-center justify-center h-full space-y-8">
          <Link href="/" onClick={() => setMenuOpen(false)} className="text-3xl text-white hover:text-yellow-400 transition-colors">SPIEL</Link>
          <Link href="/info" onClick={() => setMenuOpen(false)} className="text-3xl text-white hover:text-yellow-400 transition-colors">INFOS</Link>
          <Link href="/agb" onClick={closeMenu} className="text-3xl text-white hover:text-yellow-400 transition-colors">AGB</Link>
          <Link href="/kontakt" onClick={closeMenu} className="text-3xl text-white hover:text-yellow-400 transition-colors">KONTAKT</Link>
          {currentUser && (
            <Link href="/admin" onClick={closeMenu} className="text-3xl text-white hover:text-yellow-400 transition-colors font-bold">ADMIN</Link>
          )}
          
          <hr className="w-2/3 border-gray-700 my-6" />

          {isAuthLoading ? (
            <div className="text-white text-3xl">Loading...</div>
          ) : currentUser ? (
            <button
              onClick={handleSignOut} // Use new handler
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg text-3xl"
            >
              Sign Out
            </button>
          ) : (
            <button
              onClick={handleSignIn} // Use new handler
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-3xl"
            >
              Sign In with Google
            </button>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
