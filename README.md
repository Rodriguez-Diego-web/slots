# CUXSNACK Slot Machine

Eine interaktive Slot Machine für den CUXSNACK Export-Snack Shop. Diese Anwendung wurde mit Next.js und React entwickelt und bietet ein spannendes Spielerlebnis mit der Möglichkeit, virtuelle Preise zu gewinnen.

## Features

- Reaktive 3-Walzen Slot Machine mit authentischem Spielgefühl
- Visuelle Effekte und Animationen für ein immersives Spielerlebnis
- Spezielle Gewinnlogik mit kontrollierten Gewinnraten
- Hauptgewinn (Jackpot) durch drei "777" Symbole
- Design im CUXSNACK Branding (Schwarz, Weiß, Grau)
- Mobile-friendly Responsive Design

## Voraussetzungen

- Node.js 18.0.0 oder höher
- npm oder yarn oder pnpm oder bun

## Installation

```bash
# Abhängigkeiten installieren
npm install

# Entwicklungsserver starten
npm run dev
```

Öffne [http://localhost:3000](http://localhost:3000) mit deinem Browser, um die Slot Machine zu sehen.

## Symbole anpassen

Die Slot Machine verwendet derzeit Platzhalter für die Symbol-Bilder. Um diese durch echte Bilder zu ersetzen:

1. Ersetze die Dateien im Verzeichnis `/public/symbols/` mit deinen eigenen Bildern
2. Folgende Bilder werden benötigt:
   - `seven.png` - Symbol für den Jackpot (777)
   - `monster.png` - Monster Energy Drink
   - `cola.png` - Coca Cola
   - `heinz.png` - Heinz Ketchup
   - `fanta.png` - Fanta Orange
   - `chips.png` - Chips/Takis
   - `water.png` - Mineralwasser

Idealerweise sollten alle Bilder quadratisch sein (z.B. 200x200 Pixel) mit transparentem Hintergrund.

## Gewinnlogik anpassen

Die Gewinnwahrscheinlichkeiten und Auszahlungsquoten können in der Datei `src/lib/slotLogic.ts` angepasst werden:

- Ändere die `weight`-Werte der Symbole, um ihre Häufigkeit anzupassen
- Ändere die `value`-Werte, um die Auszahlungen zu ändern
- Passe die Konstanten `CYCLE_LENGTH` und `JACKPOT_MIN_GAMES` an, um das Spielverhalten zu ändern

## Technologie-Stack

- [Next.js](https://nextjs.org) - React Framework
- [React](https://reactjs.org) - Frontend Bibliothek
- [TypeScript](https://www.typescriptlang.org) - Typsicheres JavaScript
- [TailwindCSS](https://tailwindcss.com) - Utility-First CSS Framework
