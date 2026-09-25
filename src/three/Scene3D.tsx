// 3D görünüm – modüller, parçalar gerçek ölçülerinden üretilir (mm → m)
import { Canvas, type ThreeEvent } from '@react-three/fiber';
import { Edges, Html, OrbitControls } from '@react-three/drei';
import { useMemo, useRef, useState, type RefObject } from 'react';
import type { Box3, BuiltModule, Material, MaterialChoice, Part } from '../engine/types';
import type { ModulYerlesim, TezgahParca } from '../engine/calc';
import { slotMalzeme } from '../engine/calc';

const S = 0.001;

export interface SceneOpts {
  kapaklar: 'goster' | 'seffaf' | 'gizle';
  olculer: boolean;
  /** Etiketlerin (Html) bağlanacağı, React'in yönetmediği katman */
  portal?: RefObject<HTMLElement>;
}

function renkBul(p: Part, secim: MaterialChoice, mat: Map<string, Material>): string {
  const id = p.malzemeId ?? slotMalzeme(p.slot, secim);
  const m = mat.get(id);
  if (p.slot === 'cam') return '#bfe3ea';
  if (p.slot === 'ayna') return '#dfe7ec';
  if (m?.renk) return m.renk;
  if (p.slot === 'arkalik' || p.slot === 'cekmeceTaban') return '#d9d4cb';
  return '#e8e2d6';
}

function KutuMesh({ b, color, opacity = 1, edge = '#6b5a48', onClick }: { b: Box3; color: string; opacity?: number; edge?: string; onClick?: (e: ThreeEvent<MouseEvent>) => void }) {
  return (
    <mesh position={[(b.x + b.w / 2) * S, (b.y + b.h / 2) * S, (b.z + b.d / 2) * S]} onClick={onClick} castShadow receiveShadow>
      <boxGeometry args={[Math.max(b.w, 0.5) * S, Math.max(b.h, 0.5) * S, Math.max(b.d, 0.5) * S]} />
      <meshStandardMaterial color={color} transparent={opacity < 1} opacity={opacity} depthWrite={opacity >= 1} roughness={0.7} />
      <Edges color={edge} threshold={20} />
    </mesh>
  );
}

export function ModuleMeshes({ mod, secim, mat, opts, secili, onSelect }: { mod: BuiltModule; secim: MaterialChoice; mat: Map<string, Material>; opts: SceneOpts; secili?: boolean; onSelect?: () => void }) {
  const click = onSelect
    ? (e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        onSelect();
      }
    : undefined;
  return (
    <group>
      {mod.parts.map((p, i) => {
        const cephe = p.rol === 'kapak' || p.rol === 'cekmeceOn' || (p.rol === 'cam' && p.slot !== 'ayna') || p.rol === 'dolgu';
        if (cephe && opts.kapaklar === 'gizle' && p.rol !== 'dolgu') return null;
        const op = cephe && opts.kapaklar === 'seffaf' ? 0.25 : p.slot === 'cam' ? 0.45 : 1;
        const color = renkBul(p, secim, mat);
        return p.kutular.map((b, j) => <KutuMesh key={`${i}-${j}`} b={b} color={color} opacity={op} edge={secili ? '#d9480f' : '#6b5a48'} onClick={click} />);
      })}
      {mod.visuals.map((v, i) => {
        if (v.tip === 'kulp') {
          if (opts.kapaklar === 'gizle') return null;
          return <KutuMesh key={`v${i}`} b={v.kutu} color="#9aa0a6" edge="#555" />;
        }
        if (v.tip === 'ayak') return <KutuMesh key={`v${i}`} b={v.kutu} color="#333" edge="#222" />;
        if (v.tip === 'boru') return <KutuMesh key={`v${i}`} b={v.kutu} color="#c0c4c8" edge="#777" />;
        if (v.tip === 'cihaz')
          return (
            <group key={`v${i}`}>
              <KutuMesh b={v.kutu} color="#b8bcc2" opacity={0.35} edge="#8a8f96" onClick={click} />
              {opts.olculer && v.etiket && (
                <Html portal={opts.portal as RefObject<HTMLElement>} position={[(v.kutu.x + v.kutu.w / 2) * S, (v.kutu.y + v.kutu.h / 2) * S, (v.kutu.z + v.kutu.d) * S]} center zIndexRange={[10, 0]}>
                  <div className="lbl3d cihaz">{v.etiket}</div>
                </Html>
              )}
            </group>
          );
        return null;
      })}
      {/* seçim için görünmez tıklama kutusu (boşluk modüllerinde) */}
      {!mod.parts.length && (
        <mesh position={[(mod.w / 2) * S, (mod.h / 2) * S, (mod.d / 2) * S]} onClick={click}>
          <boxGeometry args={[mod.w * S, Math.max(mod.h, 50) * S, Math.max(mod.d, 50) * S]} />
          <meshBasicMaterial color={secili ? '#d9480f' : '#94a3b8'} transparent opacity={0.12} />
          <Edges color={secili ? '#d9480f' : '#94a3b8'} />
        </mesh>
      )}
    </group>
  );
}

