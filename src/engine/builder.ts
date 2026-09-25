// ============================================================================
// Parametrik modül üreticisi
// Bir modül şablonu + ölçüler + atölye kuralları → parça listesi, donanım, 3D kutular
//
// Koordinat sistemi (modül yerel, mm):
//   x: soldan sağa (0 … W)
//   y: yerden yukarı (0 … H)   – ayak yüksekliği dahil
//   z: duvardan öne (0 … D)    – kapaklar z = D'nin önünde durur
// ============================================================================
import { HW } from '../data/hw';
import type {
  Box3,
  BuiltModule,
  Column,
  DoorMech,
  Edges,
  Front,
  HardwareLine,
  Material,
  MaterialChoice,
  MaterialSlot,
  ModuleTemplate,
  Part,
  PartRole,
  PlacedModule,
  Settings,
  SizeSpec,
  Visual,
  Zone,
} from './types';

export interface BuildContext {
  u: Settings['uretim'];
  secim: MaterialChoice;
  mat: (id: string | undefined) => Material | undefined;
}

type Uretim = Settings['uretim'];

const r1 = (n: number) => Math.round(n * 10) / 10;

/** Menteşe sayısı – kapak yüksekliğine göre (sektör standardı) */
export function menteseSayisi(kapakBoy: number): number {
  if (kapakBoy <= 900) return 2;
  if (kapakBoy <= 1400) return 3;
  if (kapakBoy <= 1900) return 4;
  if (kapakBoy <= 2300) return 5;
  return 6;
}

/** Birleşim başına vida: her 150 mm'ye bir vida, en az 2 */
export function birlesimVida(derinlik: number): number {
  return Math.max(2, Math.ceil(derinlik / 150) + 1);
}

/** Ray boyu: iç derinliğe sığan en uzun standart ray (250…550) */
export function rayBoyu(icDerinlik: number, arkaBosluk: number): number {
  const kullan = icDerinlik - arkaBosluk;
  let best = 250;
  for (let l = 250; l <= 550; l += 50) if (l <= kullan) best = l;
  return best;
}

export type RayTip = 'teleskopik' | 'gizli' | 'metal';
export function rayTipi(rayId: string): RayTip {
  if (/gizli|movento/.test(rayId)) return 'gizli';
  if (/metal-kutu|tandembox|alfa/.test(rayId)) return 'metal';
  return 'teleskopik';
}

/**
 * Ailedeki ölçü ekli ürünlerden hedefe uyanı seçer. Örn. 'ray-teleskopik-frenli-45' ailesinde
 * hedef 50 cm → 'ray-teleskopik-frenli-50'. Tam ölçü yoksa hedefin altındaki en büyük ölçü,
 * o da yoksa en küçük ölçü seçilir.
 */
export function aileUrun(onEk: string, hedefCm: number, mat: (id: string) => Material | undefined, adaylar: number[] = OLCULER): string | undefined {
  const var_ = adaylar.filter((c) => mat(`${onEk}-${c}`));
  if (!var_.length) return undefined;
  const alt = var_.filter((c) => c <= hedefCm);
  const c = alt.length ? Math.max(...alt) : Math.min(...var_);
  return `${onEk}-${c}`;
}
const OLCULER = [15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 70, 80, 90, 100, 120];

/** Seçilen ray ürününün, hesaplanan boydaki karşılığı (ray-teleskopik-frenli-45 → -50) */
export function rayUrunId(rayId: string, boyMm: number, mat?: (id: string) => Material | undefined): string {
  const m = /^(.*)-(\d+)$/.exec(rayId);
  if (!m) return rayId;
  const cm = Math.round(boyMm / 10);
  if (!mat) return `${m[1]}-${cm}`;
  return aileUrun(m[1], cm, mat) ?? rayId;
}

/** SizeSpec listesini verilen toplam uzunluğa dağıtır */
export function dagit(specs: (SizeSpec | undefined)[], toplam: number): number[] {
  const sabit = specs.reduce((s, x) => s + (x?.mm ?? 0), 0);
  const paySum = specs.reduce((s, x) => s + (x?.mm !== undefined ? 0 : x?.pay ?? 1), 0);
  const kalan = Math.max(0, toplam - sabit);
  const out = specs.map((x) => (x?.mm !== undefined ? x.mm : paySum > 0 ? (kalan * (x?.pay ?? 1)) / paySum : 0));
  // Sabitlerin toplamı alanı aşıyorsa oransal küçült
  if (sabit > toplam && sabit > 0) {
    const k = toplam / sabit;
    return out.map((v, i) => (specs[i]?.mm !== undefined ? v * k : 0));
  }
  return out;
}

// ---------------------------------------------------------------------------

class Kurucu {
  parts: Part[] = [];
  hw = new Map<string, { adet: number; not?: string }>();
  visuals: Visual[] = [];
  uyarilar: string[] = [];
  kapakSayisi = 0;
  cekmeceSayisi = 0;

  constructor(
    public ctx: BuildContext,
    public kapakMalzemeId: string,
  ) {}

  get u(): Uretim {
    return this.ctx.u;
  }

  th(slot: MaterialSlot): number {
    const s = this.ctx.secim;
    const id =
      slot === 'kapak'
        ? this.kapakMalzemeId
        : slot === 'govde'
          ? s.govde
          : slot === 'arkalik'
            ? s.arkalik
            : slot === 'cekmeceGovde'
              ? s.cekmeceGovde
              : slot === 'cekmeceTaban'
                ? s.cekmeceTaban
                : slot === 'cam'
                  ? s.cam
                  : slot === 'ayna'
                    ? s.ayna
                    : slot === 'tezgah'
                      ? s.tezgah
                      : undefined;
    const m = this.ctx.mat(id);
    if (m?.kalinlik) return m.kalinlik;
    return slot === 'arkalik' ? 8 : slot === 'cam' || slot === 'ayna' ? 4 : 18;
  }

  get bantG(): string {
    return this.ctx.secim.govdeBant;
  }
  get bantK(): string | undefined {
    const m = this.ctx.mat(this.kapakMalzemeId);
    if (m?.temin === 'hazir') return undefined; // hazır kapak – bant üreticide
    return m?.bantId ?? this.ctx.secim.kapakBant;
  }

