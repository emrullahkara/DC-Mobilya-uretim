// ============================================================================
// Akıllı yerleşim (ölçüye göre sığdırma)
// Duvar ölçüsü girilir; sabit modüller (ankastre, bulaşık makinesi, kilitli)
// ölçüsünü korur, esnek modüller kalan alanı nominal genişlikleri oranında
// paylaşır. Min/maks sınırı aşan modüller sabitlenip dağıtım tekrarlanır.
// ============================================================================
import type { ModuleTemplate, PlacedModule, Wall } from './types';

export const YER_TUTUCU = 'boy-yer-tutucu';

export interface Placement {
  pm: PlacedModule;
  tpl: ModuleTemplate;
  lane: 'alt' | 'ust';
  x: number;
  y: number;
  w: number;
}

export interface WallFit {
  alt: Placement[];
  ust: Placement[];
  uyarilar: string[];
  /** Alt sıra toplam modül uzunluğu */
  altUzunluk: number;
  ustUzunluk: number;
}

export interface FitItem {
  w: number;
  min: number;
  max: number;
  esnek: boolean;
}

/**
 * Genişlikleri verilen toplam uzunluğa sığdırır. Dönen dizi mm (1 mm'ye yuvarlanmış,
 * yuvarlama farkı son esnek modüle eklenir).
 */
export function sigdir(items: FitItem[], toplam: number): { w: number[]; fark: number } {
  const w = items.map((i) => i.w);
  const esnek = items.map((i) => i.esnek);
  if (!items.length) return { w, fark: toplam };
  for (let iter = 0; iter < 20; iter++) {
    const sabitToplam = w.reduce((s, x, i) => s + (esnek[i] ? 0 : x), 0);
    const nominal = items.reduce((s, it, i) => s + (esnek[i] ? it.w : 0), 0);
    if (nominal <= 0) break;
    const kalan = toplam - sabitToplam;
    let degisti = false;
    for (let i = 0; i < items.length; i++) {
      if (!esnek[i]) continue;
      let v = (kalan * items[i].w) / nominal;
      if (v < items[i].min) {
        v = items[i].min;
        esnek[i] = false;
        degisti = true;
      } else if (v > items[i].max) {
        v = items[i].max;
        esnek[i] = false;
        degisti = true;
      }
      w[i] = v;
    }
    if (!degisti) break;
  }
  // 1 mm'ye yuvarla (0.5 mm hassasiyet atölyede anlamsız); farkı son esnek modüle ver
  const yuv = w.map((x) => Math.round(x));
  const ilkEsnek = items.map((i) => i.esnek);
  const sonEsnek = ilkEsnek.lastIndexOf(true);
  const toplamYuv = yuv.reduce((s, x) => s + x, 0);
  if (sonEsnek >= 0) {
    const f = toplam - toplamYuv;
    const aday = yuv[sonEsnek] + f;
    if (aday >= items[sonEsnek].min && aday <= items[sonEsnek].max) yuv[sonEsnek] = aday;
  }
  const son = yuv.reduce((s, x) => s + x, 0);
  return { w: yuv, fark: toplam - son };
}

/** Üst sıradaki boy dolap yer tutucularını alt sırayla eşitler */
export function normalizeUst(wall: Wall, tpls: Map<string, ModuleTemplate>): PlacedModule[] {
  const boylar = wall.alt.filter((m) => tpls.get(m.templateId)?.sira === 'boy');
  const boyUids = boylar.map((m) => m.uid);
  let ust = wall.ust.filter((m) => m.templateId !== YER_TUTUCU || (m.ref && boyUids.includes(m.ref)));
  for (const b of boylar) {
    if (!ust.some((m) => m.ref === b.uid)) {
      const ph: PlacedModule = { uid: `ph-${b.uid}`, templateId: YER_TUTUCU, w: b.w, h: 0, d: 0, ref: b.uid };
      const altIdx = wall.alt.indexOf(b);
      if (altIdx === 0) ust = [ph, ...ust];
      else ust = [...ust, ph];
    }
  }
  // Yer tutucu sırasını alt sıradaki sıraya göre düzenle
  const idxs = ust.map((m, i) => (m.templateId === YER_TUTUCU ? i : -1)).filter((i) => i >= 0);
  const sirali = idxs.map((i) => ust[i]).sort((a, b) => boyUids.indexOf(a.ref!) - boyUids.indexOf(b.ref!));
  ust = ust.slice();
  idxs.forEach((i, j) => (ust[i] = sirali[j]));
  return ust;
}

