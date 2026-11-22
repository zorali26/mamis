import { memo, useRef } from "react";
import { Color, Group, Mesh, MeshBasicMaterial, MeshStandardMaterial, MeshStandardMaterialParameters, PointLight } from "three";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { ITEM_SPECS, Layout, Pos } from "./layout";
import { APPLIANCES } from "../../data/appliances";

type V3 = [number, number, number];

type BProps = {
  pos: V3;
  size: V3;
  color?: string;
  opts?: Partial<MeshStandardMaterialParameters>;
  castShadow?: boolean;
  receiveShadow?: boolean;
  dimmed?: boolean;
};

export const B = memo(function B({ pos, size, color = "#d6d0c4", opts = {}, castShadow = true, receiveShadow = false, dimmed = false }: BProps) {
  return (
    <mesh position={pos} castShadow={castShadow} receiveShadow={receiveShadow}>
      <boxGeometry args={size} />
      <meshStandardMaterial
        color={color}
        {...opts}
        transparent={dimmed || !!opts.transparent}
        opacity={dimmed ? 0.3 : (opts.opacity ?? 1)}
        depthWrite={!dimmed && opts.depthWrite !== false}
      />
    </mesh>
  );
});

/** Click to select, hold & drag to move (Clash of Clans style). */
function Hit({ id, pos, size, onSelect, onDragStart }: { id: string; pos: V3; size: V3; onSelect: (id: string) => void; onDragStart: (id: string) => void }) {
  return (
    <mesh
      name={`hit-${id}`}
      position={pos}
      onPointerDown={(e) => { e.stopPropagation(); onDragStart(id); }}
      onClick={(e) => { e.stopPropagation(); onSelect(id); }}
      onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = "grab"; }}
      onPointerOut={() => { document.body.style.cursor = "auto"; }}
    >
      <boxGeometry args={size} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  );
}

const C = {
  floor: "#d2a469", joint: "#b4844f", tvUnit: "#33415c", tv: "#0d1526",
  fridge: "#f7fbff", washer: "#f2f8ff", oven: "#64718a", vacuum: "#ffc94d", pink: "#ff7fa8",
};
const METAL = { roughness: 0.35, metalness: 0.6 };

export interface SceneProps {
  onSelect: (id: string) => void;
  ownedIds: Set<string>;
  positions: Layout;
  onDragStart: (id: string) => void;
  moveMode: string | null;
  levels: Record<string, number>;
}

const LABEL_Y: Record<string, number> = {
  tv: 3.2, vacuum: 2.6, oven: 2.6, microwave: 2.2,
  fridge: 4.0, washer: 2.5, dishwasher: 2.5, iron: 1.7, hairdryer: 1.8,
};

/** Scale a single appliance around its own spot; lift + pulse a ring while moving it. */
function Place({ id, pos, active, level, children }: { id: string; pos: Pos; active: boolean; level: number; children: React.ReactNode }) {
  const s = ITEM_SPECS[id].scale;
  const ref = useRef<Group>(null);
  const orb = useRef<Mesh>(null);
  const mat = useRef<MeshBasicMaterial>(null);
  const lift = useRef(0);
  const r = Math.max(ITEM_SPECS[id].w, ITEM_SPECS[id].d) / 2;
  const name = APPLIANCES.find((a) => a.id === id)?.name || id;
  useFrame((state) => {
    lift.current += ((active ? 0.45 : 0) - lift.current) * 0.18;
    if (ref.current) ref.current.position.y = lift.current;
    if (mat.current) mat.current.opacity = active ? 0.3 + 0.22 * Math.sin(state.clock.elapsedTime * 4) : 0;
    if (orb.current) {
      orb.current.rotation.y += 0.03;
      orb.current.position.y = LABEL_Y[id] - 0.45 + Math.sin(state.clock.elapsedTime * 2) * 0.08;
    }
  });
  return (
    <group>
      <mesh position={[pos.x, 0.04, pos.z]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[r, r + 0.14, 32]} />
        <meshBasicMaterial ref={mat} color="#22d3ee" transparent opacity={0} depthWrite={false} side={2} />
      </mesh>
      {/* level 2+: glowing base ring; level 3: floating golden orb */}
      {level >= 2 && (
        <mesh position={[pos.x, 0.06, pos.z]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[r - 0.12, r - 0.02, 32]} />
          <meshBasicMaterial color={level >= 3 ? "#fbbf24" : "#22d3ee"} transparent opacity={0.65} side={2} />
        </mesh>
      )}
      {level >= 3 && (
        <mesh ref={orb} position={[pos.x, LABEL_Y[id] - 0.45, pos.z]}>
          <sphereGeometry args={[0.16, 10, 8]} />
          <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.9} />
        </mesh>
      )}
      {level > 0 && (
        <Html position={[pos.x, LABEL_Y[id], pos.z]} center distanceFactor={20} zIndexRange={[8, 0]} style={{ pointerEvents: "none" }}>
          <div className="house-label">
            <span className="house-label-name">{name}</span>
            <span className="house-label-level">Lv {level}</span>
          </div>
        </Html>
      )}
      <group ref={ref} position={[pos.x * (1 - s), 0, pos.z * (1 - s)]} scale={s}>{children}</group>
    </group>
  );
}

