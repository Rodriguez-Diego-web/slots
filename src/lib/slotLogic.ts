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
    weight: 1,    
    value: 100,
    winningWordForMatch: "JACKPOT!"
  },
  {
    id: 'gutschein',
    name: 'Gutschein',
    image: '/symbols/2.png',
    weight: 5,    
    value: 20,
    winningWordForMatch: "GUTSCHEIN GEWONNEN!"
  },
  {
    id: 'lifebar',
    name: 'Lifebar',
    image: '/symbols/7.png',
    weight: 10,    
    value: 30,
    winningWordForMatch: "Calypso deiner Wahl"
  },
  {
    id: 'takis',
    name: 'Takis',
    image: '/symbols/4.png',
    weight: 15,    
    value: 10,
    winningWordForMatch: "FEURIGE TAKIS!"
  },
  {
    id: 'cheetos',
    name: 'Cheetos',
    image: '/symbols/3.png',
    weight: 25,    
    value: 5,
    winningWordForMatch: "Doritos deiner Wahl"
  },
  {
    id: 'pombaeren',
    name: 'Pombären',
    image: '/symbols/1.png',
    weight: 20,    
    value: 2,
    winningWordForMatch: "Capri-Sun deiner Wahl"
  },
  {
    id: 'lays',
    name: 'Lays',
    image: '/symbols/5.png',
    weight: 25,    
    value: 3,
    winningWordForMatch: "Snickers deiner Wahl"
  }
];

const totalWeight = symbols.reduce((sum, symbol) => sum + symbol.weight, 0); 

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
  const resultSymbols = [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()];
  const winDetails = calculateWinDetails(resultSymbols);

  return {
    symbols: resultSymbols,
    winAmount: winDetails.winAmount,
    winningWord: winDetails.winningWord,
  };
}

// Game-Stats wurden entfernt, da keine progressive Logik mehr verwendet wird