  add(
    ad: string,
    rol: PartRole,
    slot: MaterialSlot,
    boy: number,
    en: number,
    kutu: Box3 | Box3[],
    kenar: Edges = {},
    opt: { damar?: boolean; not?: string; malzemeId?: string; kalinlik?: number } = {},
  ) {
    const kutular = Array.isArray(kutu) ? kutu : [kutu];
    if (boy <= 0 || en <= 0) {
      this.uyarilar.push(`${ad}: ölçü sıfır veya negatif çıktı (${r1(boy)}×${r1(en)}) – modül ölçülerini kontrol edin.`);
      return;
    }
    this.parts.push({
      ad,
      rol,
      slot,
      malzemeId: opt.malzemeId ?? (slot === 'kapak' || rol === 'cekmeceOn' ? this.kapakMalzemeId : undefined),
      boy: r1(boy),
      en: r1(en),
      kalinlik: opt.kalinlik ?? this.th(slot),
      adet: kutular.length,
      kenar,
      damar: opt.damar ?? true,
      kutular,
      not: opt.not,
    });
  }

  donanim(id: string | undefined, adet: number, not?: string) {
    if (!id || adet <= 0) return;
    const e = this.hw.get(id);
    if (e) e.adet += adet;
    else this.hw.set(id, { adet, not });
  }

  vis(v: Visual) {
    this.visuals.push(v);
  }
}

interface Ic {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  z0: number;
  z1: number;
}

// ---------------------------------------------------------------------------

export function buildModule(tpl: ModuleTemplate, pm: PlacedModule, ctx: BuildContext): BuiltModule {
  const W = pm.w;
  const H = pm.h;
  const D = pm.d;
  const k = new Kurucu(ctx, pm.kapakMalzemeId ?? ctx.secim.kapak);

  if (W < tpl.w.min - 0.5 || W > tpl.w.max + 0.5)
    k.uyarilar.push(`Genişlik ${Math.round(W)} mm, bu modül için önerilen aralık ${tpl.w.min}–${tpl.w.max} mm.`);
  if (H < tpl.h.min || H > tpl.h.max)
    k.uyarilar.push(`Yükseklik ${H} mm, önerilen aralık ${tpl.h.min}–${tpl.h.max} mm.`);

  if (tpl.ozel === 'bosluk') {
    // Boşluk: parça üretmez (pencere, aspiratör, bulaşık makinesi boşluğu vb.)
  } else if (tpl.ozel === 'cihazKapak') {
    // Entegre cihaz kapağı (ankastre bulaşık makinesi): sadece cephe paneli
    const L = tpl.govde.ayak ? ctx.u.ayakYukseklik : 0;
    const kb = ctx.u.kapakKenarBosluk;
    const kh = H - L - 2 * kb;
    k.add('Cihaz kapağı (entegre)', 'kapak', 'kapak', kh, W - 2 * kb, { x: kb, y: L + kb, z: D, w: W - 2 * kb, h: kh, d: k.th('kapak') }, kapakKenar(k), {
      not: 'Cihaz kapağına montaj aparatı ile takılır – cihaz kataloğundaki kapak ölçüsünü kontrol edin',
    });
    k.kapakSayisi++;
    kulpEkle(k, W, W / 2, L + kh - 40, D + k.th('kapak'), 'yatay');
    k.donanim(HW.vidaMentese, 6);
    k.vis({ tip: 'cihaz', kutu: { x: 5, y: L, z: 20, w: W - 10, h: kh, d: D - 30 }, etiket: 'Bulaşık makinesi' });
  } else if (tpl.ozel === 'dolgu') buildDolgu(k, tpl, W, H, D);
  else if (tpl.ozel === 'yanPanel') buildYanPanel(k, tpl, W, H, D);
  else buildGovdeli(k, tpl, pm, W, H, D);

  const hardware: HardwareLine[] = [...k.hw.entries()].map(([malzemeId, v]) => ({
    malzemeId,
    adet: Math.round(v.adet * 1000) / 1000,
    not: v.not,
  }));
  if (tpl.ekDonanim)
    for (const e of tpl.ekDonanim) {
      const id = e.id.endsWith('*') ? aileUrun(e.id.slice(0, -2), Math.floor((W - 36) / 10), (x) => ctx.mat(x)) : e.id;
      if (id) hardware.push({ malzemeId: id, adet: e.adet });
    }

  return {
    uid: pm.uid,
    templateId: tpl.id,
    ad: tpl.ad,
    w: W,
    h: H,
    d: D,
    parts: k.parts,
    hardware,
    visuals: k.visuals,
    uyarilar: k.uyarilar,
    kapakSayisi: k.kapakSayisi,
    cekmeceSayisi: k.cekmeceSayisi,
  };
}

// ---------------------------------------------------------------------------
// Dolgu paneli ve görünen yan panel
// ---------------------------------------------------------------------------

function buildDolgu(k: Kurucu, tpl: ModuleTemplate, W: number, H: number, D: number) {
  const L = tpl.govde.ayak ? k.u.ayakYukseklik : 0;
  const Hb = H - L;
  const tk = k.th('kapak');
  const t = k.th('govde');
  k.add('Dolgu paneli (ön)', 'dolgu', 'kapak', Hb - 2 * k.u.kapakKenarBosluk, W, { x: 0, y: L + k.u.kapakKenarBosluk, z: D, w: W, h: Hb - 2 * k.u.kapakKenarBosluk, d: tk }, { b1: k.bantK, b2: k.bantK, e1: k.bantK, e2: k.bantK });
  // Dolgunun arkasına tutturma takozları
  const takozEn = Math.min(80, Math.max(40, W));
  k.add('Dolgu takozu', 'takoz', 'govde', Hb, takozEn, [
    { x: Math.max(0, W / 2 - t / 2), y: L, z: D - takozEn, w: t, h: Hb, d: takozEn },
  ], { b1: undefined });
  k.donanim(HW.vidaGovde, 4);
  if (L > 0) k.donanim(ctxBaza(k), W / 1000);
}

function buildYanPanel(k: Kurucu, tpl: ModuleTemplate, W: number, H: number, D: number) {
  const tk = W; // genişlik = panel kalınlığı
  void tpl;
  k.add('Görünen yan panel', 'gorunenYan', 'kapak', H, D + k.th('kapak'), { x: 0, y: 0, z: 0, w: tk, h: H, d: D + k.th('kapak') }, {
    b1: k.bantK,
    b2: k.bantK,
    e1: k.bantK,
    e2: k.bantK,
  });
  k.donanim(HW.vidaMentese, 6, 'Yan panel içten vidalanır');
}

function ctxBaza(k: Kurucu): string {
  return k.ctx.secim.baza;
}