export default function HouseScene({ onSelect, ownedIds, positions, onDragStart, moveMode, levels }: SceneProps) {
  const owns = (id: string) => ownedIds.has(id);
  const lv = (id: string) => levels[id] || 0;
  const p = (id: string) => positions[id] || { x: ITEM_SPECS[id].x, z: ITEM_SPECS[id].z };
  const common = (id: string) => ({
    dimmed: !owns(id),
    onSelect,
    onDragStart: (itemId: string) => { if (moveMode === itemId) onDragStart(itemId); },
    x: p(id).x,
    z: p(id).z,
  });

  return (
    <group name="House" dispose={null}>
      <B pos={[8, -0.35, 6]} size={[16, 0.7, 12]} color={C.floor} opts={{ roughness: 0.9 }} receiveShadow />
      {[1, 2, 3, 4, 5].map((i) => (
        <group key={i}>
          <B pos={[i * 2.6, 0.02, 6]} size={[0.04, 0.02, 11.6]} color={C.joint} castShadow={false} />
          <B pos={[8, 0.02, i * 1.9]} size={[15.6, 0.02, 0.04]} color={C.joint} castShadow={false} />
        </group>
      ))}

      <Place id="tv" pos={p("tv")} active={moveMode === "tv"} level={lv("tv")}><Television {...common("tv")} /></Place>
      <Place id="vacuum" pos={p("vacuum")} active={moveMode === "vacuum"} level={lv("vacuum")}><Vacuum {...common("vacuum")} /></Place>
      <Place id="oven" pos={p("oven")} active={moveMode === "oven"} level={lv("oven")}><Oven {...common("oven")} /></Place>
      <Place id="microwave" pos={p("microwave")} active={moveMode === "microwave"} level={lv("microwave")}><Microwave {...common("microwave")} /></Place>
      <Place id="fridge" pos={p("fridge")} active={moveMode === "fridge"} level={lv("fridge")}><Fridge {...common("fridge")} /></Place>
      <Place id="washer" pos={p("washer")} active={moveMode === "washer"} level={lv("washer")}><Washer {...common("washer")} /></Place>
      <Place id="dishwasher" pos={p("dishwasher")} active={moveMode === "dishwasher"} level={lv("dishwasher")}><Dishwasher {...common("dishwasher")} /></Place>
      <Place id="iron" pos={p("iron")} active={moveMode === "iron"} level={lv("iron")}><Iron {...common("iron")} /></Place>
      <Place id="hairdryer" pos={p("hairdryer")} active={moveMode === "hairdryer"} level={lv("hairdryer")}><Hairdryer {...common("hairdryer")} /></Place>

      <ambientLight color="#fff4e2" intensity={0.9} />
      <directionalLight position={[11, 14, 7.5]} color="#fff6e6" intensity={1.35} castShadow />
      <directionalLight position={[3, 12, 11]} color="#dce9ff" intensity={0.55} castShadow={false} />
    </group>
  );
}

