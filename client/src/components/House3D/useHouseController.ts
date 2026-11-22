import { useCallback, useRef } from "react";

/* Orbit camera for the 3D house - standard, intuitive touch/mouse controls.
 *
 *   drag (1 finger / mouse) : rotate camera (azimuth + tilt)
 *   2-finger drag           : walk / pan the view inside the house
 *   pinch / mouse wheel     : zoom in & out
 *   double click / tap      : smooth reset to the default isometric view
 */

export const HOUSE_CENTER = { x: 8, y: 0.3, z: 6 };

const DEFAULTS = { az: -0.9, polar: 0.42, radius: 21, panX: 0, panZ: 0 };

const POLAR_RANGE: [number, number] = [0.12, 1.05]; // from vertical: 7° .. 60°
const RADIUS_RANGE: [number, number] = [14, 42];
const PAN_RANGE: [number, number] = [-3.2, 3.2];

export interface CameraState {
  az: number;
  polar: number;
  radius: number;
  panX: number;
  panZ: number;
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export function useHouseController() {
  // intro: begin slightly rotated + zoomed out, then ease into the default isometric view
  const cur = useRef<CameraState>({ ...DEFAULTS, az: DEFAULTS.az - 0.22, radius: 34 });
  const tgt = useRef<CameraState>({ ...DEFAULTS });
  const drag = useRef<{ active: boolean; x: number; y: number }>({ active: false, x: 0, y: 0 });
  const pinch = useRef<{ active: boolean; dist: number; x: number; y: number }>({ active: false, dist: 0, x: 0, y: 0 });
  const lastTap = useRef<{ t: number; x: number; y: number }>({ t: 0, x: 0, y: 0 });
  const itemDrag = useRef<string | null>(null);

  /** While a furniture item is being moved, camera gestures are disabled. */
  const setItemDrag = useCallback((id: string | null) => {
    itemDrag.current = id;
    if (id) {
      drag.current = { active: false, x: 0, y: 0 };
      pinch.current = { active: false, dist: 0, x: 0, y: 0 };
    }
  }, []);

  const clampAll = useCallback(() => {
    const t = tgt.current;
    t.polar = clamp(t.polar, POLAR_RANGE[0], POLAR_RANGE[1]);
    t.radius = clamp(t.radius, RADIUS_RANGE[0], RADIUS_RANGE[1]);
    t.panX = clamp(t.panX, PAN_RANGE[0], PAN_RANGE[1]);
    t.panZ = clamp(t.panZ, PAN_RANGE[0], PAN_RANGE[1]);
  }, []);

  const reset = useCallback(() => {
    Object.assign(tgt.current, DEFAULTS);
  }, []);

  /** Ease current state toward the target; called once per rendered frame. */
  const step = useCallback(() => {
    const c = cur.current, t = tgt.current;
    const k = 0.16;
    c.az += (t.az - c.az) * k;
    c.polar += (t.polar - c.polar) * k;
    c.radius += (t.radius - c.radius) * k;
    c.panX += (t.panX - c.panX) * k;
    c.panZ += (t.panZ - c.panZ) * k;
    return c;
  }, []);

  /* ---- mouse ---- */
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (itemDrag.current) return;
    if (e.pointerType === "mouse" && e.button === 0) {
      e.preventDefault();
      drag.current = { active: true, x: e.clientX, y: e.clientY };
    }
  }, []);

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (itemDrag.current || !drag.current.active) return;
      e.preventDefault();
      const dx = e.clientX - drag.current.x;
      const dy = e.clientY - drag.current.y;
      drag.current.x = e.clientX;
      drag.current.y = e.clientY;
      tgt.current.az -= dx * 0.005; // horizontal drag -> rotate
      tgt.current.polar -= dy * 0.003; // vertical drag -> tilt
      clampAll();
    },
    [clampAll]
  );

  const onPointerUp = useCallback(() => {
    drag.current = { active: false, x: 0, y: 0 };
  }, []);

  const onWheel = useCallback(
    (e: { deltaY: number; preventDefault: () => void }) => {
      e.preventDefault();
      tgt.current.radius += e.deltaY * 0.022;
      clampAll();
    },
    [clampAll]
  );

  /* ---- touch ---- */
  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (itemDrag.current) return;
      const t = Array.from(e.touches);
      if (t.length === 1) {
        const now = performance.now();
        if (now - lastTap.current.t < 320 && Math.hypot(t[0].clientX - lastTap.current.x, t[0].clientY - lastTap.current.y) < 24) {
          reset(); // double tap -> default view
        }
        lastTap.current = { t: now, x: t[0].clientX, y: t[0].clientY };
        drag.current = { active: true, x: t[0].clientX, y: t[0].clientY };
        pinch.current = { active: false, dist: 0, x: 0, y: 0 };
      } else if (t.length >= 2) {
        drag.current = { active: false, x: 0, y: 0 };
        pinch.current = {
          active: true,
          dist: Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY),
          x: (t[0].clientX + t[1].clientX) / 2,
          y: (t[0].clientY + t[1].clientY) / 2,
        };
      }
    },
    [reset]
  );

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (itemDrag.current) return;
      const t = Array.from(e.touches);
      if (t.length === 1 && drag.current.active) {
        e.preventDefault();
        const dx = t[0].clientX - drag.current.x;
        const dy = t[0].clientY - drag.current.y;
        drag.current.x = t[0].clientX;
        drag.current.y = t[0].clientY;
        tgt.current.az -= dx * 0.005;
        tgt.current.polar -= dy * 0.003;
        clampAll();
      } else if (t.length >= 2 && pinch.current.active) {
        e.preventDefault();
        const d = Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
        const cx = (t[0].clientX + t[1].clientX) / 2;
        const cy = (t[0].clientY + t[1].clientY) / 2;
        if (d > 5 && pinch.current.dist > 5) tgt.current.radius *= pinch.current.dist / d;
        tgt.current.panX -= (cx - pinch.current.x) * 0.014; // two-finger walk
        tgt.current.panZ -= (cy - pinch.current.y) * 0.014;
        pinch.current = { active: true, dist: d, x: cx, y: cy };
        clampAll();
      }
    },
    [clampAll]
  );

  const onTouchEnd = useCallback(() => {
    drag.current = { active: false, x: 0, y: 0 };
    pinch.current = { active: false, dist: 0, x: 0, y: 0 };
  }, []);

  return { step, reset, setItemDrag, onPointerDown, onPointerMove, onPointerUp, onWheel, onTouchStart, onTouchMove, onTouchEnd };
}