/** Duvar i'nin dünya konumu: her duvar bir öncekinin sonundan sağa 90° döner (L / U mutfak) */
export function duvarDonusum(uzunluklar: number[], i: number): { x: number; z: number; rot: number } {
  const dirs = [
    [1, 0],
    [0, 1],
    [-1, 0],
    [0, -1],
  ];
  let x = 0;
  let z = 0;
  for (let k = 0; k < i; k++) {
    const [dx, dz] = dirs[k % 4];
    x += dx * uzunluklar[k];
    z += dz * uzunluklar[k];
  }
  return { x, z, rot: (-i * Math.PI) / 2 };
}

export function ProjectScene({
  yerlesimler,
  tezgahlar,
  duvarlar,
  aktifDuvar,
  hepsi,
  secim,
  mat,
  opts,
  seciliUid,
  onSelect,
  tezgahRenk,
}: {
  yerlesimler: ModulYerlesim[];
  tezgahlar: TezgahParca[];
  duvarlar: { uzunluk: number; yukseklik: number }[];
  aktifDuvar: number;
  hepsi: boolean;
  secim: MaterialChoice;
  mat: Map<string, Material>;
  opts: SceneOpts;
  seciliUid?: string;
  onSelect?: (uid: string | undefined) => void;
  tezgahRenk: string;
}) {
  const portal = useRef<HTMLDivElement>(null);
  const o: SceneOpts = { ...opts, portal: portal as RefObject<HTMLElement> };
  const gosterilen = duvarlar.map((_, i) => i).filter((i) => hepsi || i === aktifDuvar);
  const uz = duvarlar.map((d) => d.uzunluk);
  const merkez = useMemo(() => {
    if (!hepsi) {
      const d = duvarlar[aktifDuvar];
      return { x: (d?.uzunluk ?? 3000) / 2, z: 600, r: Math.max(d?.uzunluk ?? 3000, d?.yukseklik ?? 2600) };
    }
    let minX = 0,
      maxX = 0,
      minZ = 0,
      maxZ = 0;
    gosterilen.forEach((i) => {
      const t = duvarDonusum(uz, i);
      const [dx, dz] = [
        [1, 0],
        [0, 1],
        [-1, 0],
        [0, -1],
      ][i % 4];
      const ex = t.x + dx * uz[i];
      const ez = t.z + dz * uz[i];
      minX = Math.min(minX, t.x, ex);
      maxX = Math.max(maxX, t.x, ex);
      minZ = Math.min(minZ, t.z, ez);
      maxZ = Math.max(maxZ, t.z, ez);
    });
    return { x: (minX + maxX) / 2, z: (minZ + maxZ) / 2 + 300, r: Math.max(maxX - minX, maxZ - minZ, 2600) };
  }, [hepsi, aktifDuvar, duvarlar]); // eslint-disable-line react-hooks/exhaustive-deps

  const cam: [number, number, number] = [merkez.x * S + merkez.r * S * 0.35, 1.7 + merkez.r * S * 0.25, merkez.z * S + merkez.r * S * 1.25];
  return (
    <div className="scene-wrap">
    <Canvas flat shadows="basic" camera={{ position: cam, fov: 45, near: 0.05, far: 100 }} onPointerMissed={() => onSelect?.(undefined)} dpr={[1, 2]}>
      <color attach="background" args={['#f3efe8']} />
      <hemisphereLight args={['#ffffff', '#d8cfc2', 1.1]} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 6, 5]} intensity={1.2} castShadow shadow-mapSize={[1024, 1024]} />
      <directionalLight position={[-4, 3, -2]} intensity={0.35} />
      <OrbitControls target={[merkez.x * S, 1.0, merkez.z * S - 0.2]} makeDefault enableDamping />
      {/* Zemin */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[merkez.x * S, -0.001, merkez.z * S]} receiveShadow>
        <planeGeometry args={[merkez.r * S * 3, merkez.r * S * 3]} />
        <meshStandardMaterial color="#e3dccf" />
      </mesh>
      {gosterilen.map((wi) => {
        const t = duvarDonusum(uz, wi);
        const d = duvarlar[wi];
        return (
          <group key={wi} position={[t.x * S, 0, t.z * S]} rotation={[0, t.rot, 0]}>
            {/* Duvar */}
            <mesh position={[(d.uzunluk / 2) * S, (d.yukseklik / 2) * S, -0.03]} receiveShadow>
              <boxGeometry args={[d.uzunluk * S, d.yukseklik * S, 0.06]} />
              <meshStandardMaterial color={wi === aktifDuvar ? '#faf7f2' : '#efe9df'} />
            </mesh>
            {o.olculer && (
              <Html portal={o.portal as RefObject<HTMLElement>} position={[(d.uzunluk / 2) * S, d.yukseklik * S + 0.05, 0]} center zIndexRange={[10, 0]}>
                <div className="lbl3d duvar">
                  {d.uzunluk} mm {hepsi ? `(D${wi + 1})` : ''}
                </div>
              </Html>
            )}
            {yerlesimler
              .filter((y) => y.wallIndex === wi)
              .map((y) => (
                <group key={y.mod.uid} position={[y.x * S, y.y * S, 0]}>
                  <ModuleMeshes mod={y.mod} secim={secim} mat={mat} opts={o} secili={seciliUid === y.mod.uid} onSelect={onSelect ? () => onSelect(y.mod.uid) : undefined} />
                  {o.olculer && y.mod.parts.length > 0 && (
                    <Html portal={o.portal as RefObject<HTMLElement>} position={[(y.mod.w / 2) * S, (y.lane === 'alt' ? y.mod.h + 70 : -60) * S, (y.mod.d + 30) * S]} center zIndexRange={[10, 0]}>
                      <div className={`lbl3d${seciliUid === y.mod.uid ? ' sec' : ''}`}>{Math.round(y.mod.w)}</div>
                    </Html>
                  )}
                </group>
              ))}
            {tezgahlar
              .filter((tz) => tz.wallIndex === wi)
              .map((tz, i) => (
                <KutuMesh key={i} b={tz.kutu} color={tezgahRenk} edge="#555" />
              ))}
          </group>
        );
      })}
    </Canvas>
    <div ref={portal} className="overlay3d" />
    </div>
  );
}