type ItemProps = { dimmed: boolean; onSelect: (id: string) => void; onDragStart: (id: string) => void; x: number; z: number };

/* ---------------- TV ---------------- */
function Television({ x, z, dimmed, onSelect, onDragStart }: ItemProps) {
  const mat = useRef<MeshStandardMaterial>(null);
  const light = useRef<PointLight>(null);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (mat.current) {
      mat.current.emissive.setHSL((t * 0.07) % 1, 0.72, 0.45);
      mat.current.emissiveIntensity = 0.55 + 0.15 * Math.sin(t * 3);
    }
    if (light.current) {
      light.current.intensity = (0.7 + 0.3 * Math.sin(t * 2.2)) * (dimmed ? 0.25 : 1);
      light.current.color.setHSL((t * 0.07) % 1, 0.72, 0.6);
    }
  });
  return (
    <group>
      <B pos={[x, 0.48, z]} size={[2.8, 0.85, 0.85]} color={C.tvUnit} dimmed={dimmed} />
      <B pos={[x, 0.93, z]} size={[2.9, 0.06, 0.95]} color="#5b6578" dimmed={dimmed} castShadow={false} />
      <B pos={[x - 0.7, 0.5, z - 0.43]} size={[1.1, 0.5, 0.02]} color="#2b3341" dimmed={dimmed} castShadow={false} />
      <B pos={[x + 0.7, 0.5, z - 0.43]} size={[1.1, 0.5, 0.02]} color="#2b3341" dimmed={dimmed} castShadow={false} />
      <B pos={[x, 1.02, z]} size={[0.9, 0.06, 0.35]} color="#1b2130" dimmed={dimmed} castShadow={false} />
      <B pos={[x, 1.25, z]} size={[0.1, 0.45, 0.1]} color="#1b2130" dimmed={dimmed} castShadow={false} />
      <B pos={[x, 1.85, z]} size={[2.4, 1.4, 0.1]} color={C.tv} opts={{ roughness: 0.2, metalness: 0.4 }} dimmed={dimmed} castShadow={false} />
      <B pos={[x - 1.16, 1.85, z - 0.07]} size={[0.06, 0.9, 0.02]} color="#2dd4bf" opts={{ emissive: new Color("#2dd4bf"), emissiveIntensity: 0.45 }} dimmed={dimmed} castShadow={false} />
      <B pos={[x + 1.16, 1.85, z - 0.07]} size={[0.06, 0.9, 0.02]} color="#2dd4bf" opts={{ emissive: new Color("#2dd4bf"), emissiveIntensity: 0.45 }} dimmed={dimmed} castShadow={false} />
      <B pos={[x, 1.12, z - 0.08]} size={[2, 0.04, 0.02]} color="#22d3ee" opts={{ emissive: new Color("#22d3ee"), emissiveIntensity: 0.5 }} dimmed={dimmed} castShadow={false} />
      <mesh position={[x, 1.86, z - 0.06]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[2.2, 1.2]} />
        <meshStandardMaterial ref={mat} color="#0b1420" emissive="#22d3ee" emissiveIntensity={0.6} transparent={dimmed} opacity={dimmed ? 0.3 : 1} />
      </mesh>
      <pointLight ref={light} position={[x, 1.85, z - 0.4]} color="#22d3ee" intensity={0.7} distance={4} decay={1.6} castShadow={false} />
      <Hit id="tv" pos={[x, 1.6, z]} size={[3, 2.5, 1.4]} onSelect={onSelect} onDragStart={onDragStart} />
    </group>
  );
}

