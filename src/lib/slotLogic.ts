export type SlotSymbol = {
  id: string;
  name: string;
  image: string;
  weight: number; 
  value: number;  
  winningWordForMatch?: string; 
};

export const symbols: SlotSymbol[] = [
  {
    id: 'seven',
    name: '7',
    image: '/symbols/6.png',
    weight: 100,    
    value: 100,
    winningWordForMatch: "JACKPOT!"
  },
  {
    id: 'gutschein',
    name: 'Gutschein',
    image: '/symbols/2.png',
    weight: 2,    
    value: 20,
    winningWordForMatch: "GUTSCHEIN GEWONNEN!"
  },
  {
    id: 'lifebar',
    name: 'Lifebar',
    image: '/symbols/7.png',
    weight: 3,    
    value: 15,
    winningWordForMatch: "Calypso deiner Wahl"
  },
  {
    id: 'takis',
    name: 'Takis',
    image: '/symbols/4.png',
    weight: 4,    
    value: 10,
    winningWordForMatch: "FEURIGE TAKIS!"
  },
  {
    id: 'cheetos',
    name: 'Cheetos',
    image: '/symbols/3.png',
    weight: 8,    
    value: 5,
    winningWordForMatch: "Doritos deiner Wahl"
  },
  {
    id: 'lays',
    name: 'Lays',
    image: '/symbols/5.png',
    weight: 4,    
    value: 3,
    winningWordForMatch: "Snickers deiner Wahl"
  },
  {
    id: 'pombaeren',
    name: 'Pombären',
    image: '/symbols/1.png',
    weight: 4,    
    value: 2,
    winningWordForMatch: "Capri-Sun deiner Wahl"
  }
];

const totalWeight = symbols.reduce((sum, symbol) => sum + symbol.weight, 0);

let gamesPlayed = 0;
let lastBigWin = 0;
const CYCLE_LENGTH = 50; 
const JACKPOT_MIN_GAMES = 100; 

export function getRandomSymbol(): SlotSymbol {
  const randNum = Math.random() * totalWeight;
  let weightSum = 0;
  
  for (const symbol of symbols) {
    weightSum += symbol.weight;
    if (randNum <= weightSum) {
      return symbol;
    }
  }
  
  return symbols[symbols.length - 1];
}

export function calculateWinDetails(resultSymbols: SlotSymbol[]): { winAmount: number, winningWord: string | null } {
  if (resultSymbols[0].id === resultSymbols[1].id && resultSymbols[1].id === resultSymbols[2].id) {
    const winningSymbol = resultSymbols[0];
    return {
      winAmount: winningSymbol.value,
      winningWord: winningSymbol.winningWordForMatch || `3x ${winningSymbol.name}` 
    };
  }
  
  return { winAmount: 0, winningWord: null };
}

export type SpinResult = {
  symbols: SlotSymbol[];
  winAmount: number;
  winningWord: string | null;
};

export function spin(): SpinResult {
  gamesPlayed++;
  
  let resultSymbols = [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()];
  
  const gamesSinceWin = gamesPlayed - lastBigWin;
  
  if (gamesSinceWin > CYCLE_LENGTH) {
    if (Math.random() < 0.05 * (gamesSinceWin / CYCLE_LENGTH)) {
      const mediumWinSymbolCandidates = symbols.filter(s => s.value >= 5 && s.value < 50);
      const winningSymbol = mediumWinSymbolCandidates.length > 0 
                            ? mediumWinSymbolCandidates[Math.floor(Math.random() * mediumWinSymbolCandidates.length)] 
                            : symbols.find(s => s.id === 'cheetos') || symbols[1]; 
      resultSymbols = [winningSymbol, winningSymbol, winningSymbol];
      lastBigWin = gamesPlayed; 
    }
  }
  
  if (gamesSinceWin > JACKPOT_MIN_GAMES) { 
    if (Math.random() < 0.000001 * (gamesSinceWin / JACKPOT_MIN_GAMES)) { 
      const jackpotSymbol = symbols.find(s => s.id === 'seven')!;
      if (resultSymbols[0].id !== jackpotSymbol.id || resultSymbols[1].id !== jackpotSymbol.id || resultSymbols[2].id !== jackpotSymbol.id) {
        resultSymbols = [jackpotSymbol, jackpotSymbol, jackpotSymbol];
        lastBigWin = gamesPlayed; 
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

export function resetGameState(): void {
  gamesPlayed = 0;
  lastBigWin = 0;
}
export function getGameStats(): { gamesPlayed: number, gamesSinceWin: number } {
  return {
    gamesPlayed,
    gamesSinceWin: gamesPlayed - lastBigWin,
  };
}
