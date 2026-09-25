// ============================================================================
// Proje hesabı: modüller → kesim listesi, plaka optimizasyonu, bant, hırdavat,
// hazır kapak ve cam siparişi, maliyet ve teklif fiyatı
// ============================================================================
import { HW } from '../data/hw';
import { buildModule, type BuildContext } from './builder';
import { fitWall, YER_TUTUCU, type Placement } from './layout';
import { nest, type NestResult } from './nesting';
import type { Box3, BuiltModule, Edges, Material, MaterialChoice, MaterialSlot, ModuleTemplate, Project, Settings } from './types';

export interface ModulYerlesim {
  mod: BuiltModule;
  wallId: string;
  wallIndex: number;
  lane: 'alt' | 'ust';
  x: number;
  y: number;
  etiket: string; // örn. "D1-A3"
}

export interface KesimSatiri {
  no: number;
  malzemeId: string;
  ad: string;
  moduller: string;
  boy: number; // net (bantlı) ölçü
  en: number;
  kesimBoy: number; // bant düşülmüş kesim ölçüsü
  kesimEn: number;
  kalinlik: number;
  adet: number;
  damar: boolean;
  kenar: Edges;
  not?: string;
}

export interface PlakaOzet {
  malzeme: Material;
  satirlar: KesimSatiri[];
  nest: NestResult;
  plakaSayisi: number;
  parcaAlan: number; // m²
  tutar: number;
}

export interface SiparisSatiri {
  malzeme: Material;
  satirlar: KesimSatiri[];
  alan: number; // m²
  tutar: number;
}

export interface BantOzet {
  malzeme: Material;
  metre: number;
  tutar: number;
}

export interface DonanimOzet {
  malzeme: Material;
  /** adet / metre / m² – malzeme birimine göre (paketli ürünlerde adet) */
  miktar: number;
  /** Satın alınacak miktar (paket, takım, adet) */
  alim: number;
  alimBirim: string;
  tutar: number;
  notlar: string[];
}

export interface FiyatOzet {
  plaka: number;
  hazirKapak: number;
  cam: number;
  bant: number;
  donanim: number;
  tezgah: number;
  malzemeToplam: number;
  fire: number;
  iscilik: number;
  montaj: number;
  nakliye: number;
  ekler: number;
  araToplam: number;
  kar: number;
  teklifNet: number; // iskonto öncesi
  iskonto: number;
  netFiyat: number; // KDV hariç
  kdv: number;
  genelToplam: number;
  metretul: number; // m
  metretulFiyat: number;
}

export interface TezgahParca {
  wallIndex: number;
  x: number;
  uzunluk: number;
  derinlik: number;
  kutu: Box3;
}

export interface ProjeHesap {
  yerlesimler: ModulYerlesim[];
  duvarUyarilari: { wallId: string; uyarilar: string[] }[];
  modulUyarilari: { etiket: string; uyarilar: string[] }[];
  plakalar: PlakaOzet[];
  hazirKapaklar: SiparisSatiri[];
  camlar: SiparisSatiri[];
  bantlar: BantOzet[];
  donanimlar: DonanimOzet[];
  tezgahlar: TezgahParca[];
  fiyat: FiyatOzet;
  modulSayisi: number;
  kapakSayisi: number;
  cekmeceSayisi: number;
  eksikMalzemeler: string[];
}

export function slotMalzeme(slot: MaterialSlot, s: MaterialChoice): string {
  switch (slot) {
    case 'govde':
      return s.govde;
    case 'arkalik':
      return s.arkalik;
    case 'kapak':
      return s.kapak;
    case 'cekmeceGovde':
      return s.cekmeceGovde;
    case 'cekmeceTaban':
      return s.cekmeceTaban;
    case 'tezgah':
      return s.tezgah;
    case 'cam':
      return s.cam;
    case 'ayna':
      return s.ayna;
    case 'baza':
      return s.baza;
  }
}

const para = (n: number) => Math.round(n * 100) / 100;