// ---------------------------------------------------------------------------
// Gövdeli modüller
// ---------------------------------------------------------------------------

function buildGovdeli(k: Kurucu, tpl: ModuleTemplate, pm: PlacedModule, W: number, H: number, D: number) {
  const u = k.u;
  const g = tpl.govde;
  const t = k.th('govde');
  const tb = k.th('arkalik');
  const L = g.ayak ? u.ayakYukseklik : 0;
  const Hb = H - L;
  const y0 = L;
  const altVar = g.alt !== false;
  const arkalik = g.arkalik !== false && !g.evye;
  const cakma = u.arkalikTipi === 'cakma';

  // Gövde derinliği (çakma arkalıkta arkalık kalınlığı düşülür)
  const bz0 = arkalik && cakma ? tb : 0;
  const bD = D - bz0;
  const zArka = arkalik ? (cakma ? tb : u.kanalMesafe + tb) : 0;

  // --- Birleşim kuralları
  //  yanAltaBasar        : alt tabla tam genişlik, yanlar alt tablaya basar, üst tabla yanların üstüne biner
  //  yanAltaBasarUstArada: alt tabla tam genişlik, yanlar alta basar, üst tabla yanların arasında
  //  yanTamBoy           : yanlar yerden tavana, alt ve üst tabla yanların arasında
  const bir = u.govdeBirlesim;
  const ustTabla = g.ust === 'tabla';
  const altTam = altVar && bir !== 'yanTamBoy';
  const ustTam = ustTabla && bir === 'yanAltaBasar';
  const yanY = altTam ? y0 + t : y0;
  const yanH = Hb - (altTam ? t : 0) - (ustTam ? t : 0);
  const altW = altTam ? W : W - 2 * t;
  const altX = altTam ? 0 : t;
  const ustW = ustTam ? W : W - 2 * t;
  const ustX = ustTam ? 0 : t;

  // --- Yanlar
  const yanKenar: Edges = { b1: k.bantG };
  if (ustTabla && !ustTam) yanKenar.e1 = k.bantG; // üst kenar görünür
  if (!altTam && tpl.sira === 'ust') yanKenar.e2 = k.bantG; // üst dolapta alt kenar görünür
  k.add('Yan dikme', 'yan', 'govde', yanH, bD, [
    { x: 0, y: yanY, z: bz0, w: t, h: yanH, d: bD },
    { x: W - t, y: yanY, z: bz0, w: t, h: yanH, d: bD },
  ], yanKenar, { not: arkalik && !cakma ? `Arkalık kanalı: ${u.kanalMesafe} mm içeriden, ${u.kanalDerinlik} mm derin` : undefined });

  // --- Alt tabla
  if (altVar) {
    const altKenar: Edges = { b1: k.bantG };
    if (altW === W) {
      altKenar.e1 = k.bantG;
      altKenar.e2 = k.bantG;
    }
    k.add('Alt tabla', 'alt', 'govde', altW, bD, { x: altX, y: y0, z: bz0, w: altW, h: t, d: bD }, altKenar);
    k.donanim(HW.vidaGovde, 2 * birlesimVida(bD));
  }

  // --- Üst
  const ustY = y0 + Hb - t;
  if (g.ust === 'tabla') {
    const ustKenar: Edges = { b1: k.bantG };
    if (ustW === W) {
      ustKenar.e1 = k.bantG;
      ustKenar.e2 = k.bantG;
    }
    k.add('Üst tabla', 'ust', 'govde', ustW, bD, { x: ustX, y: ustY, z: bz0, w: ustW, h: t, d: bD }, ustKenar);
    k.donanim(HW.vidaGovde, 2 * birlesimVida(bD));
  } else if (g.ust === 'kusak') {
    const kw = W - 2 * t;
    const kg = u.kusakGen;
    if (g.evye) {
      k.add('Ön kuşak', 'kusak', 'govde', kw, kg, { x: t, y: ustY, z: D - kg, w: kw, h: t, d: kg }, { b1: k.bantG });
      // Evye dolabında arka kuşaklar dik durur (arkalık yok)
      k.add('Arka kuşak (dik)', 'kusak', 'govde', kw, kg, [
        { x: t, y: y0 + Hb - kg, z: 0, w: kw, h: kg, d: t },
        { x: t, y: y0 + t, z: 0, w: kw, h: kg, d: t },
      ], { b1: k.bantG }, { not: 'Evye dolabı – arkalık yerine' });
      k.donanim(HW.vidaKusak, 3 * 4);
    } else {
      k.add('Kuşak', 'kusak', 'govde', kw, kg, [
        { x: t, y: ustY, z: D - kg, w: kw, h: t, d: kg },
        { x: t, y: ustY, z: zArka, w: kw, h: t, d: kg },
      ], { b1: k.bantG });
      k.donanim(HW.vidaKusak, 2 * 4);
    }
  }
  if (g.evye) k.donanim(HW.vidaKusak, 4);
  // yanların gövde birleşim vidaları (alt/üst tabla zaten sayıldı)

  // --- Arkalık
  if (arkalik) {
    if (cakma) {
      const aw = W - 2;
      const ah = Hb - 2;
      k.add('Arkalık', 'arkalik', 'arkalik', ah, aw, { x: 1, y: y0 + 1, z: 0, w: aw, h: ah, d: tb }, {}, { damar: false, not: 'Çakma arkalık' });
      k.donanim(HW.vidaArkalik, Math.ceil((2 * (aw + ah)) / 150));
    } else {
      const kd = u.kanalDerinlik;
      const aw = W - 2 * t + 2 * kd - 2;
      const altUst = altVar ? y0 + t : y0;
      const ustSinir = g.ust === 'tabla' ? y0 + Hb - t : y0 + Hb;
      // Kanal payları: altta ve (tam tablada) üstte kanal derinliği eklenir, 1 mm tolerans bırakılır.
      // Kuşaklı / üstsüz gövdede arkalık üst kenarı yan dikme hizasında biter.
      const ah = ustSinir - altUst + (altVar ? kd : 0) + (g.ust === 'tabla' ? kd : 0) - (g.ust === 'tabla' ? 2 : 1);
      k.add('Arkalık', 'arkalik', 'arkalik', ah, aw, {
        x: t - kd + 1,
        y: altUst - (altVar ? kd : 0) + 1,
        z: u.kanalMesafe,
        w: aw,
        h: ah,
        d: tb,
      }, {}, { damar: false, not: `Kanallı arkalık (${kd} mm kanal payı dahil)` });
    }
  }

  // --- Ayak ve baza
  if (g.ayak) {
    const n = W > 1000 ? 6 : 4;
    k.donanim(k.ctx.secim.ayak, n);
    k.donanim(HW.vidaMentese, n * 4);
    if (!g.bazaYok) {
      k.donanim(k.ctx.secim.baza, W / 1000, 'Ön baza');
      k.donanim(HW.bazaKlips, n > 4 ? 3 : 2);
    }
    const ayakR = 18;
    const xs = n === 6 ? [60, W / 2, W - 60] : [60, W - 60];
    for (const x of xs)
      for (const z of [60, D - 70])
        k.vis({ tip: 'ayak', kutu: { x: x - ayakR, y: 0, z: z - ayakR, w: ayakR * 2, h: L, d: ayakR * 2 } });
  }

  // --- Duvara bağlantı
  if (tpl.sira === 'ust') {
    k.donanim(HW.askiAparati, 2);
    k.donanim(HW.dubel, 2);
    k.donanim(HW.vidaDubel, 2);
    k.donanim(HW.vidaMentese, 8);
  } else if (tpl.sira === 'boy' || tpl.kategori === 'gardirop' || (tpl.kategori === 'vestiyer' && H > 1500)) {
    k.donanim(HW.duvarBaglanti, 2, 'Devrilmeye karşı duvara sabitleme');
    k.donanim(HW.dubel, 2);
    k.donanim(HW.vidaDubel, 2);
  } else if (tpl.sira === 'alt') {
    k.donanim(HW.duvarBaglanti, 2);
    k.donanim(HW.dubel, 2);
    k.donanim(HW.vidaDubel, 2);
  }
  if (u.modulBirlestirme && tpl.sira !== 'serbest') k.donanim(HW.modulBirlestirme, 4, 'Yan yana modüller için (yaklaşık)');

  // --- İç hacim
  const ic: Ic = {
    x0: t,
    x1: W - t,
    y0: altVar ? y0 + t : y0,
    y1: g.ust === 'yok' ? y0 + Hb : y0 + Hb - t,
    z0: zArka,
    z1: D,
  };

  if (tpl.ozel === 'surgulu') {
    buildIc(k, tpl, pm, ic, y0, Hb, W, D, true);
    buildSurguluKapaklar(k, tpl, W, y0, Hb, D);
    return;
  }
  if (tpl.ozel === 'kose') {
    buildIc(k, tpl, pm, ic, y0, Hb, W, D, true);
    buildKoseKapak(k, tpl, pm, W, y0, Hb, D);
    return;
  }
  buildIc(k, tpl, pm, ic, y0, Hb, W, D, false);
}