export function ModulePreview({ mod, secim, mat }: { mod: BuiltModule; secim: MaterialChoice; mat: Map<string, Material> }) {
  const [kapak, setKapak] = useState<SceneOpts['kapaklar']>('goster');
  const portal = useRef<HTMLDivElement>(null);
  const r = Math.max(mod.w, mod.h, 900);
  return (
    <div className="preview3d">
      <Canvas flat camera={{ position: [(mod.w / 2) * S + r * S * 0.6, (mod.h / 2) * S + r * S * 0.35, r * S * 1.9], fov: 40 }} dpr={[1, 2]}>
        <color attach="background" args={['#f3efe8']} />
        <ambientLight intensity={0.8} />
        <directionalLight position={[2, 4, 3]} intensity={1} />
        <OrbitControls target={[(mod.w / 2) * S, (mod.h / 2) * S, (mod.d / 2) * S]} enableDamping />
        <ModuleMeshes mod={mod} secim={secim} mat={mat} opts={{ kapaklar: kapak, olculer: true, portal: portal as RefObject<HTMLElement> }} />
      </Canvas>
      <div ref={portal} className="overlay3d" />
      <div className="preview-tools">
        <button className={`chip${kapak === 'goster' ? ' on' : ''}`} onClick={() => setKapak('goster')}>
          Kapaklı
        </button>
        <button className={`chip${kapak === 'seffaf' ? ' on' : ''}`} onClick={() => setKapak('seffaf')}>
          Şeffaf
        </button>
        <button className={`chip${kapak === 'gizle' ? ' on' : ''}`} onClick={() => setKapak('gizle')}>
          İç düzen
        </button>
      </div>
    </div>
  );
}
