export interface StockDef {
  id: string;
  name: string;
  seed: number;
  color: string;
  volatility: number;
  basePrice: number;
  active: boolean;
}

export const STOCKS: StockDef[] = [
  { id: "mamisg1", name: "MamisG1", seed: 0, color: "#22d3ee", volatility: 0.08, basePrice: 10, active: true },
  { id: "mamisg2", name: "MamisG2", seed: 1, color: "#a78bfa", volatility: 0, basePrice: 0, active: false },
  { id: "mamisg3", name: "MamisG3", seed: 2, color: "#f472b6", volatility: 0, basePrice: 0, active: false },
  { id: "taliong8", name: "TalionG8", seed: 3, color: "#fbbf24", volatility: 0, basePrice: 0, active: false },
  { id: "taliong4", name: "TalionG4", seed: 4, color: "#34d399", volatility: 0, basePrice: 0, active: false },
  { id: "zaloxc1", name: "ZaloxC1", seed: 5, color: "#60a5fa", volatility: 0, basePrice: 0, active: false },
  { id: "zaloxc3", name: "ZaloxC3", seed: 6, color: "#fb7185", volatility: 0, basePrice: 0, active: false },
  { id: "optimusd1", name: "OptimusD1", seed: 7, color: "#c084fc", volatility: 0, basePrice: 0, active: false },
];

export const CURRENCY = "MamiCoin";
export const CURRENCY_SHORT = "MC";
