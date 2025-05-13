import Link from 'next/link';

export default function KontaktPage() {
  return (
    <div className="w-full flex-grow flex flex-col items-center justify-center bg-black text-white font-sans overflow-hidden py-10">
      <div className="max-w-xl w-full mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col">
        {/* Apply gradient to title */}
        <h1 className="text-4xl sm:text-5xl font-barber-chop mb-6 bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 bg-clip-text text-transparent tracking-wider">
          KONTAKT
        </h1>
        <div className="space-y-4 text-base sm:text-lg">
          <p className="text-gray-300 mb-6 text-sm sm:text-base">
            Hast du Fragen, Anregungen oder möchtest einfach nur Hallo sagen?
            Wir freuen uns von dir zu hören!
          </p>
          <div className="p-3 sm:p-4 text-left">
            {/* Apply gradient to subheading */}
            <p className="font-semibold text-md sm:text-lg mb-1 bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 bg-clip-text text-transparent">E-Mail:</p>
            <a href="mailto:info@cuxsnack.de" className="hover:underline text-gray-100 text-xs sm:text-sm">info@cuxsnack.de</a>
          </div>
          <div className="p-3 sm:p-4 text-left">
            {/* Apply gradient to subheading */}
            <p className="font-semibold text-md sm:text-lg mb-1 bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 bg-clip-text text-transparent">Telefon:</p>
            <p className="text-gray-100 text-xs sm:text-sm">+49 123 4567890</p>
          </div>
          <div className="p-3 sm:p-4 text-left">
            {/* Apply gradient to subheading */}
            <p className="font-semibold text-md sm:text-lg mb-1 bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 bg-clip-text text-transparent">Postanschrift:</p>
            <p className="text-gray-100 text-xs sm:text-sm">CuxSnack Cuxhaven<br />Poststraße 33<br />27474 Cuxhaven</p>
          </div>
        </div>
        {/* Apply gradient to button background */}
        <Link
          href="/"
          className="mt-8 inline-block bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 hover:from-yellow-500 hover:via-orange-600 hover:to-pink-600 text-black font-bold py-2.5 px-7 rounded-lg text-sm sm:text-md tracking-wide shadow-lg transition-transform transform hover:scale-105 self-center"
        >
          Zurück zum Spiel
        </Link>
      </div>
    </div>
  );
}