/* ---------------- Fridge ---------------- */
function Fridge({ x, z, dimmed, onSelect, onDragStart }: ItemProps) {
  return (
    <group>
      <B pos={[x, 1.2, z]} size={[1.25, 2.4, 0.85]} color={C.fridge} opts={{ roughness: 0.3, metalness: 0.25 }} dimmed={dimmed} />
      <B pos={[x, 1.75, z - 0.44]} size={[1.15, 1.3, 0.04]} color="#e8f1fa" dimmed={dimmed} castShadow={false} />
      <B pos={[x, 0.65, z - 0.44]} size={[1.15, 1.0, 0.04]} color="#e8f1fa" dimmed={dimmed} castShadow={false} />
      <B pos={[x, 1.05, z - 0.47]} size={[1.15, 0.03, 0.03]} color="#aebfcf" dimmed={dimmed} castShadow={false} />
      <B pos={[x, 1.12, z - 0.48]} size={[0.9, 0.04, 0.02]} color="#38bdf8" opts={{ emissive: new Color("#38bdf8"), emissiveIntensity: 0.45 }} dimmed={dimmed} castShadow={false} />
      <B pos={[x + 0.35, 1.85, z - 0.48]} size={[0.06, 0.7, 0.06]} color="#8d99a8" opts={METAL} dimmed={dimmed} castShadow={false} />
      <B pos={[x + 0.35, 0.65, z - 0.48]} size={[0.06, 0.55, 0.06]} color="#8d99a8" opts={METAL} dimmed={dimmed} castShadow={false} />
      <B pos={[x - 0.3, 1.95, z - 0.48]} size={[0.12, 0.12, 0.02]} color="#f5c451" dimmed={dimmed} castShadow={false} />
      <Hit id="fridge" pos={[x, 1.2, z]} size={[1.9, 2.7, 1.3]} onSelect={onSelect} onDragStart={onDragStart} />
    </group>
  );
}

/* ---------------- Oven ---------------- */
function Oven({ x, z, dimmed, onSelect, onDragStart }: ItemProps) {
  return (
    <group>
      <B pos={[x, 0.66, z]} size={[1.2, 1.32, 0.7]} color={C.oven} opts={METAL} dimmed={dimmed} />
      <B pos={[x, 0.66, z - 0.37]} size={[1.0, 1.1, 0.04]} color="#2d3642" dimmed={dimmed} castShadow={false} />
      <B pos={[x, 0.72, z - 0.4]} size={[0.72, 0.45, 0.02]} color="#ff9a3d" opts={{ emissive: new Color("#ff9a3d"), emissiveIntensity: 0.6 }} dimmed={dimmed} castShadow={false} />
      <B pos={[x, 1.1, z - 0.43]} size={[0.85, 0.06, 0.08]} color="#c9d3df" opts={METAL} dimmed={dimmed} castShadow={false} />
      <B pos={[x - 0.25, 1.26, z - 0.4]} size={[0.1, 0.1, 0.05]} color="#dbe3ec" dimmed={dimmed} castShadow={false} />
      <B pos={[x + 0.25, 1.26, z - 0.4]} size={[0.1, 0.1, 0.05]} color="#dbe3ec" dimmed={dimmed} castShadow={false} />
      <Hit id="oven" pos={[x, 0.7, z]} size={[1.6, 1.6, 1.1]} onSelect={onSelect} onDragStart={onDragStart} />
    </group>
  );
}

/* ---------------- Microwave ---------------- */
function Microwave({ x, z, dimmed, onSelect, onDragStart }: ItemProps) {
  return (
    <group>
      <B pos={[x, 0.4, z]} size={[1.2, 0.8, 0.9]} color="#2f3744" dimmed={dimmed} castShadow={false} />
      <B pos={[x, 0.45, z - 0.47]} size={[1.25, 0.7, 0.9]} color="#39414e" dimmed={dimmed} castShadow={false} />
      <B pos={[x - 0.12, 0.45, z - 0.92]} size={[0.78, 0.5, 0.03]} color="#151c26" dimmed={dimmed} castShadow={false} />
      <B pos={[x - 0.12, 0.45, z - 0.94]} size={[0.6, 0.36, 0.02]} color="#1b3f52" opts={{ emissive: new Color("#22d3ee"), emissiveIntensity: 0.25 }} dimmed={dimmed} castShadow={false} />
      <B pos={[x + 0.48, 0.45, z - 0.93]} size={[0.28, 0.45, 0.03]} color="#253040" dimmed={dimmed} castShadow={false} />
      <B pos={[x + 0.48, 0.57, z - 0.95]} size={[0.16, 0.05, 0.02]} color="#67e8f9" dimmed={dimmed} castShadow={false} />
      <Hit id="microwave" pos={[x, 0.5, z]} size={[1.7, 1.1, 1.5]} onSelect={onSelect} onDragStart={onDragStart} />
    </group>
  );
}

