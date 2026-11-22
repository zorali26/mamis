export interface ApplianceDef {
  id: string;
  name: string;
  baseCost: number;
  baseIncome: number;
  maxLevel: number;
  spirit: number;
  icon: string;
}

export const APPLIANCES: ApplianceDef[] = [
  { id: "house", name: "Ev", baseCost: 400, baseIncome: 10, maxLevel: 3, spirit: 10, icon: "house" },
  { id: "fridge", name: "Buzdolabı", baseCost: 500, baseIncome: 12, maxLevel: 3, spirit: 0, icon: "fridge" },
  { id: "washer", name: "Çamaşır Makinesi", baseCost: 800, baseIncome: 20, maxLevel: 3, spirit: 0, icon: "washer" },
  { id: "dishwasher", name: "Bulaşık Makinesi", baseCost: 600, baseIncome: 15, maxLevel: 3, spirit: 0, icon: "dishwasher" },
  { id: "tv", name: "Televizyon", baseCost: 400, baseIncome: 8, maxLevel: 3, spirit: 0, icon: "tv" },
  { id: "ac", name: "Klima", baseCost: 1200, baseIncome: 30, maxLevel: 3, spirit: 0, icon: "ac" },
  { id: "microwave", name: "Mikrodalga", baseCost: 300, baseIncome: 6, maxLevel: 3, spirit: 0, icon: "microwave" },
  { id: "oven", name: "Fırın", baseCost: 700, baseIncome: 16, maxLevel: 3, spirit: 0, icon: "oven" },
  { id: "vacuum", name: "Elektrik Süpürgesi", baseCost: 350, baseIncome: 7, maxLevel: 3, spirit: 0, icon: "vacuum" },
  { id: "iron", name: "Ütü", baseCost: 250, baseIncome: 5, maxLevel: 3, spirit: 0, icon: "iron" },
  { id: "hairdryer", name: "Saç Kurutma Makinesi", baseCost: 200, baseIncome: 4, maxLevel: 3, spirit: 0, icon: "hairdryer" },
];

export const levelCost = (base: number, level: number) => Math.round(base * Math.pow(1.6, level));
export const levelIncome = (base: number, level: number) => Math.round(base * Math.pow(1.5, level) * 10) / 10;
export const spiritFor = (def: ApplianceDef, level: number) => (def.spirit || 0) + level * 5;
