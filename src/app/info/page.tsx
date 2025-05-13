import Link from 'next/link';

export default function InfoPage() {
  return (
    <div className="w-full flex-grow flex flex-col items-center bg-black text-white font-sans py-10">
      <div className="max-w-xl w-full h-full flex flex-col mx-auto px-4 sm:px-6 lg:px-8 overflow-hidden">
        <h1 className="text-4xl sm:text-5xl font-barber-chop mb-6 bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 bg-clip-text text-transparent tracking-wider shrink-0 text-center">
          Info
        </h1>
        <div className="flex-grow space-y-4 text-base sm:text-lg text-left text-gray-300 overflow-y-auto pr-2">
          {/* Added pr-2 for scrollbar spacing if it appears */}
          <h2 className="text-2xl font-semibold mt-6 mb-2 bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 bg-clip-text text-transparent">Willkommen bei CUXSNACK!</h2>
          <p className="mb-4">
            CUXSNACK ist dein neuer Lieblingsort für die aufregendsten und leckersten Snacks aus aller Welt, direkt hier in Cuxhaven und online! Unsere Mission ist es, dir ein einzigartiges Snack-Erlebnis zu bieten, das du so schnell nicht vergessen wirst. Von süß bis salzig, von klassisch bis exotisch – bei uns findest du alles, was dein Herz begehrt.
          </p>

          <h2 className="text-2xl font-semibold mt-6 mb-2 bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 bg-clip-text text-transparent">Unsere Geschichte</h2>
          <p className="mb-4">
            Gegründet aus einer Leidenschaft für außergewöhnliche Geschmackserlebnisse, haben wir es uns zur Aufgabe gemacht, die besten Snacks der Welt zusammenzutragen. Wir reisen (manchmal auch nur digital) um den Globus, um für dich die neuesten Trends und die köstlichsten Geheimtipps zu entdecken.
          </p>

          <h2 className="text-2xl font-semibold mt-6 mb-2 bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 bg-clip-text text-transparent">Die CUXSNACK Slot Machine</h2>
          <p className="mb-4">
            Als besonderes Highlight haben wir unsere CUXSNACK Slot Machine entwickelt! Teste dein Glück und gewinne coole virtuelle Preise oder vielleicht sogar einen echten Rabatt für deinen nächsten Einkauf. Die Slot Machine ist unser Dankeschön an dich – für deine Treue und deine Neugier.
          </p>
          
          <h2 className="text-2xl font-semibold mt-6 mb-2 bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 bg-clip-text text-transparent">Unser Versprechen</h2>
          <p className="mb-2">
            <b>Qualität:</b> Wir achten auf hochwertige Produkte und ausgewählte Zutaten.
          </p>
          <p className="mb-2">
            <b>Vielfalt:</b> Unser Sortiment wird ständig erweitert und an deine Wünsche angepasst.
          </p>
          <p className="mb-4">
            <b>Spaß:</b> Bei CUXSNACK geht es nicht nur ums Snacken, sondern auch um den Spaß dabei!
          </p>

          <p className="mt-6">
            Wir freuen uns darauf, dich in der Welt von CUXSNACK begrüßen zu dürfen!
          </p>
        </div>
        <Link
          href="/"
          className="mt-8 inline-block bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 hover:from-yellow-500 hover:via-orange-600 hover:to-pink-600 text-black font-bold py-2.5 px-7 rounded-lg text-sm sm:text-md tracking-wide shadow-lg transition-transform transform hover:scale-105 self-center shrink-0"
        >
          Zurück zum Spiel
        </Link>
      </div>
    </div>
  );
}
