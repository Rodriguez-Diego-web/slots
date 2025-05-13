import Link from 'next/link';

export default function AgbPage() {
  return (
    <div className="w-full flex-grow flex flex-col items-center bg-black text-white font-sans py-10">
      <div className="max-w-xl w-full h-full flex flex-col mx-auto px-4 sm:px-6 lg:px-8 overflow-hidden">
        <h1 className="text-4xl sm:text-5xl font-barber-chop mb-6 bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 bg-clip-text text-transparent tracking-wider shrink-0 text-center">
          AGBs
        </h1>
        <div className="flex-grow space-y-4 text-base sm:text-lg text-left text-gray-300 overflow-y-auto pr-2">
          {/* Added pr-2 for scrollbar spacing if it appears */}
          <p className="mb-4">
            Herzlich willkommen bei CUXSNACK! Diese Allgemeinen Geschäftsbedingungen (AGB) regeln die Nutzung unserer Webseite und der darauf angebotenen Dienste, insbesondere des CUXSNACK Slot Machine Spiels.
          </p>

          <h2 className="text-2xl font-semibold mt-6 mb-2 bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 bg-clip-text text-transparent">1. Geltungsbereich</h2>
          <p className="mb-2">
            1.1. Diese AGB gelten für alle Nutzer der CUXSNACK Webseite und des Slot Machine Spiels.
          </p>
          <p className="mb-4">
            1.2. Mit der Nutzung unserer Dienste erklären Sie sich mit diesen AGB einverstanden. Wenn Sie den AGB nicht zustimmen, dürfen Sie unsere Dienste nicht nutzen.
          </p>

          <h2 className="text-2xl font-semibold mt-6 mb-2 bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 bg-clip-text text-transparent">2. Nutzung des Slot Machine Spiels</h2>
          <p className="mb-2">
            2.1. Die Teilnahme am Slot Machine Spiel ist kostenlos und dient reinen Unterhaltungszwecken.
          </p>
          <p className="mb-2">
            2.2. Nutzer erhalten eine begrenzte Anzahl an Versuchen (Spins) gemäß den Angaben auf der Webseite. Angemeldete Nutzer können unter Umständen mehr Versuche erhalten.
          </p>
          <p className="mb-4">
            2.3. Gewinne aus dem Spiel sind virtuell und können nicht in Echtgeld oder reale Waren umgetauscht werden, es sei denn, dies wird ausdrücklich von CUXSNACK im Rahmen einer speziellen Aktion angeboten und kommuniziert. QR-Codes, die als Gewinne generiert werden, können spezifische virtuelle Güter oder Rabatte repräsentieren, wie auf der Webseite oder durch den QR-Code selbst ausgewiesen.
          </p>

          <h2 className="text-2xl font-semibold mt-6 mb-2 bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 bg-clip-text text-transparent">3. Nutzerkonto</h2>
          <p className="mb-2">
            3.1. Für erweiterte Funktionen, wie z.B. eine höhere Anzahl an Spins oder das Speichern von Spielfortschritten, kann eine Registrierung und Anmeldung erforderlich sein.
          </p>
          <p className="mb-4">
            3.2. Sie sind für die Geheimhaltung Ihrer Zugangsdaten verantwortlich und haften für alle Aktivitäten, die über Ihr Konto erfolgen.
          </p>

          <h2 className="text-2xl font-semibold mt-6 mb-2 bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 bg-clip-text text-transparent">4. Geistiges Eigentum</h2>
          <p className="mb-4">
            Alle Inhalte auf dieser Webseite, einschließlich Texte, Grafiken, Logos, Bilder und Software, sind Eigentum von CUXSNACK oder seinen Lizenzgebern und durch Urheberrechte geschützt.
          </p>

          <h2 className="text-2xl font-semibold mt-6 mb-2 bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 bg-clip-text text-transparent">5. Haftungsbeschränkung</h2>
          <p className="mb-4">
            CUXSNACK übernimmt keine Haftung für direkte oder indirekte Schäden, die aus der Nutzung der Webseite oder des Spiels entstehen, soweit dies gesetzlich zulässig ist.
          </p>

          <h2 className="text-2xl font-semibold mt-6 mb-2 bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 bg-clip-text text-transparent">6. Änderungen der AGB</h2>
          <p className="mb-4">
            CUXSNACK behält sich das Recht vor, diese AGB jederzeit zu ändern. Die geänderten AGB werden auf der Webseite veröffentlicht. Durch die fortgesetzte Nutzung unserer Dienste nach einer solchen Änderung erklären Sie sich mit den neuen AGB einverstanden.
          </p>

          <h2 className="text-2xl font-semibold mt-6 mb-2 bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 bg-clip-text text-transparent">7. Schlussbestimmungen</h2>
          <p className="mb-2">
            7.1. Es gilt das Recht der Bundesrepublik Deutschland.
          </p>
          <p className="mb-4">
            7.2. Sollten einzelne Bestimmungen dieser AGB unwirksam sein oder werden, bleibt die Gültigkeit der übrigen Bestimmungen unberührt.
          </p>

          <p className="mt-6">
            Stand: Mai 2024
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