// ---------------------------------------------------------------------------
// İç düzen: sütunlar, bölgeler, cepheler
// ---------------------------------------------------------------------------

interface ColLayout {
  col: Column;
  x0: number; // iç sol
  x1: number; // iç sağ
  fx0: number; // cephe sol sınır (bindirme)
  fx1: number;
  zonesY: { z: Zone; y0: number; y1: number; tablaY?: number }[];
}

function buildIc(k: Kurucu, tpl: ModuleTemplate, pm: PlacedModule, ic: Ic, y0: number, Hb: number, W: number, D: number, cepheYok: boolean) {
  const u = k.u;
  const t = k.th('govde');
  const cols = tpl.columns.length ? tpl.columns : [{ zones: [{ tip: 'bos' as const }] }];
  const n = cols.length;
  const icW = ic.x1 - ic.x0;
  const widths = dagit(cols.map((c) => c.w), icW - (n - 1) * t);
  const icD = ic.z1 - ic.z0;
  const icH = ic.y1 - ic.y0;

  const layouts: ColLayout[] = [];
  let x = ic.x0;
  for (let i = 0; i < n; i++) {
    const cw = widths[i];
    const lay: ColLayout = {
      col: cols[i],
      x0: x,
      x1: x + cw,
      fx0: i === 0 ? 0 : x - t / 2,
      fx1: i === n - 1 ? W : x + cw + t / 2,
      zonesY: [],
    };
    layouts.push(lay);
    x += cw;
    if (i < n - 1) {
      // Ara dikme
      k.add('Ara dikme', 'dikme', 'govde', icH, icD, { x, y: ic.y0, z: ic.z0, w: t, h: icH, d: icD }, { b1: k.bantG });
      k.donanim(HW.vidaGovde, 2 * birlesimVida(icD));
      x += t;
    }
  }

  const cekmeceOverride = pm.cekmeceAdet;
  const rafOverride = pm.rafAdet;

  for (const lay of layouts) {
    const cw = lay.x1 - lay.x0;
    const zones = lay.col.zones;
    const tablaSayisi = zones.filter((z, i) => z.ustTabla && i < zones.length - 1).length;
    const hs = dagit(zones.map((z) => z.h), icH - tablaSayisi * t);
    let y = ic.y0;
    zones.forEach((z, i) => {
      const zy0 = y;
      const zy1 = y + hs[i];
      y = zy1;
      let tablaY: number | undefined;
      if (z.ustTabla && i < zones.length - 1) {
        tablaY = y;
        k.add(z.tip === 'oturak' ? 'Oturak tablası' : 'Sabit raf (ara tabla)', z.tip === 'oturak' ? 'oturak' : 'sabitRaf', 'govde', cw, icD, { x: lay.x0, y, z: ic.z0, w: cw, h: t, d: icD }, { b1: k.bantG });
        k.donanim(HW.vidaGovde, 2 * birlesimVida(icD));
        y += t;
      }
      lay.zonesY.push({ z, y0: zy0, y1: zy1, tablaY });
    });

    // Bölge içerikleri
    for (const zy of lay.zonesY) {
      const zh = zy.y1 - zy.y0;
      const z = zy.z;
      if (z.tip === 'raf' || z.tip === 'ayakkabi') {
        const aralik = z.tip === 'ayakkabi' ? 190 : u.rafAralik;
        let adet = z.adet ?? Math.max(0, Math.round(zh / aralik) - 1);
        if (rafOverride !== undefined && z.tip === 'raf') adet = rafOverride;
        if (adet > 0) {
          const rw = cw - u.rafYanBosluk;
          const rd = icD - u.rafOnGeri;
          const kutular: Box3[] = [];
          for (let r = 1; r <= adet; r++) {
            const ry = zy.y0 + (zh * r) / (adet + 1) - t / 2;
            kutular.push({ x: lay.x0 + u.rafYanBosluk / 2, y: ry, z: ic.z0, w: rw, h: t, d: rd });
          }
          k.add(z.tip === 'ayakkabi' ? 'Ayakkabı rafı' : 'Ayarlı raf', 'raf', 'govde', rw, rd, kutular, { b1: k.bantG });
          k.donanim(HW.rafPimi, adet * 4);
          if (rw > 900) k.uyarilar.push(`Raf açıklığı ${Math.round(rw)} mm – 900 mm üzeri raflarda sehim olur, ara dikme veya 25 mm raf önerilir.`);
        }
      } else if (z.tip === 'aski') {
        const boruL = cw - 4;
        k.donanim(k.ctx.secim.askiBorusu, boruL / 1000, 'Askı borusu');
        k.donanim(HW.boruTasiyici, 2);
        k.donanim(HW.vidaMentese, 4);
        k.vis({ tip: 'boru', kutu: { x: lay.x0 + 2, y: zy.y1 - 70, z: ic.z0 + icD / 2 - 12, w: boruL, h: 15, d: 25 } });
        if (zh < 900) k.uyarilar.push('Askı bölgesi 900 mm’den kısa – kısa askı (ceket/gömlek) için uygundur.');
      } else if (z.tip === 'icCekmece') {
        const adet = cekmeceOverride ?? z.adet ?? 2;
        // Menteşe tarafına takoz (iç çekmece kapak menteşesine çarpmasın)
        const takozEn = 22;
        k.add('İç çekmece takozu', 'takoz', 'govde', zh, 80, [
          { x: lay.x0, y: zy.y0, z: D - 100, w: takozEn, h: zh, d: 80 },
          { x: lay.x1 - takozEn, y: zy.y0, z: D - 100, w: takozEn, h: zh, d: 80 },
        ], {}, { not: 'Menteşe payı için – 2 adet kat edilerek (22 mm) kullanılabilir' });
        const icCw = cw - 2 * takozEn;
        const fh = (zh - (adet + 1) * 10) / adet;
        for (let c = 0; c < adet; c++) {
          const fy = zy.y0 + 10 + c * (fh + 10);
          cekmeceKutusu(k, lay.x0 + takozEn, icCw, fy, fh, ic.z0, icD, true);
        }
      } else if (z.tip === 'oturak') {
        // oturak bölgesinin üstündeki tabla oturaktır; üstüne sünger + kumaş
        const oy = zy.tablaY ?? zy.y1;
        const alan = (cw * icD) / 1e6;
        k.donanim(HW.oturakSunger, 1, `${Math.round(cw)}×${Math.round(icD)} mm, 5 cm`);
        k.donanim(HW.oturakKumas, r1(alan * 1.3 * 100) / 100);
        k.vis({ tip: 'cihaz', kutu: { x: lay.x0, y: oy + t, z: ic.z0, w: cw, h: 50, d: icD }, etiket: 'Puf oturak' });
      } else if (z.tip === 'cihaz') {
        k.vis({ tip: 'cihaz', kutu: { x: lay.x0 + 5, y: zy.y0 + 5, z: ic.z0 + 10, w: cw - 10, h: zh - 10, d: icD - 10 }, etiket: z.cihaz ?? 'Cihaz' });
      }
    }
  }

  if (cepheYok) return;

  // --- Cepheler
  const kenar = u.kapakKenarBosluk;
  const ara = u.kapakAraBosluk;
  for (let ci = 0; ci < layouts.length; ci++) {
    const lay = layouts[ci];
    const ilk = ci === 0;
    const son = ci === layouts.length - 1;
    const fx0 = lay.fx0 + (ilk ? kenar : ara / 2);
    const fx1 = lay.fx1 - (son ? kenar : ara / 2);
    const fronts = cepheleriCoz(k, lay, y0, Hb, pm, tpl);
    for (const f of fronts) {
      yapCephe(k, f.front, fx0, fx1, f.y0, f.y1, lay, D, pm, f.zone, tpl);
    }
  }
}