/* ---------------- Washing machine ---------------- */
function Washer({ x, z, dimmed, onSelect, onDragStart }: ItemProps) {
  const drum = useRef<Mesh>(null);
  useFrame(() => {
    if (drum.current) { drum.current.rotation.z += 0.11; drum.current.updateMatrixWorld(); }
  });
  return (
    <group>
      <B pos={[x, 0.6, z]} size={[2.1, 1.2, 0.6]} color={C.washer} opts={{ roughness: 0.4, metalness: 0.2 }} dimmed={dimmed} />
      <B pos={[x, 1.04, z - 0.32]} size={[1.9, 0.25, 0.03]} color="#c5d4e1" dimmed={dimmed} castShadow={false} />
      <B pos={[x + 0.6, 1.04, z - 0.35]} size={[0.18, 0.18, 0.04]} color="#8d99a8" opts={METAL} dimmed={dimmed} castShadow={false} />
      <B pos={[x + 0.1, 1.04, z - 0.35]} size={[0.06, 0.06, 0.03]} color="#22d3ee" opts={{ emissive: new Color("#22d3ee"), emissiveIntensity: 0.6 }} dimmed={dimmed} castShadow={false} />
      <B pos={[x + 0.3, 1.04, z - 0.35]} size={[0.07, 0.07, 0.03]} color="#f472b6" opts={{ emissive: new Color("#f472b6"), emissiveIntensity: 0.5 }} dimmed={dimmed} castShadow={false} />
      <B pos={[x + 0.42, 1.04, z - 0.35]} size={[0.07, 0.07, 0.03]} color="#a3e635" opts={{ emissive: new Color("#a3e635"), emissiveIntensity: 0.5 }} dimmed={dimmed} castShadow={false} />
      <B pos={[x, 0.62, z]} size={[0.72, 0.1, 0.62]} color="#cbd5e1" opts={METAL} dimmed={dimmed} castShadow={false} />
      <mesh position={[x, 0.6, z - 0.33]}>
        <torusGeometry args={[0.38, 0.06, 8, 24]} />
        <meshStandardMaterial color="#dbe6f0" transparent={dimmed} opacity={dimmed ? 0.3 : 1} />
      </mesh>
      <mesh position={[x, 0.6, z - 0.34]}>
        <circleGeometry args={[0.35, 24]} />
        <meshStandardMaterial color="#4a6b86" roughness={0.1} metalness={0.5} side={2} transparent={dimmed} opacity={dimmed ? 0.3 : 1} />
      </mesh>
      <mesh ref={drum} position={[x, 0.6, z - 0.3]}>
        <cylinderGeometry args={[0.26, 0.26, 0.08, 16]} />
        <meshStandardMaterial color="#334155" emissive="#3b82f6" emissiveIntensity={0.2} transparent={dimmed} opacity={dimmed ? 0.3 : 1} />
      </mesh>
      <B pos={[x, 1.22, z]} size={[2.1, 0.06, 0.6]} color="#ffffff" dimmed={dimmed} castShadow={false} />
      <Hit id="washer" pos={[x, 0.65, z]} size={[2.4, 1.5, 1.0]} onSelect={onSelect} onDragStart={onDragStart} />
    </group>
  );
}

/* ---------------- Dishwasher ---------------- */
function Dishwasher({ x, z, dimmed, onSelect, onDragStart }: ItemProps) {
  return (
    <group>
      <B pos={[x, 0.6, z]} size={[1.1, 1.2, 0.5]} color={C.fridge} opts={{ roughness: 0.4, metalness: 0.2 }} dimmed={dimmed} />
      <B pos={[x, 0.6, z - 0.26]} size={[0.95, 0.9, 0.03]} color="#dbe6f0" dimmed={dimmed} castShadow={false} />
      <B pos={[x, 0.95, z - 0.29]} size={[0.8, 0.05, 0.05]} color="#8d99a8" opts={METAL} dimmed={dimmed} castShadow={false} />
      <B pos={[x, 1.24, z]} size={[1.1, 0.06, 0.5]} color="#ffffff" dimmed={dimmed} castShadow={false} />
      <Hit id="dishwasher" pos={[x, 0.65, z]} size={[1.5, 1.5, 1.0]} onSelect={onSelect} onDragStart={onDragStart} />
    </group>
  );
}

