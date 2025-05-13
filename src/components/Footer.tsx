'use client';

const Footer = () => {
  return (
    // Added fixed, bottom-0, left-0, right-0 for fixed positioning
    // z-30 was already there, which is good.
    // relative is no longer needed if it's fixed.
    <footer className="fixed bottom-0 left-0 right-0 w-full bg-black border-t border-gray-800 p-6 text-center text-gray-500 text-sm z-30">
      <p>&copy; {new Date().getFullYear()} CUXSNACK. Alle Rechte vorbehalten.</p>
      {/* Hier könntest du später weitere Links einfügen, z.B. Impressum, Datenschutz */}
    </footer>
  );
};

export default Footer;