interface CozulmusCephe {
  front: Front;
  y0: number;
  y1: number;
  zone?: { y0: number; y1: number; z: Zone };
}

/** Cephe listesini y aralıklarına çevirir (kenar/ara boşlukları uygulanmış) */
function cepheleriCoz(k: Kurucu, lay: ColLayout, y0: number, Hb: number, pm: PlacedModule, tpl: ModuleTemplate): CozulmusCephe[] {
  const kenar = k.u.kapakKenarBosluk;
  const ara = k.u.kapakAraBosluk;
  const bottom = y0 + kenar;
  const top = y0 + Hb - kenar;
  const out: CozulmusCephe[] = [];
  void tpl;

  if (lay.col.fronts && lay.col.fronts.length) {
    const fr = lay.col.fronts;
    const hs = dagit(fr.map((f) => f.h), top - bottom - (fr.length - 1) * ara);
    let y = bottom;
    fr.forEach((f, i) => {
      out.push({ front: f, y0: y, y1: y + hs[i], zone: undefined });
      y += hs[i] + ara;
    });
    // çekmece cephelerine denk gelen bölgeyi eşleştir
    for (const o of out) {
      if (o.front.tip === 'cekmece') {
        const zz = lay.zonesY.find((zy) => zy.z.tip === 'cekmece' && zy.y0 < o.y1 && zy.y1 > o.y0);
        if (zz) o.zone = zz;
      }
    }
    return out;
  }

  // Otomatik: bölgelerden cephe üret. Çekmece bölgeleri ayrı, ardışık kapak/açık bölgeleri tek cephe.
  type Grp = { tip: 'cekmece' | 'kapak' | 'acik' | 'panel'; zs: typeof lay.zonesY };
  const groups: Grp[] = [];
  for (const zy of lay.zonesY) {
    const tip: Grp['tip'] = zy.z.cephe ?? (zy.z.tip === 'cekmece' ? 'cekmece' : zy.z.tip === 'cihaz' ? 'acik' : 'kapak');
    const last = groups[groups.length - 1];
    if (last && last.tip === tip && tip !== 'cekmece' && !zy.z.ayri) last.zs.push(zy);
    else groups.push({ tip, zs: [zy] });
  }
  // Sınırlar: gruplar arası sınır = ara tabla ortası veya bölge sınırı
  const t = k.th('govde');
  const bounds: number[] = [y0];
  for (let i = 0; i < groups.length - 1; i++) {
    const lastZ = groups[i].zs[groups[i].zs.length - 1];
    bounds.push(lastZ.tablaY !== undefined ? lastZ.tablaY + t / 2 : lastZ.y1);
  }
  bounds.push(y0 + Hb);
  groups.forEach((gp, i) => {
    const gy0 = bounds[i] + (i === 0 ? kenar : ara / 2);
    const gy1 = bounds[i + 1] - (i === groups.length - 1 ? kenar : ara / 2);
    if (gp.tip === 'acik' || gp.tip === 'panel') {
      out.push({ front: { tip: gp.tip }, y0: gy0, y1: gy1 });
      return;
    }
    if (gp.tip === 'kapak') {
      const ko = gp.zs[0].z.kapak ?? {};
      out.push({ front: { tip: 'kapak', yon: ko.yon ?? pm.yon, adet: ko.adet, mekanizma: ko.mekanizma, gizliAski: ko.gizliAski }, y0: gy0, y1: gy1 });
      return;
    }
    // çekmece grubu: bölgedeki çekmece sayısı kadar cephe
    const zy = gp.zs[0];
    const adet = pm.cekmeceAdet ?? zy.z.adet ?? 3;
    const oranlar = zy.z.oranlar && zy.z.oranlar.length === adet ? zy.z.oranlar : Array(adet).fill(1);
    const hs = dagit(oranlar.map((o) => ({ pay: o })), gy1 - gy0 - (adet - 1) * ara);
    // alttan yukarı: oranlar[0] en alttaki çekmece
    let y = gy0;
    for (let c = 0; c < adet; c++) {
      out.push({ front: { tip: 'cekmece' }, y0: y, y1: y + hs[c], zone: zy });
      y += hs[c] + ara;
    }
  });
  return out;
}