export function fitWall(wall: Wall, tpls: Map<string, ModuleTemplate>, ustDolapAltKot: number): WallFit {
  const uyarilar: string[] = [];
  const bas = wall.basBosluk ?? 0;
  const son = wall.sonBosluk ?? 0;
  const altAlan = wall.uzunluk - bas - son;

  // --- Alt sıra
  const altMods = wall.alt.filter((m) => tpls.has(m.templateId));
  const altFit = sigdir(
    altMods.map((m) => {
      const t = tpls.get(m.templateId)!;
      const esnek = t.esnek && !m.kilitli;
      return { w: m.w, min: t.w.min, max: t.w.max, esnek };
    }),
    altAlan,
  );
  const alt: Placement[] = [];
  let x = bas;
  altMods.forEach((m, i) => {
    const tpl = tpls.get(m.templateId)!;
    alt.push({ pm: m, tpl, lane: 'alt', x, y: 0, w: altFit.w[i] });
    x += altFit.w[i];
  });
  if (altMods.length) farkUyari(uyarilar, 'Alt sıra', altFit.fark);
  const altUzunluk = altFit.w.reduce((s, v, i) => s + (tpls.get(altMods[i].templateId)?.ozel === 'bosluk' ? 0 : v), 0);

  // --- Üst sıra: boy dolaplar üst sırayı segmentlere böler
  const ustList = normalizeUst(wall, tpls);
  const boyYerleri = alt.filter((p) => p.tpl.sira === 'boy');
  const ustBas = bas + (wall.ustBasOfset ?? 0);
  const ustSon = wall.uzunluk - son - (wall.ustSonOfset ?? 0);
  const segSinir: [number, number][] = [];
  let s0 = ustBas;
  for (const b of boyYerleri) {
    segSinir.push([s0, Math.max(s0, b.x)]);
    s0 = Math.max(s0, b.x + b.w);
  }
  segSinir.push([s0, Math.max(s0, ustSon)]);

  const segler: PlacedModule[][] = [[]];
  for (const m of ustList) {
    if (m.templateId === YER_TUTUCU) segler.push([]);
    else if (tpls.has(m.templateId)) segler[segler.length - 1].push(m);
  }
  const maxAltH = Math.max(0, ...alt.filter((p) => !p.tpl.kategori.startsWith('mutfak') && p.tpl.ozel !== 'bosluk').map((p) => p.pm.h));
  const ust: Placement[] = [];
  let ustUzunluk = 0;
  segler.forEach((mods, si) => {
    const [a, b] = segSinir[si] ?? [ustBas, ustSon];
    if (!mods.length) return;
    const fit = sigdir(
      mods.map((m) => {
        const t = tpls.get(m.templateId)!;
        return { w: m.w, min: t.w.min, max: t.w.max, esnek: t.esnek && !m.kilitli };
      }),
      b - a,
    );
    farkUyari(uyarilar, segler.length > 1 ? `Üst sıra ${si + 1}. bölüm` : 'Üst sıra', fit.fark);
    let ux = a;
    mods.forEach((m, i) => {
      const tpl = tpls.get(m.templateId)!;
      const y = tpl.kategori.startsWith('mutfak') ? ustDolapAltKot : maxAltH > 0 ? maxAltH : ustDolapAltKot;
      ust.push({ pm: m, tpl, lane: 'ust', x: ux, y, w: fit.w[i] });
      ux += fit.w[i];
      if (tpl.ozel !== 'bosluk') ustUzunluk += fit.w[i];
    });
  });

  // Yükseklik kontrolü
  for (const p of [...alt, ...ust]) {
    if (p.tpl.ozel === 'bosluk') continue;
    if (p.y + p.pm.h > wall.yukseklik)
      uyarilar.push(`${p.tpl.ad}: üst kotu ${p.y + p.pm.h} mm, tavan yüksekliği ${wall.yukseklik} mm – modül tavana sığmıyor.`);
  }
  return { alt, ust, uyarilar, altUzunluk, ustUzunluk };
}

function farkUyari(u: string[], ad: string, fark: number) {
  if (Math.abs(fark) < 1) return;
  if (fark > 0) u.push(`${ad}: ${Math.round(fark)} mm boşluk kaldı – dolgu paneli ekleyin veya bir modülün kilidini açın.`);
  else u.push(`${ad}: modüller duvarı ${Math.round(-fark)} mm aşıyor – modül çıkarın veya genişlikleri küçültün.`);
}

// ---------------------------------------------------------------------------
// Hızlı kurulum sihirbazları
// ---------------------------------------------------------------------------

export interface GardiropSecenek {
  genislik: number;
  yukseklik: number;
  derinlik: number;
  kapakSayisi: number;
  duzen: 'ikili' | 'tekli';
  /** 2 kapaklı modüllerin iç düzeni */
  ikiliTemplate: string;
  tekliTemplate: string;
}

/**
 * Toplam genişliği kapak sayısına böler. Örn. 2600 mm / 6 kapak:
 *  ikili düzen → 3 × 2 kapaklı modül (866,7 mm)
 *  tekli düzen → 6 × tek kapaklı modül (433,3 mm)
 * Tek sayıda kapakta ikili düzen: (n-1)/2 ikili + 1 tekli, kapak genişlikleri eşit kalır.
 */
export function gardiropBol(o: GardiropSecenek, uid: () => string): PlacedModule[] {
  const n = Math.max(1, Math.round(o.kapakSayisi));
  const kapakGen = o.genislik / n;
  const out: PlacedModule[] = [];
  const mk = (tid: string, w: number): PlacedModule => ({ uid: uid(), templateId: tid, w, h: o.yukseklik, d: o.derinlik });
  if (o.duzen === 'tekli' || n === 1) {
    for (let i = 0; i < n; i++) out.push(mk(o.tekliTemplate, kapakGen));
  } else {
    const ikili = Math.floor(n / 2);
    const tekli = n % 2;
    for (let i = 0; i < ikili; i++) out.push(mk(o.ikiliTemplate, kapakGen * 2));
    if (tekli) out.push(mk(o.tekliTemplate, kapakGen));
  }
  // Yuvarlama: toplam genişlik korunur
  const yuv = out.map((m) => Math.floor(m.w));
  const fark = Math.round(o.genislik - yuv.reduce((s, x) => s + x, 0));
  yuv[yuv.length - 1] += fark;
  out.forEach((m, i) => (m.w = yuv[i]));
  return out;
}

/** Genişliğe göre önerilen kapak sayısı (her kapak kapakMaxGen'i geçmesin) */
export function onerilenKapak(genislik: number, kapakMaxGen: number): number {
  return Math.max(1, Math.ceil(genislik / kapakMaxGen));
}
