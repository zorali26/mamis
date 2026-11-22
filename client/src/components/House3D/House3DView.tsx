import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { PerspectiveCamera, Plane, Raycaster, Vector2, Vector3 } from "three";
import HouseScene from "./HouseScene";
import { HOUSE_CENTER, useHouseController } from "./useHouseController";
import { APPLIANCES, levelCost, levelIncome } from "../../data/appliances";
import { canPlace, defaultLayout, GRID, Layout } from "./layout";
import { api, useAuth } from "../../lib/store";
import { useTutorialBus } from "../../lib/tutorialBus";
import { ensureFbAuth, rtDb } from "../../lib/firebase";
import { get, ref as dbRef, set as fbSet } from "firebase/database";

interface Props {
  apps: { id: string; level: number; owned: boolean }[];
  balance: number;
  spirit: number;
  onBuy: (id: string) => void;
  onUpgrade: (id: string) => void;
}

/** Orbit camera, eased every frame toward the controller target. */
function CameraDriver({ controller }: { controller: ReturnType<typeof useHouseController> }) {
  const { camera } = useThree();
  const cam = camera as PerspectiveCamera;
  const target = useMemo(() => new Vector3(), []);
  useFrame(() => {
    const s = controller.step();
    target.set(HOUSE_CENTER.x + s.panX, HOUSE_CENTER.y, HOUSE_CENTER.z + s.panZ);
    const h = s.radius * Math.sin(s.polar);
    cam.position.set(
      target.x + h * Math.cos(s.az),
      target.y + s.radius * Math.cos(s.polar),
      target.z + h * Math.sin(s.az)
    );
    cam.lookAt(target);
    cam.updateProjectionMatrix();
  });
  return null;
}