function yapCephe(
  k: Kurucu,
  f: Front,
  fx0: number,
  fx1: number,
  fy0: number,
  fy1: number,
  lay: ColLayout,
  D: number,
  pm: PlacedModule,
  zone: { y0: number; y1: number; z: Zone } | undefined,
  tpl: ModuleTemplate,
) {
  const u = k.u;
  const tk = k.th('kapak');
  const fw = fx1 - fx0;
  const fh = fy1 - fy0;
  if (f.tip === 'acik' || f.tip === 'cihaz') return;
  if (f.tip === 'panel') {
    k.add('Sabit panel (kör kapak)', 'kapak', 'kapak', fh, fw, { x: fx0, y: fy0, z: D, w: fw, h: fh, d: tk }, kapakKenar(k));
    k.donanim(HW.vidaMentese, 4);
    return;
  }
  if (f.tip === 'cekmece') {
    k.add('Çekmece ön (cephe)', 'cekmeceOn', 'kapak', fh, fw, { x: fx0, y: fy0, z: D, w: fw, h: fh, d: tk }, kapakKenar(k));
    kulpEkle(k, fw, fx0 + fw / 2, fy1 - 35, D + tk, 'yatay');
    k.cekmeceSayisi++;
    // Çekmece kutusu
    const colW = lay.x1 - lay.x0;
    const icD = D - (k.u.arkalikTipi === 'cakma' ? k.th('arkalik') : k.u.kanalMesafe + k.th('arkalik'));
    const zb = zone ? Math.max(zone.y0 + 3, fy0 + 10) : fy0 + 10;
    const kutuH = Math.max(70, Math.min(fh - u.cekmeceYukseklikFark, (zone ? zone.y1 : fy1) - zb - 5));
    cekmeceKutusu(k, lay.x0, colW, zb, kutuH, D - icD, icD, false);
    return;
  }
  // Kapak
  const mech: DoorMech = f.mekanizma ?? 'normal';
  // Kapak adedi: tek sütunlu modülde kullanıcı seçimi > şablon > genişliğe göre otomatik
  let adet = tpl.columns.length <= 1 && pm.kapakAdet ? pm.kapakAdet : f.adet ?? (fw > u.kapakMaxGen ? 2 : 1);
  if (mech === 'kalkar' || mech === 'dusen' || mech === 'dikey' || mech === 'katlanir') adet = f.adet ?? 1;
  const ara = u.kapakAraBosluk;
  const kw = (fw - (adet - 1) * ara) / adet;
  if (kw > u.kapakMaxGen + 150 && mech === 'normal')
    k.uyarilar.push(`Kapak genişliği ${Math.round(kw)} mm – geniş kapaklar sarkar, kapak sayısını artırın.`);
  for (let i = 0; i < adet; i++) {
    const kx = fx0 + i * (kw + ara);
    const menteseSol = adet === 1 ? (f.yon ?? pm.yon ?? 'sol') === 'sol' : i < adet / 2;
    tekKapak(k, mech, kx, fy0, kw, fh, D, menteseSol, f.gizliAski === true);
  }
}

function kapakKenar(k: Kurucu): Edges {
  const b = k.bantK;
  return { b1: b, b2: b, e1: b, e2: b };
}