/* ---------------- Iron ---------------- */
function Iron({ x, z, dimmed, onSelect, onDragStart }: ItemProps) {
  return (
    <group>
      <B pos={[x, 0.06, z]} size={[0.9, 0.12, 0.5]} color="#c9d3df" opts={METAL} dimmed={dimmed} castShadow={false} />
      <B pos={[x - 0.16, 0.15, z]} size={[0.24, 0.07, 0.3]} color="#dbe6f0" dimmed={dimmed} castShadow={false} />
      <B pos={[x - 0.16, 0.2, z]} size={[0.2, 0.03, 0.22]} color="#22d3ee" opts={{ emissive: new Color("#22d3ee"), emissiveIntensity: 0.5 }} dimmed={dimmed} castShadow={false} />
      <B pos={[x + 0.1, 0.24, z]} size={[0.45, 0.16, 0.28]} color="#5b8fc4" opts={{ roughness: 0.3, metalness: 0.5 }} dimmed={dimmed} castShadow={false} />
      <Hit id="iron" pos={[x, 0.18, z]} size={[1.2, 0.6, 0.9]} onSelect={onSelect} onDragStart={onDragStart} />
    </group>
  );
}

/* ---------------- Vacuum ---------------- */
function Vacuum({ x, z, dimmed, onSelect, onDragStart }: ItemProps) {
  return (
    <group>
      <B pos={[x, 0.45, z]} size={[0.65, 0.5, 0.55]} color={C.vacuum} dimmed={dimmed} />
      <B pos={[x, 0.75, z]} size={[0.4, 0.12, 0.4]} color="#b8862f" dimmed={dimmed} castShadow={false} />
      <B pos={[x - 0.25, 0.18, z - 0.2]} size={[0.14, 0.25, 0.14]} color="#333a45" dimmed={dimmed} castShadow={false} />
      <B pos={[x + 0.25, 0.18, z - 0.2]} size={[0.14, 0.25, 0.14]} color="#333a45" dimmed={dimmed} castShadow={false} />
      <B pos={[x + 0.35, 0.7, z + 0.15]} size={[0.08, 0.65, 0.08]} color="#7a5a2a" dimmed={dimmed} castShadow={false} />
      <B pos={[x + 0.25, 0.15, z + 0.45]} size={[0.55, 0.1, 0.3]} color="#334155" dimmed={dimmed} castShadow={false} />
      <Hit id="vacuum" pos={[x + 0.1, 0.5, z + 0.15]} size={[1.3, 1.3, 1.2]} onSelect={onSelect} onDragStart={onDragStart} />
    </group>
  );
}

/* ---------------- Hairdryer ---------------- */
function Hairdryer({ x, z, dimmed, onSelect, onDragStart }: ItemProps) {
  return (
    <group>
      <B pos={[x, 0.2, z]} size={[0.55, 0.3, 0.3]} color={C.pink} dimmed={dimmed} castShadow={false} />
      <B pos={[x - 0.32, 0.2, z]} size={[0.16, 0.22, 0.22]} color="#7f3f52" dimmed={dimmed} castShadow={false} />
      <B pos={[x - 0.41, 0.2, z]} size={[0.03, 0.18, 0.18]} color="#ffd1e0" opts={{ emissive: new Color("#ff7fa8"), emissiveIntensity: 0.6 }} dimmed={dimmed} castShadow={false} />
      <B pos={[x + 0.15, 0.36, z]} size={[0.15, 0.42, 0.18]} color={C.pink} dimmed={dimmed} castShadow={false} />
      <Hit id="hairdryer" pos={[x, 0.25, z]} size={[1.0, 0.9, 0.9]} onSelect={onSelect} onDragStart={onDragStart} />
    </group>
  );
}
