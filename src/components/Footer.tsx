'use client';

const Footer = () => {
  return (
    <footer className="fixed bottom-0 left-0 right-0 w-full bg-black border-t border-gray-800 p-6 text-center text-gray-500 text-sm z-30">
      <p>&copy; {new Date().getFullYear()} CUXSNACK. Alle Rechte vorbehalten.</p>
    </footer>
  );
};

export default Footer;
