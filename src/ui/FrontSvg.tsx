// 2D ön görünüş çizimi (modül ve duvar) – teklif çıktısında ve kütüphanede kullanılır
import type { BuiltModule } from '../engine/types';
import type { ModulYerlesim, TezgahParca } from '../engine/calc';

const CEPHE = new Set(['kapak', 'cekmeceOn', 'dolgu', 'gorunenYan']);

function ModulCizim({ mod, ox, oy, H }: { mod: BuiltModule; ox: number; oy: number; H: number }) {
  // SVG y ekseni aşağı; oy = modülün alt kotu (dünya), H = çizim yüksekliği
  const Y = (y: number, h: number) => H - (oy + y + h);
  const govde = mod.parts.filter((p) => ['yan', 'alt', 'ust', 'kusak', 'dikme', 'sabitRaf', 'raf', 'oturak'].includes(p.rol));
  const on = mod.parts.filter((p) => CEPHE.has(p.rol));
  const cam = mod.parts.filter((p) => p.rol === 'cam');
  const onVar = on.length > 0 || cam.length > 0;
  return (
    <g>
      {/* gövde siluet */}
      {govde.map((p, i) =>
        p.kutular.map((b, j) => (
          <rect key={`g${i}-${j}`} x={ox + b.x} y={Y(b.y, b.h)} width={b.w} height={b.h} className={onVar ? 'svg-govde-arka' : 'svg-govde'} />
        )),
      )}
      {mod.visuals
        .filter((v) => v.tip === 'cihaz' || v.tip === 'boru')
        .map((v, i) => (
          <g key={`c${i}`}>
            <rect x={ox + v.kutu.x} y={Y(v.kutu.y, v.kutu.h)} width={v.kutu.w} height={v.kutu.h} className={v.tip === 'boru' ? 'svg-boru' : 'svg-cihaz'} />
            {v.etiket && v.tip === 'cihaz' && (
              <text x={ox + v.kutu.x + v.kutu.w / 2} y={Y(v.kutu.y, v.kutu.h) + v.kutu.h / 2} className="svg-txt" textAnchor="middle" dominantBaseline="middle">
                {v.etiket}
              </text>
            )}
          </g>
        ))}
      {on.map((p, i) =>
        p.kutular.map((b, j) => <rect key={`k${i}-${j}`} x={ox + b.x} y={Y(b.y, b.h)} width={b.w} height={b.h} className={p.rol === 'cekmeceOn' ? 'svg-cekmece' : p.rol === 'dolgu' ? 'svg-dolgu' : 'svg-kapak'} />),
      )}
      {cam.map((p, i) => p.kutular.map((b, j) => <rect key={`cam${i}-${j}`} x={ox + b.x} y={Y(b.y, b.h)} width={b.w} height={b.h} className={p.slot === 'ayna' ? 'svg-ayna' : 'svg-cam'} />))}
      {mod.visuals
        .filter((v) => v.tip === 'kulp' || v.tip === 'ayak')
        .map((v, i) => (
          <rect key={`h${i}`} x={ox + v.kutu.x} y={Y(v.kutu.y, v.kutu.h)} width={Math.max(v.kutu.w, 8)} height={Math.max(v.kutu.h, 8)} className={v.tip === 'kulp' ? 'svg-kulp' : 'svg-ayak'} />
        ))}
      {!mod.parts.length && <rect x={ox} y={Y(0, Math.max(mod.h, 100))} width={mod.w} height={Math.max(mod.h, 100)} className="svg-bosluk" />}
    </g>
  );
}

export function ModuleFrontSvg({ mod, className }: { mod: BuiltModule; className?: string }) {
  const pad = 30;
  const W = mod.w + pad * 2;
  const H = Math.max(mod.h, 100) + pad * 2;
  return (
    <svg viewBox={`${-pad} ${-pad} ${W} ${H}`} className={className ?? 'front-svg'} preserveAspectRatio="xMidYMid meet">
      <ModulCizim mod={mod} ox={0} oy={0} H={Math.max(mod.h, 100)} />
    </svg>
  );
}

/** Duvar ön görünüşü + ölçü çizgileri */
export function WallElevation({ yerlesimler, tezgahlar, uzunluk, yukseklik, olcu = true }: { yerlesimler: ModulYerlesim[]; tezgahlar: TezgahParca[]; uzunluk: number; yukseklik: number; olcu?: boolean }) {
  const pad = 180;
  const H = yukseklik;
  const alt = yerlesimler.filter((y) => y.lane === 'alt').sort((a, b) => a.x - b.x);
  const ust = yerlesimler.filter((y) => y.lane === 'ust').sort((a, b) => a.x - b.x);
  return (
    <svg viewBox={`${-pad} ${-pad} ${uzunluk + pad * 2} ${H + pad * 2.4}`} className="wall-svg" preserveAspectRatio="xMidYMid meet">
      <rect x={0} y={0} width={uzunluk} height={H} className="svg-duvar" />
      <line x1={-60} y1={H} x2={uzunluk + 60} y2={H} className="svg-zemin" />
      {yerlesimler.map((y) => (
        <ModulCizim key={y.mod.uid} mod={y.mod} ox={y.x} oy={y.y} H={H} />
      ))}
      {tezgahlar.map((t, i) => (
        <rect key={i} x={t.x} y={H - (t.kutu.y + t.kutu.h)} width={t.uzunluk} height={t.kutu.h} className="svg-tezgah" />
      ))}
      {olcu && (
        <>
          {/* toplam */}
          <Olcu x1={0} x2={uzunluk} y={H + 140} txt={`${uzunluk}`} />
          {alt.map((y) => (
            <Olcu key={y.mod.uid} x1={y.x} x2={y.x + y.mod.w} y={H + 60} txt={`${Math.round(y.mod.w)}`} />
          ))}
          {ust.map((y) => (
            <Olcu key={y.mod.uid} x1={y.x} x2={y.x + y.mod.w} y={H - (y.y + y.mod.h) - 50} txt={`${Math.round(y.mod.w)}`} />
          ))}
        </>
      )}
    </svg>
  );
}

function Olcu({ x1, x2, y, txt }: { x1: number; x2: number; y: number; txt: string }) {
  return (
    <g className="svg-olcu">
      <line x1={x1} y1={y} x2={x2} y2={y} />
      <line x1={x1} y1={y - 18} x2={x1} y2={y + 18} />
      <line x1={x2} y1={y - 18} x2={x2} y2={y + 18} />
      <text x={(x1 + x2) / 2} y={y - 12} textAnchor="middle">
        {txt}
      </text>
    </g>
  );
}