/** Raycasts the floor while an appliance is dragged (Clash of Clans style placement). */
function ItemDragHandler({
  dragRef,
  positionsRef,
  onMove,
  onEnd,
}: {
  dragRef: React.MutableRefObject<string | null>;
  positionsRef: React.MutableRefObject<Layout>;
  onMove: (id: string, x: number, z: number) => void;
  onEnd: () => void;
}) {
  const { camera, gl } = useThree();
  useEffect(() => {
    const ray = new Raycaster();
    const plane = new Plane(new Vector3(0, 1, 0), 0);
    const hit = new Vector3();
    const ndc = new Vector2();
    const move = (e: PointerEvent) => {
      const id = dragRef.current;
      if (!id) return;
      const rect = gl.domElement.getBoundingClientRect();
      ndc.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      if (!ray.ray.intersectPlane(plane, hit)) return;
      const x = Math.round(hit.x / GRID) * GRID;
      const z = Math.round(hit.z / GRID) * GRID;
      if (canPlace(id, x, z, positionsRef.current)) onMove(id, x, z);
    };
    const up = () => {
      if (dragRef.current) onEnd();
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [camera, gl, dragRef, positionsRef, onMove, onEnd]);
  return null;
}

/** The big 3D viewer - shown directly inside the Assets page. */
export default function House3DView({ apps, balance, spirit, onBuy, onUpgrade }: Props) {
  const controller = useHouseController();
  const { user } = useAuth();
  const layoutPath = `layouts/${user?.id ?? "guest"}`;
  const [ready, setReady] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [moveMode, setMoveMode] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const ownedIds = useMemo(() => new Set(apps.filter((a) => a.owned).map((a) => a.id)), [apps]);
  const [positions, setPositions] = useState<Layout>(() => defaultLayout());
  const [loaded, setLoaded] = useState(false);
  const dragRef = useRef<string | null>(null);
  const positionsRef = useRef<Layout>(positions);
  positionsRef.current = positions;

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 250);
    return () => clearTimeout(t);
  }, []);

  // load saved furniture positions from Firebase RTDB (server API as fallback)
  useEffect(() => {
    let alive = true;
    const fallback = async () => {
      try {
        const j = await api("/appliances/layout");
        if (alive && j?.layout) setPositions({ ...defaultLayout(), ...j.layout });
      } catch {} 
      finally { if (alive) setLoaded(true); }
    };
    const load = async () => {
      try {
        await ensureFbAuth();
        const snap = await get(dbRef(rtDb, layoutPath));
        const val = snap.val();
        if (alive && val && typeof val === "object") setPositions({ ...defaultLayout(), ...(val as Layout) });
        if (alive) setLoaded(true);
      } catch { fallback(); }
    };
    load();
    return () => { alive = false; };
  }, [layoutPath]);

  // persist positions after a drag
  useEffect(() => {
    if (!loaded) return;
    const t = setTimeout(() => {
      const fallbackApi = () => api("/appliances/layout", { method: "PUT", body: JSON.stringify({ layout: positions }) }).catch(() => {});
      ensureFbAuth()
        .then(() => fbSet(dbRef(rtDb, layoutPath), positions))
        .catch(fallbackApi);
    }, 350);
    return () => clearTimeout(t);
  }, [positions, loaded, layoutPath]);

  const onDragStart = useCallback((id: string) => {
    dragRef.current = id;
    controller.setItemDrag(id);
    document.body.style.cursor = "grabbing";
  }, [controller]);

  const onDragMove = useCallback((id: string, x: number, z: number) => {
    setPositions((prev) => ({ ...prev, [id]: { x, z } }));
  }, []);

  const onDragEnd = useCallback(() => {
    dragRef.current = null;
    controller.setItemDrag(null);
    setMoveMode(null);
    document.body.style.cursor = "auto";
    useTutorialBus.getState().noteDrag();
  }, [controller]);

  const onSelectItem = useCallback((id: string) => {
    setSelected(id);
    useTutorialBus.getState().select(id);
  }, []);

  // native non-passive listeners: wheel zoom and touch dragging must never scroll the page
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const wheel = (e: WheelEvent) => controller.onWheel(e);
    const start = (e: TouchEvent) => controller.onTouchStart(e as unknown as React.TouchEvent);
    const move = (e: TouchEvent) => {
      if (e.touches.length > 0) e.preventDefault();
      controller.onTouchMove(e as unknown as React.TouchEvent);
    };
    const end = () => controller.onTouchEnd();
    el.addEventListener("wheel", wheel, { passive: false });
    el.addEventListener("touchstart", start, { passive: false });
    el.addEventListener("touchmove", move, { passive: false });
    el.addEventListener("touchend", end);
    el.addEventListener("touchcancel", end);
    return () => {
      el.removeEventListener("wheel", wheel);
      el.removeEventListener("touchstart", start);
      el.removeEventListener("touchmove", move);
      el.removeEventListener("touchend", end);
      el.removeEventListener("touchcancel", end);
    };
  }, [controller]);

  const def = APPLIANCES.find((d) => d.id === selected);
  const app = apps.find((a) => a.id === selected);
  const owned = !!app?.owned;
  const level = app?.level ?? 0;
  const canBuy = !!def && balance >= def.baseCost;
  const upgradeCost = def ? levelCost(def.baseCost, level) : 0;

  return (
    <div ref={wrapRef} data-tutorial="canvas" className="relative w-full h-[min(72vh,580px)] min-h-[420px] bg-[#0b1020] rounded-2xl overflow-hidden border border-slate-700 shadow-xl select-none">
      <Canvas
        shadows
        dpr={[1, 1.6]}
        camera={{ fov: 48 }}
        className="absolute inset-0 w-full h-full"
        onPointerDown={controller.onPointerDown}
        onPointerMove={controller.onPointerMove}
        onPointerUp={controller.onPointerUp}
        onDoubleClick={controller.reset}
        onPointerMissed={() => setMoveMode(null)}
        onContextMenu={(e) => e.preventDefault()}
      >
        <CameraDriver controller={controller} />
        <ItemDragHandler dragRef={dragRef} positionsRef={positionsRef} onMove={onDragMove} onEnd={onDragEnd} />
        <HouseScene onSelect={onSelectItem} ownedIds={ownedIds} positions={positions} onDragStart={onDragStart} moveMode={moveMode} />
      </Canvas>

      {/* loading animation */}
      {!ready && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 bg-[#0b1020] z-20">
          <div className="spinner" />
          <div className="text-sm text-slate-400">3D model yükleniyor...</div>
        </div>
      )}

      {/* header / control hints */}
      <div className="absolute top-3 left-3 z-10 pointer-events-none flex flex-col items-start gap-0.5">
        <div className="font-bold text-slate-100 text-base">
          Evim · <span className="text-accent num">{spirit.toLocaleString("tr-TR")}</span> Ev Ruhu
        </div>
        <div className="text-[11px] text-accent">Eşyaya dokun → Taşı → sürükleyerek yerini değiştir</div>
        <div className="text-[11px] text-slate-400">Boş alanda sürükle: döndür · Tekerlek / iki parmak: yakınlaştır</div>
        <div className="text-[11px] text-slate-500">Çift tıkla / çift dokun: başlangıç görünümü</div>
      </div>

      {/* selected appliance: buy / upgrade */}
      {def && (
        <div className="absolute bottom-3 left-3 right-3 z-10 flex items-center justify-between gap-3 rounded-xl border border-slate-700 bg-[#0d1424]/95 px-4 py-3 shadow-lg">
          <div className="min-w-0">
            <div className="font-semibold text-sm text-slate-100">{def.name} {owned && <span className="text-accent text-xs">· Seviye {level}</span>}</div>
            <div className="text-xs text-slate-400 truncate">
              {owned
                ? `Pasif gelir: ${levelIncome(def.baseIncome, level).toFixed(1)} MC/saat${level >= def.maxLevel ? " · Maksimum" : ""}`
                : `Henüz sahip değilsin · Satın alma maliyeti: ${def.baseCost} MC`}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {owned && (
              <button
                data-tutorial="move-item"
                onClick={() => setMoveMode((m) => (m === def.id ? null : def.id))}
                className={"text-xs font-bold px-3 py-1.5 rounded-lg border whitespace-nowrap transition-colors " +
                  (moveMode === def.id ? "border-accent text-accent bg-accent/10" : "border-slate-600 text-slate-200 hover:border-accent")}
              >
                {moveMode === def.id ? "Taşımayı Bitir" : "Taşı"}
              </button>
            )}
            {owned ? (
              <button
                disabled={level >= def.maxLevel}
                onClick={() => onUpgrade(def.id)}
                className="text-xs font-bold px-3 py-1.5 rounded-lg bg-accent text-bg disabled:opacity-40 whitespace-nowrap"
              >
                {level >= def.maxLevel ? "MAX" : `Yükselt · ${upgradeCost} MC`}
              </button>
            ) : (
              <button
                data-tutorial="buy-item"
                disabled={!canBuy}
                onClick={() => onBuy(def.id)}
                className="text-xs font-bold px-3 py-1.5 rounded-lg bg-accent text-bg disabled:opacity-40 whitespace-nowrap"
              >
                Satın Al · {def.baseCost} MC
              </button>
            )}
            <button onClick={() => setSelected(null)} className="w-7 h-7 rounded-full border border-slate-700 text-slate-400 hover:text-slate-100" aria-label="Kapat">✕</button>
          </div>
        </div>
      )}

      {!def && (
        <div className="absolute bottom-3 left-3 z-10 pointer-events-none text-xs text-slate-500 bg-[#0d1424]/70 rounded-lg px-3 py-1.5">
          Bir eşyaya dokun: satın al veya yükselt
        </div>
      )}
    </div>
  );
}