function tekKapak(k: Kurucu, mech: DoorMech, x: number, y: number, w: number, h: number, D: number, menteseSol: boolean, gizliAski: boolean) {
  const tk = k.th('kapak');
  const secim = k.ctx.secim;
  k.kapakSayisi++;
  if (mech === 'cam') {
    // Alüminyum çerçeveli cam kapak: çerçeve profili + cam
    k.donanim(HW.camCerceve, (2 * (w + h)) / 1000, 'Cam kapak çerçevesi');
    k.add('Cam (kapak)', 'cam', 'cam', h - 44, w - 44, { x: x + 22, y: y + 22, z: D + 8, w: w - 44, h: h - 44, d: 4 }, {}, {
      damar: false,
      not: `Çerçeve dış ölçüsü ${r1(h)}×${r1(w)} mm`,
      malzemeId: secim.cam,
    });
    k.vis({ tip: 'etiket', kutu: { x, y, z: D, w, h, d: 20 }, etiket: 'cam-cerceve' });
    k.donanim(HW.menteseCam, menteseSayisi(h));
    k.donanim(HW.vidaMentese, menteseSayisi(h) * 4);
    kulpEkle(k, w, menteseSol ? x + w - 30 : x + 30, y + Math.min(h / 2, 150), D + 20, 'dikey');
    return;
  }
  if (mech === 'katlanir') {
    const h1 = (h - k.u.kapakAraBosluk) / 2;
    k.add('Katlanır kapak (parça)', 'kapak', 'kapak', h1, w, [
      { x, y, z: D, w, h: h1, d: tk },
      { x, y: y + h1 + k.u.kapakAraBosluk, z: D, w, h: h1, d: tk },
    ], kapakKenar(k));
    k.donanim(HW.katlanirMek, 1);
    k.donanim(secim.mentese, 2, 'Katlanır kapak ara menteşesi');
    k.donanim(HW.vidaMentese, 16);
    kulpEkle(k, w, x + w / 2, y + 40, D + tk, 'yatay');
    return;
  }
  if (mech === 'ayna') {
    k.add('Aynalı kapak (taşıyıcı)', 'kapak', 'kapak', h, w, { x, y, z: D, w, h, d: tk }, kapakKenar(k));
    k.add('Ayna (kapak üzeri)', 'cam', 'ayna', h - 60, w - 60, { x: x + 30, y: y + 30, z: D + tk, w: w - 60, h: h - 60, d: 4 }, {}, {
      damar: false,
      malzemeId: secim.ayna,
      not: 'Kapak üzerine yapıştırılır (kenardan 30 mm)',
    });
    k.donanim(HW.aynaYapistirici, 1);
  } else {
    k.add('Kapak', 'kapak', 'kapak', h, w, { x, y, z: D, w, h, d: tk }, kapakKenar(k));
  }

  if (mech === 'kalkar') {
    k.donanim(secim.mentese, 2, 'Kalkar kapak üst menteşe');
    k.donanim(HW.pistonKalkar, 2, 'Amortisörlü piston (çift)');
    k.donanim(HW.vidaMentese, 2 * 4 + 2 * 4);
    kulpEkle(k, w, x + w / 2, y + 40, D + tk, 'yatay');
  } else if (mech === 'dusen') {
    k.donanim(secim.mentese, 2, 'Düşen kapak alt menteşe');
    k.donanim(HW.dusenMakas, 2, 'Düşen kapak makası (çift)');
    k.donanim(HW.vidaMentese, 2 * 4 + 2 * 4);
    kulpEkle(k, w, x + w / 2, y + h - 40, D + tk, 'yatay');
  } else if (mech === 'dikey') {
    k.donanim(HW.dikeyMek, 1, 'Dikey/paralel kalkar mekanizma takımı');
    k.donanim(HW.vidaMentese, 12);
    kulpEkle(k, w, x + w / 2, y + 40, D + tk, 'yatay');
  } else {
    const n = menteseSayisi(h);
    k.donanim(secim.mentese, n);
    k.donanim(HW.vidaMentese, n * 4);
    const kx = menteseSol ? x + w - 35 : x + 35;
    const ustDolap = y > 1200;
    kulpEkle(k, w, kx, ustDolap ? y + 90 : Math.min(y + h - 90, y + h / 2 + (h > 1200 ? 0 : h / 4)), D + tk, 'dikey');
  }
  if (gizliAski) {
    k.donanim(HW.askiKanca, 3, 'Kapak içi gizli askı');
    k.donanim(HW.vidaMentese, 6);
  }
}

function kulpEkle(k: Kurucu, cepheGen: number, cx: number, cy: number, z: number, yon: 'yatay' | 'dikey') {
  const kulp = k.ctx.mat(k.ctx.secim.kulp);
  if (!kulp) return;
  if (kulp.birim === 'mt') {
    // Profil kulp – cephe genişliği kadar
    k.donanim(kulp.id, cepheGen / 1000, 'Profil kulp');
    k.vis({ tip: 'kulp', kutu: { x: cx - cepheGen / 2 + 5, y: cy + 20, z, w: cepheGen - 10, h: 15, d: 15 } });
    return;
  }
  k.donanim(kulp.id, 1);
  if (!/gomme|dugme|push/i.test(kulp.id)) k.donanim(HW.vidaKulp, 2);
  else k.donanim(HW.vidaKulp, 1);
  const m = /(\d{2,4})/.exec(kulp.id);
  const len = m ? Math.min(Number(m[1]) + 20, cepheGen - 40) : 30;
  if (yon === 'yatay') k.vis({ tip: 'kulp', kutu: { x: cx - len / 2, y: cy - 6, z, w: len, h: 12, d: 22 } });
  else k.vis({ tip: 'kulp', kutu: { x: cx - 6, y: cy - len / 2, z, w: 12, h: len, d: 22 } });
}

/**
 * Çekmece kutusu – ray tipine göre
 *  teleskopik / gizli: 2 yan + ön + arka (yanların arasında) + taban
 *  metal kutu: sadece taban + arka (yanlar sistemle gelir)
 */