export function hesapla(p: Project, settings: Settings, malzemeler: Material[], sablonlar: ModuleTemplate[]): ProjeHesap {
  const u = settings.uretim;
  const matMap = new Map(malzemeler.map((m) => [m.id, m]));
  const tplMap = new Map(sablonlar.map((t) => [t.id, t]));
  const mat = (id: string | undefined) => (id ? matMap.get(id) : undefined);
  const eksik = new Set<string>();
  const ctx: BuildContext = { u, secim: p.malzeme, mat };

  const yerlesimler: ModulYerlesim[] = [];
  const duvarUyarilari: ProjeHesap['duvarUyarilari'] = [];
  const modulUyarilari: ProjeHesap['modulUyarilari'] = [];
  const tezgahlar: TezgahParca[] = [];
  let metretul = 0;

  p.duvarlar.forEach((wall, wi) => {
    const fit = fitWall(wall, tplMap, u.ustDolapAltKot);
    duvarUyarilari.push({ wallId: wall.id, uyarilar: fit.uyarilar });
    metretul += (fit.altUzunluk + fit.ustUzunluk) / 1000;
    const hepsi: Placement[] = [...fit.alt, ...fit.ust];
    let ai = 0;
    let ui = 0;
    for (const pl of hepsi) {
      if (pl.pm.templateId === YER_TUTUCU) continue;
      const etiket = `D${wi + 1}-${pl.lane === 'alt' ? 'A' : 'U'}${pl.lane === 'alt' ? ++ai : ++ui}`;
      const mod = buildModule(pl.tpl, { ...pl.pm, w: pl.w }, ctx);
      yerlesimler.push({ mod, wallId: wall.id, wallIndex: wi, lane: pl.lane, x: pl.x, y: pl.y, etiket });
      if (mod.uyarilar.length) modulUyarilari.push({ etiket: `${etiket} ${mod.ad}`, uyarilar: mod.uyarilar });
    }
    // Tezgah: ardışık mutfak alt modülleri (boy dolap ve boşluk tezgahı böler; bulaşık makinesi boşluğu bölmez)
    if (wall.tezgah) {
      let bas: number | null = null;
      let son = 0;
      const kapat = () => {
        if (bas !== null && son - bas > 0) {
          const uz = son - bas;
          const yuk = Math.max(...fit.alt.filter((a) => a.x >= bas! - 1 && a.x + a.w <= son + 1 && a.tpl.sira === 'alt').map((a) => a.pm.h), 0);
          tezgahlar.push({
            wallIndex: wi,
            x: bas,
            uzunluk: uz,
            derinlik: u.tezgahDerinlik,
            kutu: { x: bas, y: yuk || 880, z: 0, w: uz, h: u.tezgahKalinlik, d: u.tezgahDerinlik },
          });
        }
        bas = null;
      };
      for (const a of fit.alt) {
        const tezgahli = a.tpl.kategori === 'mutfak-alt' || (a.tpl.ozel === 'bosluk' && a.tpl.etiket?.includes('tezgah-alti'));
        if (tezgahli) {
          if (bas === null) bas = a.x;
          son = a.x + a.w;
        } else kapat();
      }
      kapat();
    }
  });

  // --- Parçaları topla
  type Toplu = KesimSatiri & { key: string; modSet: Set<string>; adSet: Set<string>; notSet: Set<string> };
  const topluMap = new Map<string, Toplu>();
  const bantKal = (id?: string) => (id ? mat(id)?.bantKalinlik ?? 0 : 0);
  for (const y of yerlesimler) {
    for (const part of y.mod.parts) {
      const mid = part.malzemeId ?? slotMalzeme(part.slot, p.malzeme);
      if (!mat(mid)) eksik.add(mid || `(${part.slot} seçilmemiş)`);
      const kesimBoy = u.bantDus ? part.boy - bantKal(part.kenar.e1) - bantKal(part.kenar.e2) : part.boy;
      const kesimEn = u.bantDus ? part.en - bantKal(part.kenar.b1) - bantKal(part.kenar.b2) : part.en;
      const key = [mid, part.kalinlik, part.boy, part.en, part.kenar.b1, part.kenar.b2, part.kenar.e1, part.kenar.e2, part.damar, part.rol].join('|');
      const t = topluMap.get(key);
      if (t) {
        t.adet += part.adet;
        t.modSet.add(y.etiket);
        t.adSet.add(part.ad);
        if (part.not) t.notSet.add(part.not);
      } else {
        topluMap.set(key, {
          key,
          no: 0,
          malzemeId: mid,
          ad: part.ad,
          moduller: '',
          boy: part.boy,
          en: part.en,
          kesimBoy: Math.round(kesimBoy * 10) / 10,
          kesimEn: Math.round(kesimEn * 10) / 10,
          kalinlik: part.kalinlik,
          adet: part.adet,
          damar: part.damar,
          kenar: part.kenar,
          not: part.not,
          modSet: new Set([y.etiket]),
          adSet: new Set([part.ad]),
          notSet: new Set(part.not ? [part.not] : []),
        });
      }
    }
  }
  const satirlar: KesimSatiri[] = [...topluMap.values()].map((t) => {
    const { key: _k, modSet, adSet, notSet, ...rest } = t;
    void _k;
    return { ...rest, ad: [...adSet].join(' / '), moduller: [...modSet].join(', '), not: [...notSet].join('; ') || undefined };
  });

  // --- Malzemeye göre ayır
  const plakaGrup = new Map<string, KesimSatiri[]>();
  const hazirGrup = new Map<string, KesimSatiri[]>();
  const camGrup = new Map<string, KesimSatiri[]>();
  for (const s of satirlar) {
    const m = mat(s.malzemeId);
    if (!m) continue;
    const hedef = m.grup === 'cam' ? camGrup : m.birim === 'plaka' && m.temin !== 'hazir' ? plakaGrup : hazirGrup;
    const arr = hedef.get(m.id) ?? [];
    arr.push(s);
    hedef.set(m.id, arr);
  }

  // Sıralı numaralandırma: plaka malzemeleri – büyükten küçüğe
  let no = 1;
  const plakalar: PlakaOzet[] = [];
  const plakaSirali = [...plakaGrup.entries()].sort((a, b) => grupSira(mat(a[0])!) - grupSira(mat(b[0])!));
  for (const [mid, rows] of plakaSirali) {
    const m = mat(mid)!;
    rows.sort((a, b) => b.boy - a.boy || b.en - a.en);
    for (const r of rows) r.no = no++;
    const nestParts = rows.flatMap((r) =>
      Array.from({ length: r.adet }, (_, i) => ({ id: `${r.no}-${i}`, boy: r.kesimBoy, en: r.kesimEn, damar: !!m.damarli && r.damar, etiket: `${r.no}` })),
    );
    const pb = m.plakaBoy ?? 2800;
    const pe = m.plakaEn ?? 2100;
    const n = nest(nestParts, pb, pe, u.testere, u.kenarTiras);
    const alan = rows.reduce((s, r) => s + (r.boy * r.en * r.adet) / 1e6, 0);
    const adet = n.sheets.length + n.sigmayan.length;
    plakalar.push({ malzeme: m, satirlar: rows, nest: n, plakaSayisi: adet, parcaAlan: alan, tutar: para(adet * m.fiyat) });
  }

  const siparis = (g: Map<string, KesimSatiri[]>): SiparisSatiri[] =>
    [...g.entries()].map(([mid, rows]) => {
      const m = mat(mid)!;
      rows.sort((a, b) => b.boy - a.boy || b.en - a.en);
      for (const r of rows) r.no = no++;
      const alan = rows.reduce((s, r) => s + (r.boy * r.en * r.adet) / 1e6, 0);
      const tutar = m.birim === 'm2' ? alan * m.fiyat : m.birim === 'plaka' ? Math.ceil(alan / (((m.plakaBoy ?? 2800) * (m.plakaEn ?? 2100)) / 1e6)) * m.fiyat : alan * m.fiyat;
      return { malzeme: m, satirlar: rows, alan, tutar: para(tutar) };
    });
  const hazirKapaklar = siparis(hazirGrup);
  const camlar = siparis(camGrup);

  // --- Bant
  const bantMap = new Map<string, number>();
  for (const pz of plakalar)
    for (const r of pz.satirlar) {
      const e = r.kenar;
      const ekle = (id: string | undefined, len: number) => {
        if (!id) return;
        bantMap.set(id, (bantMap.get(id) ?? 0) + ((len + u.bantFirePay) * r.adet) / 1000);
      };
      ekle(e.b1, r.boy);
      ekle(e.b2, r.boy);
      ekle(e.e1, r.en);
      ekle(e.e2, r.en);
    }
  const bantlar: BantOzet[] = [];
  for (const [id, metre] of bantMap) {
    const m = mat(id);
    if (!m) {
      eksik.add(id);
      continue;
    }
    const mt = Math.ceil(metre * 10) / 10;
    bantlar.push({ malzeme: m, metre: mt, tutar: para(mt * m.fiyat) });
  }

  // --- Donanım
  const hwMap = new Map<string, { miktar: number; notlar: Set<string> }>();
  const hwEkle = (id: string, miktar: number, not?: string) => {
    if (!id || miktar <= 0) return;
    const e = hwMap.get(id) ?? { miktar: 0, notlar: new Set<string>() };
    e.miktar += miktar;
    if (not) e.notlar.add(not);
    hwMap.set(id, e);
  };
  for (const y of yerlesimler) for (const h of y.mod.hardware) hwEkle(h.malzemeId, h.adet, h.not);

  // Tezgah ve sarf
  let tezgahTutar = 0;
  if (tezgahlar.length) {
    const tm = mat(p.malzeme.tezgah);
    const toplamUz = tezgahlar.reduce((s, t) => s + t.uzunluk, 0);
    if (tm) {
      const miktar = tm.birim === 'm2' ? (toplamUz * u.tezgahDerinlik) / 1e6 : toplamUz / 1000;
      hwEkle(tm.id, miktar, 'Tezgah');
    } else eksik.add(p.malzeme.tezgah || '(tezgah seçilmemiş)');
    hwEkle(HW.tezgahUcKapama, tezgahlar.length * 2);
    if (p.duvarlar.filter((w) => w.tezgah).length > 1) hwEkle(HW.tezgahBirlesim, p.duvarlar.filter((w) => w.tezgah).length - 1, 'Köşe birleşimi');
    hwEkle(HW.supurgelik, toplamUz / 1000);
    hwEkle(HW.silikon, Math.max(1, Math.ceil(toplamUz / 3000)));
  }
  const govdeliModul = yerlesimler.filter((y) => y.mod.parts.length > 2).length;
  if (govdeliModul) hwEkle(HW.tutkal, Math.max(0.5, Math.round(govdeliModul * 0.1 * 10) / 10), 'Kavela / bant rötuşu');

  const donanimlar: DonanimOzet[] = [];
  for (const [id, v] of hwMap) {
    const m = mat(id);
    if (!m) {
      eksik.add(id);
      continue;
    }
    const miktar = Math.round(v.miktar * 1000) / 1000;
    let alim = miktar;
    let alimBirim = birimAd(m.birim);
    let tutar = miktar * m.fiyat;
    if (m.birim === 'paket') {
      const pa = m.paketAdet ?? 100;
      alim = Math.ceil(miktar / pa);
      alimBirim = `paket (${pa}'lü)`;
      tutar = (miktar / pa) * m.fiyat; // teklife kullanılan kadarı yansır
    } else if (m.birim === 'mt' || m.birim === 'm2' || m.birim === 'kg') {
      alim = Math.ceil(miktar * 10) / 10;
      tutar = alim * m.fiyat;
    } else {
      alim = Math.ceil(miktar);
      tutar = alim * m.fiyat;
    }
    if (m.grup === 'tezgah' && (m.birim === 'mt' || m.birim === 'm2')) tezgahTutar += tutar;
    donanimlar.push({ malzeme: m, miktar, alim, alimBirim, tutar: para(tutar), notlar: [...v.notlar] });
  }
  donanimlar.sort((a, b) => grupSira(a.malzeme) - grupSira(b.malzeme) || a.malzeme.ad.localeCompare(b.malzeme.ad, 'tr'));

  // --- Fiyat
  const f = p.fiyat;
  const plaka = plakalar.reduce((s, x) => s + x.tutar, 0);
  const hazirKapak = hazirKapaklar.reduce((s, x) => s + x.tutar, 0);
  const cam = camlar.reduce((s, x) => s + x.tutar, 0);
  const bant = bantlar.reduce((s, x) => s + x.tutar, 0);
  const donanimTop = donanimlar.reduce((s, x) => s + x.tutar, 0) - tezgahTutar;
  const malzemeToplam = plaka + hazirKapak + cam + bant + donanimTop + tezgahTutar;
  const fire = (malzemeToplam * u.plakaFireYuzde) / 100;
  const modulSayisi = yerlesimler.filter((y) => y.mod.parts.length > 0).length;
  const iscilik =
    f.iscilikTipi === 'yuzde' ? ((malzemeToplam + fire) * f.iscilikDeger) / 100 : f.iscilikTipi === 'modul' ? modulSayisi * f.iscilikDeger : metretul * f.iscilikDeger;
  const ekler = f.ekKalemler.reduce((s, e) => s + (Number(e.tutar) || 0), 0);
  const araToplam = malzemeToplam + fire + iscilik + f.montaj + f.nakliye + ekler;
  const kar = (araToplam * f.kar) / 100;
  const teklifNet = araToplam + kar;
  const iskonto = (teklifNet * f.iskonto) / 100;
  let netFiyat = teklifNet - iskonto;
  if (f.elleFiyat && f.elleFiyat > 0) netFiyat = f.elleFiyat;
  const kdv = f.kdvDahil ? (netFiyat * f.kdv) / 100 : 0;
  const genelToplam = netFiyat + kdv;

  return {
    yerlesimler,
    duvarUyarilari,
    modulUyarilari,
    plakalar,
    hazirKapaklar,
    camlar,
    bantlar,
    donanimlar,
    tezgahlar,
    fiyat: {
      plaka: para(plaka),
      hazirKapak: para(hazirKapak),
      cam: para(cam),
      bant: para(bant),
      donanim: para(donanimTop),
      tezgah: para(tezgahTutar),
      malzemeToplam: para(malzemeToplam),
      fire: para(fire),
      iscilik: para(iscilik),
      montaj: para(f.montaj),
      nakliye: para(f.nakliye),
      ekler: para(ekler),
      araToplam: para(araToplam),
      kar: para(kar),
      teklifNet: para(teklifNet),
      iskonto: para(iskonto),
      netFiyat: para(netFiyat),
      kdv: para(kdv),
      genelToplam: para(genelToplam),
      metretul: Math.round(metretul * 100) / 100,
      metretulFiyat: metretul > 0 ? para(netFiyat / metretul) : 0,
    },
    modulSayisi,
    kapakSayisi: yerlesimler.reduce((s, y) => s + y.mod.kapakSayisi, 0),
    cekmeceSayisi: yerlesimler.reduce((s, y) => s + y.mod.cekmeceSayisi, 0),
    eksikMalzemeler: [...eksik],
  };
}

const GRUP_SIRA = ['govde', 'arkalik', 'kapak', 'cam', 'bant', 'mentese', 'ray', 'mekanizma', 'kulp', 'ayak', 'profil', 'aksesuar', 'vida', 'tezgah', 'sarf'];
function grupSira(m: Material) {
  const i = GRUP_SIRA.indexOf(m.grup);
  return i < 0 ? 99 : i;
}

export function birimAd(b: Material['birim']): string {
  return { plaka: 'plaka', m2: 'm²', mt: 'mt', adet: 'adet', paket: 'paket', takim: 'takım', kg: 'kg' }[b];
}
