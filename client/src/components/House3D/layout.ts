/** Appliance footprints / default spots on the 16 x 12 house base. */
export const FLOOR = { w: 16, d: 12 };
export const GRID = 0.5;

export interface ItemSpec {
  w: number; // footprint width (X)
  d: number; // footprint depth (Z)
  scale: number; // visual scale
  x: number; // default centre
  z: number;
}

export const ITEM_SPECS: Record<string, ItemSpec> = {
  tv: { w: 3.7, d: 1.3, scale: 1.3, x: 3.2, z: 2.6 },
  vacuum: { w: 4.2, d: 3.6, scale: 3, x: 2.5, z: 7.5 },
  oven: { w: 1.92, d: 1.12, scale: 1.6, x: 13.5, z: 5.5 },
  microwave: { w: 2.5, d: 1.8, scale: 2, x: 10, z: 6 },
  fridge: { w: 2.0, d: 1.36, scale: 1.6, x: 13.5, z: 9.5 },
  washer: { w: 3.15, d: 0.9, scale: 1.5, x: 12.5, z: 2 },
  dishwasher: { w: 1.54, d: 0.7, scale: 1.4, x: 15.2, z: 2 },
  iron: { w: 2.7, d: 1.5, scale: 3, x: 9, z: 2 },
  hairdryer: { w: 1.65, d: 0.9, scale: 3, x: 3, z: 10.5 },
};

export interface Pos { x: number; z: number }
export type Layout = Record<string, Pos>;

export function defaultLayout(): Layout {
  const out: Layout = {};
  for (const [id, s] of Object.entries(ITEM_SPECS)) out[id] = { x: s.x, z: s.z };
  return out;
}

/** Keeps a dragged item inside the floor and away from every other item. */
export function canPlace(id: string, x: number, z: number, layout: Layout): boolean {
  const s = ITEM_SPECS[id];
  if (!s) return false;
  if (x - s.w / 2 < 0.1 || x + s.w / 2 > FLOOR.w - 0.1) return false;
  if (z - s.d / 2 < 0.1 || z + s.d / 2 > FLOOR.d - 0.1) return false;
  for (const [oid, o] of Object.entries(layout)) {
    if (oid === id) continue;
    const os = ITEM_SPECS[oid];
    if (!os || !o) continue;
    // strict: footprints may touch, but never overlap
    if (Math.abs(x - o.x) < (s.w + os.w) / 2 && Math.abs(z - o.z) < (s.d + os.d) / 2) return false;
  }
  return true;
}