function cekmeceKutusu(k: Kurucu, x0: number, colW: number, y: number, kutuH: number, zIc: number, icD: number, ic: boolean) {
  const u = k.u;
  const secim = k.ctx.secim;
  const tip = rayTipi(secim.ray);
  const L = rayBoyu(icD, u.cekmeceArkaBosluk);
  const rayId = rayUrunId(secim.ray, L, (x) => k.ctx.mat(x));
  const tc = k.th('cekmeceGovde');
  const tt = k.th('cekmeceTaban');
  const zOn = zIc + icD - L - 2;
  if (ic) k.cekmeceSayisi++;
  k.donanim(rayId, 1, `${L / 10} cm ray`);

  if (tip === 'metal') {
    // Metal kutu sistem (Tandembox / Alfa tipi): taban = iç gen - 75, arka = iç gen - 87
    const tabW = colW - 75;
    const tabL = L - 10;
    const arkaH = kutuH < 110 ? 70 : kutuH < 180 ? 116 : 167;
    k.add('Çekmece tabanı (metal sistem)', 'cekmeceTaban', 'cekmeceGovde', tabW, tabL, { x: x0 + 37.5, y, z: zOn, w: tabW, h: 16, d: tabL }, { b1: k.bantG }, {
      kalinlik: 16,
      not: 'Metal kutu sistem ölçüleri üretici kataloğuna göre kontrol edilmelidir',
    });
    k.add('Çekmece arkası (metal sistem)', 'cekmeceArka', 'cekmeceGovde', colW - 87, arkaH, { x: x0 + 43.5, y: y + 16, z: zOn, w: colW - 87, h: arkaH, d: 16 }, { b1: k.bantG }, { kalinlik: 16 });
    k.donanim(HW.vidaMentese, 16);
    if (ic) {
      k.add('İç çekmece ön', 'cekmeceIcOn', 'cekmeceGovde', colW - 87, kutuH, { x: x0 + 43.5, y, z: zOn + L - 16, w: colW - 87, h: kutuH, d: 16 }, { b1: k.bantG, b2: k.bantG, e1: k.bantG, e2: k.bantG });
      kulpEkle(k, colW, x0 + colW / 2, y + kutuH - 30, zOn + L, 'yatay');
    }
    return;
  }

  const bw = colW - u.rayBosluk[tip];
  const icGen = bw - 2 * tc;
  const kenarUst: Edges = { b1: k.bantG };
  k.add('Çekmece yanı', 'cekmeceYan', 'cekmeceGovde', L, kutuH, [
    { x: x0 + (colW - bw) / 2, y, z: zOn, w: tc, h: kutuH, d: L },
    { x: x0 + (colW + bw) / 2 - tc, y, z: zOn, w: tc, h: kutuH, d: L },
  ], kenarUst);
  const arkaH = u.cekmeceTaban === 'kanal' ? kutuH : kutuH;
  const onArka: Box3[] = [{ x: x0 + (colW - bw) / 2 + tc, y, z: zOn, w: icGen, h: arkaH, d: tc }];
  if (!ic) onArka.push({ x: x0 + (colW - bw) / 2 + tc, y, z: zOn + L - tc, w: icGen, h: kutuH, d: tc });
  k.add(ic ? 'Çekmece arkası' : 'Çekmece iç ön / arka', 'cekmeceArka', 'cekmeceGovde', icGen, kutuH, onArka, kenarUst);
  if (ic) {
    // İç çekmecede ön yüz görünür: gövde malzemesinden, 4 kenar bantlı
    k.add('İç çekmece ön', 'cekmeceIcOn', 'cekmeceGovde', bw, kutuH, { x: x0 + (colW - bw) / 2, y, z: zOn + L, w: bw, h: kutuH, d: tc }, { b1: k.bantG, b2: k.bantG, e1: k.bantG, e2: k.bantG });
    kulpEkle(k, bw, x0 + colW / 2, y + kutuH - 30, zOn + L + tc, 'yatay');
  }
  if (u.cekmeceTaban === 'kanal') {
    const kd = u.kanalDerinlik;
    k.add('Çekmece tabanı', 'cekmeceTaban', 'cekmeceTaban', icGen + 2 * kd - 2, L - 2 * tc + 2 * kd - 2, { x: x0 + (colW - bw) / 2 + tc - kd, y: y + 10, z: zOn + tc - kd, w: icGen + 2 * kd - 2, h: tt, d: L - 2 * tc + 2 * kd - 2 }, {}, { damar: false, not: 'Kanallı taban' });
  } else {
    k.add('Çekmece tabanı', 'cekmeceTaban', 'cekmeceTaban', bw, L, { x: x0 + (colW - bw) / 2, y: y - tt, z: zOn, w: bw, h: tt, d: L }, {}, { damar: false, not: 'Alttan çakma' });
    k.donanim(HW.civiCekmeceTaban, Math.ceil((2 * (bw + L)) / 100));
  }
  k.donanim(HW.vidaCekmece, 8);
  k.donanim(HW.vidaMentese, tip === 'gizli' ? 8 : 12);
  if (!ic) k.donanim(HW.vidaMentese, 4, 'Cephe bağlantısı');
}

// ---------------------------------------------------------------------------
// Sürgülü gardırop kapakları
// ---------------------------------------------------------------------------

function buildSurguluKapaklar(k: Kurucu, tpl: ModuleTemplate, W: number, y0: number, Hb: number, D: number) {
  const adet = tpl.columns.length >= 3 ? 3 : 2;
  const bindirme = 40; // kapaklar arası bindirme
  const rayPay = 55; // üst + alt ray payı
  const kw = (W - 2 * k.u.kapakKenarBosluk + (adet - 1) * bindirme) / adet;
  const kh = Hb - rayPay;
  const tk = k.th('kapak');
  const kutular: Box3[] = [];
  for (let i = 0; i < adet; i++) {
    const x = k.u.kapakKenarBosluk + i * (kw - bindirme);
    kutular.push({ x, y: y0 + 25, z: D + (i % 2 === 0 ? 5 : 35), w: kw, h: kh, d: tk });
  }
  k.add('Sürgü kapak', 'kapak', 'kapak', kh, kw, kutular, kapakKenar(k), { not: `Kapaklar arası ${bindirme} mm bindirme – ray sistemi kataloğuna göre kontrol edin` });
  k.kapakSayisi += adet;
  k.donanim(adet === 3 ? HW.surguRay3 : HW.surguRay2, 1, 'Sürgü ray takımı (üst+alt ray, tekerlek)');
  k.donanim(k.ctx.secim.kulp, adet);
  k.donanim(HW.vidaKulp, adet * 2);
  k.donanim(HW.vidaMentese, 20);
  for (const b of kutular) k.vis({ tip: 'kulp', kutu: { x: b.x + 30, y: y0 + Hb / 2 - 150, z: b.z + tk, w: 12, h: 300, d: 20 } });
}

// ---------------------------------------------------------------------------
// Köşe (kör köşe) dolap: bir tarafta kapak, diğer taraf komşu modülün arkasında
// ---------------------------------------------------------------------------

function buildKoseKapak(k: Kurucu, tpl: ModuleTemplate, pm: PlacedModule, W: number, y0: number, Hb: number, D: number) {
  const kenar = k.u.kapakKenarBosluk;
  const ara = k.u.kapakAraBosluk;
  const korPay = tpl.koseKorPay ?? 650;
  // yon = kapağın bulunduğu taraf; kör kısım köşede (diğer tarafta) kalır
  const yon = pm.yon ?? 'sag';
  const kapakW = W - korPay - kenar - ara / 2;
  if (kapakW < 250) k.uyarilar.push(`Köşe modülü kapağı ${Math.round(kapakW)} mm kaldı – modül genişliğini artırın (kör pay ${korPay} mm).`);
  const kh = Hb - 2 * kenar;
  const tk = k.th('kapak');
  const kx = yon === 'sag' ? W - kenar - kapakW : kenar;
  tekKapak(k, 'normal', kx, y0 + kenar, kapakW, kh, D, yon === 'sol', false);
  // Kör kısım: kapak malzemesinden kör panel (komşu duvardaki modülün arkasında kalır)
  const korW = korPay - ara / 2 - kenar;
  const korX = yon === 'sag' ? kenar : W - kenar - korW;
  k.add('Köşe kör paneli', 'kapak', 'kapak', kh, korW, { x: korX, y: y0 + kenar, z: D, w: korW, h: kh, d: tk }, kapakKenar(k), { not: 'Köşede komşu modülün arkasında kalır' });
  k.donanim(HW.vidaMentese, 6);
}
