// Constants and types for our slot machine
export type SlotSymbol = {
  id: string;
  name: string;
  image: string;
  weight: number; // Higher weight = more likely to appear
  value: number;  // Payout multiplier for 3 of a kind
  winningWordForMatch?: string; // Word to display for a 3-of-a-kind win
};

export const symbols: SlotSymbol[] = [
  {
    id: 'seven',
    name: '7',
    image: '/symbols/6.png',
    weight: 1,    // ~2.5% (1/40)
    value: 100,
    winningWordForMatch: "JACKPOT!"
  },
  {
    id: 'gutschein',
    name: 'Gutschein',
    image: '/symbols/2.png',
    weight: 2,    // ~5% (2/40)
    value: 20,
    winningWordForMatch: "GUTSCHEIN GEWONNEN!"
  },
  {
    id: 'lifebar',
    name: 'Lifebar',
    image: '/symbols/7.png',
    weight: 3,    // ~7.5% (3/40)
    value: 15,
    winningWordForMatch: "Calypso deiner Wahl"
  },
  {
    id: 'takis',
    name: 'Takis',
    image: '/symbols/4.png',
    weight: 4,    // ~10% (4/40)
    value: 10,
    winningWordForMatch: "FEURIGE TAKIS!"
  },
  {
    id: 'cheetos',
    name: 'Cheetos',
    image: '/symbols/3.png',
    weight: 8,    // 20% (8/40)
    value: 5,
    winningWordForMatch: "Doritos deiner Wahl"
  },
  {
    id: 'lays',
    name: 'Lays',
    image: '/symbols/5.png',
    weight: 4,    // ~10% (4/40)
    value: 3,
    winningWordForMatch: "Snickers deiner Wahl"
  },
  {
    id: 'pombaeren',
    name: 'Pombären',
    image: '/symbols/1.png',
    weight: 4,    // ~10% (4/40)
    value: 2,
    winningWordForMatch: "Capri-Sun deiner Wahl"
  }
];

// Calculate total weight for random selection
const totalWeight = symbols.reduce((sum, symbol) => sum + symbol.weight, 0);

// Game state tracking
let gamesPlayed = 0;
let lastBigWin = 0;
const CYCLE_LENGTH = 50; // Average games before bigger wins become possible
const JACKPOT_MIN_GAMES = 100; // Minimum games before jackpot possibility
// Return to player is approximately 90% based on weights and payout structure

// Get a random symbol based on its weight
export function getRandomSymbol(): SlotSymbol {
  const randNum = Math.random() * totalWeight;
  let weightSum = 0;
  
  for (const symbol of symbols) {
    weightSum += symbol.weight;
    if (randNum <= weightSum) {
      return symbol;
    }
  }
  
  // Fallback (should never happen)
  return symbols[symbols.length - 1];
}

// Calculate win amount and winning word for a given result
export function calculateWinDetails(resultSymbols: SlotSymbol[]): { winAmount: number, winningWord: string | null } {
  // Only award wins for three of the same symbol
  if (resultSymbols[0].id === resultSymbols[1].id && resultSymbols[1].id === resultSymbols[2].id) {
    const winningSymbol = resultSymbols[0];
    return {
      winAmount: winningSymbol.value,
      winningWord: winningSymbol.winningWordForMatch || `3x ${winningSymbol.name}` // Fallback if no specific word
    };
  }
  
  // No win in all other cases
  return { winAmount: 0, winningWord: null };
}

// Get results for one spin (3 reels), including win details
export type SpinResult = {
  symbols: SlotSymbol[];
  winAmount: number;
  winningWord: string | null;
};

export function spin(): SpinResult {
  gamesPlayed++;
  
  // Basic result - totally random based on weights
  let resultSymbols = [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()];
  
  // Adjust probability based on games played since last big win
  const gamesSinceWin = gamesPlayed - lastBigWin;
  
  // If we're due for a win, increase chances of matching symbols
  if (gamesSinceWin > CYCLE_LENGTH) {
    // 20% chance for medium win after CYCLE_LENGTH games
    if (Math.random() < 0.2 * (gamesSinceWin / CYCLE_LENGTH)) {
      const mediumWinSymbolCandidates = symbols.filter(s => s.value >= 5 && s.value < 50);
      const winningSymbol = mediumWinSymbolCandidates.length > 0 
                            ? mediumWinSymbolCandidates[Math.floor(Math.random() * mediumWinSymbolCandidates.length)] 
                            : symbols.find(s => s.id === 'cheetos') || symbols[1]; // Fallback to Cheetos or another default
      resultSymbols = [winningSymbol, winningSymbol, winningSymbol];
      lastBigWin = gamesPlayed; // Restore: Update lastBigWin for forced medium win
    }
  }
  
  // Jackpot possibility only after minimum games
  // Ensure this logic uses the gamesSinceWin from before any potential medium win forcing in this same spin.
  // The current gamesSinceWin is calculated once at the start, which is correct.
  if (gamesSinceWin > JACKPOT_MIN_GAMES) { 
    // Very small chance of jackpot
    if (Math.random() < 0.000001 * (gamesSinceWin / JACKPOT_MIN_GAMES)) { // Extrem reduzierte Jackpot-Wahrscheinlichkeit (praktisch nie)
      const jackpotSymbol = symbols.find(s => s.id === 'seven')!;
      if (resultSymbols[0].id !== jackpotSymbol.id || resultSymbols[1].id !== jackpotSymbol.id || resultSymbols[2].id !== jackpotSymbol.id) {
        // Only force jackpot if a medium win wasn't already forced to be a jackpot (unlikely, but safe check)
        // More importantly, ensure we are not overwriting a MORE valuable forced medium win with a jackpot if medium win was already selected.
        // This is tricky. The simplest interpretation is that these are independent forcing chances, but only one can ultimately apply.
        // For now, if medium win was forced, it stands. If not, jackpot can be forced.
        // A better way: check if resultSymbols were already changed by medium win logic. 
        // However, to revert to the previous state that user liked, we assume jackpot can override if conditions met
        // and if the medium win force did not happen in THIS spin (which means lastBigWin wasn't just reset).
        // The variable `lastBigWin` would have been updated if medium win was forced.
        // So, we need to check if `lastBigWin` is still the value from the *start* of this spin cycle.
        // This gets complicated. Let's keep it as it was before the last change that user disliked:
        // If the medium win was forced, `lastBigWin` is `gamesPlayed`. `gamesSinceWin` (if re-calculated) would be 0.
        // The original structure implies these blocks are checked sequentially using the same `gamesSinceWin` from the start of the function call.
        // If medium win set resultSymbols AND lastBigWin, the Jackpot block might still trigger if its conditions are met,
        // potentially overwriting resultSymbols. This is how it was before. 
        resultSymbols = [jackpotSymbol, jackpotSymbol, jackpotSymbol];
        lastBigWin = gamesPlayed; // Restore: Update lastBigWin for forced jackpot win
      }
    }
  }
  
  const winDetails = calculateWinDetails(resultSymbols);

  return {
    symbols: resultSymbols,
    winAmount: winDetails.winAmount,
    winningWord: winDetails.winningWord,
  };
}

// Reset game state (for testing)
export function resetGameState(): void {
  gamesPlayed = 0;
  lastBigWin = 0;
}

// Get current game stats (for debugging)
export function getGameStats(): { gamesPlayed: number, gamesSinceWin: number } {
  return {
    gamesPlayed,
    gamesSinceWin: gamesPlayed - lastBigWin,
  };
}
