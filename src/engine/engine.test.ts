import { describe, expect, it } from 'vitest';
import { MATERIALS } from '../data/materials';
import { TEMPLATES, TEMPLATE_MAP } from '../data/templates';
import { VARSAYILAN_AYARLAR, VARSAYILAN_MALZEME, VARSAYILAN_FIYAT } from '../data/defaults';
import { HW } from '../data/hw';
import { buildModule, menteseSayisi, rayBoyu, type BuildContext } from './builder';
import { gardiropBol, sigdir, fitWall } from './layout';
import { hesapla } from './calc';
import { nest } from './nesting';
import type { PlacedModule, Project, Settings } from './types';

const matMap = new Map(MATERIALS.map((m) => [m.id, m]));
const ctx = (u: Partial<Settings['uretim']> = {}): BuildContext => ({
  u: { ...VARSAYILAN_AYARLAR.uretim, ...u },
  secim: VARSAYILAN_MALZEME,
  mat: (id) => (id ? matMap.get(id) : undefined),
});
const pm = (templateId: string, w: number, h?: number, d?: number, extra: Partial<PlacedModule> = {}): PlacedModule => {
  const t = TEMPLATE_MAP.get(templateId)!;
  return { uid: 'm1', templateId, w, h: h ?? t.h.def, d: d ?? t.d.def, ...extra };
};
const part = (m: ReturnType<typeof buildModule>, ad: string) => m.parts.find((p) => p.ad === ad);

describe('veri bütünlüğü', () => {
  it('varsayılan malzemeler ve motor donanımları kütüphanede var', () => {
    for (const id of Object.values(VARSAYILAN_MALZEME)) expect(matMap.has(id), id).toBe(true);
    for (const id of Object.values(HW)) expect(matMap.has(id), id).toBe(true);
  });
  it('şablon id’leri benzersiz ve ek donanımlar çözülebiliyor', () => {
    const ids = new Set<string>();
    for (const t of TEMPLATES) {
      expect(ids.has(t.id), t.id).toBe(false);
      ids.add(t.id);
      for (const e of t.ekDonanim ?? []) {
        if (e.id.endsWith('*')) expect(MATERIALS.some((m) => m.id.startsWith(e.id.slice(0, -1))), e.id).toBe(true);
        else expect(matMap.has(e.id), e.id).toBe(true);
      }
    }
  });
  it('bütün şablonlar varsayılan ölçüde uyarısız / hatasız üretilir', () => {
    for (const t of TEMPLATES) {
      const m = buildModule(t, pm(t.id, t.w.def), ctx());
      const hatalar = m.uyarilar.filter((u) => u.includes('negatif'));
      expect(hatalar, t.id).toEqual([]);
      for (const p of m.parts) {
        expect(p.boy, `${t.id} ${p.ad}`).toBeGreaterThan(0);
        expect(p.en, `${t.id} ${p.ad}`).toBeGreaterThan(0);
      }
    }
  });
});

describe('gövde kesim ölçüleri', () => {
  it('tek kapaklı alt dolap – yanlar alta basar, kanallı arkalık', () => {
    const m = buildModule(TEMPLATE_MAP.get('alt-tek-kapak')!, pm('alt-tek-kapak', 450, 820, 560), ctx());
    expect(part(m, 'Alt tabla')).toMatchObject({ boy: 450, en: 560, adet: 1 });
    expect(part(m, 'Yan dikme')).toMatchObject({ boy: 702, en: 560, adet: 2 });
    expect(part(m, 'Kuşak')).toMatchObject({ boy: 414, en: 100, adet: 2 });
    // arkalık: 450 - 2×18 + 2×8 - 2 = 428 ; 720 - 18 + 8 - 1 = 709
    expect(part(m, 'Arkalık')).toMatchObject({ boy: 709, en: 428, kalinlik: 8 });
    // raf: 414 - 2 = 412 ; derinlik 560 - 15 - 8 - 20 = 517
    expect(part(m, 'Ayarlı raf')).toMatchObject({ boy: 412, en: 517, adet: 1 });
    // kapak: 450 - 3 = 447 ; 720 - 3 = 717
    expect(part(m, 'Kapak')).toMatchObject({ boy: 717, en: 447, adet: 1 });
    expect(m.hardware.find((h) => h.malzemeId === VARSAYILAN_MALZEME.mentese)?.adet).toBe(2);
    expect(m.hardware.find((h) => h.malzemeId === VARSAYILAN_MALZEME.ayak)?.adet).toBe(4);
  });

  it('çakma arkalık ve yanlar tam boy', () => {
    const m = buildModule(TEMPLATE_MAP.get('ust-tek-kapak')!, pm('ust-tek-kapak', 400, 720, 320), ctx({ govdeBirlesim: 'yanTamBoy', arkalikTipi: 'cakma' }));
    const tb = matMap.get(VARSAYILAN_MALZEME.arkalik)!.kalinlik!;
    expect(part(m, 'Yan dikme')).toMatchObject({ boy: 720, en: 320 - tb });
    expect(part(m, 'Alt tabla')).toMatchObject({ boy: 364 });
    expect(part(m, 'Üst tabla')).toMatchObject({ boy: 364 });
    expect(part(m, 'Arkalık')).toMatchObject({ boy: 718, en: 398 });
  });

  it('çift kapak: iki kapak arası 3 mm, kenarlar 1,5 mm', () => {
    const m = buildModule(TEMPLATE_MAP.get('alt-cift-kapak')!, pm('alt-cift-kapak', 800), ctx());
    // (800 - 3 - 3) / 2 = 397
    const kapaklar = m.parts.filter((p) => p.ad === 'Kapak');
    expect(kapaklar.reduce((s, p) => s + p.adet, 0)).toBe(2);
    expect(kapaklar.every((k) => k.en === 397 && k.boy === 717)).toBe(true);
    expect(m.kapakSayisi).toBe(2);
  });

  it('3 çekmeceli: cephe ve teleskopik ray kutusu', () => {
    const m = buildModule(TEMPLATE_MAP.get('alt-3-cekmece')!, pm('alt-3-cekmece', 600), ctx());
    const on = part(m, 'Çekmece ön (cephe)')!;
    expect(m.cekmeceSayisi).toBe(3);
    const toplamOn = m.parts.filter((p) => p.ad === 'Çekmece ön (cephe)').reduce((s, p) => s + p.adet, 0);
    expect(toplamOn).toBe(3);
    expect(on.en).toBe(597);
    // kutu dış genişlik = 564 - 26 = 538, ray boyu 500
    const yan = part(m, 'Çekmece yanı')!;
    expect(yan.boy).toBe(500);
    const taban = part(m, 'Çekmece tabanı')!;
    expect(taban).toMatchObject({ boy: 538, en: 500 });
    expect(m.hardware.some((h) => h.malzemeId === 'ray-teleskopik-frenli-50')).toBe(true);
  });

  it('menteşe sayısı ve ray boyu kuralları', () => {
    expect(menteseSayisi(700)).toBe(2);
    expect(menteseSayisi(1200)).toBe(3);
    expect(menteseSayisi(1800)).toBe(4);
    expect(menteseSayisi(2250)).toBe(5);
    expect(rayBoyu(537, 20)).toBe(500);
    expect(rayBoyu(297, 20)).toBe(250);
  });
});

describe('akıllı yerleşim', () => {
  it('esnek modüller kalan alanı paylaşır, sabitler korunur', () => {
    const r = sigdir(
      [
        { w: 600, min: 600, max: 600, esnek: false },
        { w: 450, min: 250, max: 600, esnek: true },
        { w: 800, min: 600, max: 1200, esnek: true },
      ],
      2000,
    );
    expect(r.w[0]).toBe(600);
    expect(r.w.reduce((a, b) => a + b, 0)).toBe(2000);
    expect(r.fark).toBe(0);
  });
  it('260 cm gardırop 6 kapak → 3 × 2 kapaklı, veya 6 × tek', () => {
    let n = 0;
    const uid = () => `u${n++}`;
    const ikili = gardiropBol({ genislik: 2600, yukseklik: 2400, derinlik: 580, kapakSayisi: 6, duzen: 'ikili', ikiliTemplate: 'gard-iki-aski', tekliTemplate: 'gard-tek-raf' }, uid);
    expect(ikili).toHaveLength(3);
    expect(ikili.reduce((s, m) => s + m.w, 0)).toBe(2600);
    const tekli = gardiropBol({ genislik: 2600, yukseklik: 2400, derinlik: 580, kapakSayisi: 6, duzen: 'tekli', ikiliTemplate: 'gard-iki-aski', tekliTemplate: 'gard-tek-raf' }, uid);
    expect(tekli).toHaveLength(6);
    expect(tekli.reduce((s, m) => s + m.w, 0)).toBe(2600);
  });
  it('boy dolap üst sırayı böler', () => {
    const fit = fitWall(
      {
        id: 'w',
        ad: 'D',
        uzunluk: 3000,
        yukseklik: 2600,
        alt: [pm('boy-kiler', 600, undefined, undefined, { uid: 'k', kilitli: true }), pm('alt-cift-kapak', 800, undefined, undefined, { uid: 'a' }), pm('alt-3-cekmece', 600, undefined, undefined, { uid: 'b' }), pm('alt-cift-kapak', 800, undefined, undefined, { uid: 'c' })],
        ust: [pm('ust-cift-kapak', 800, undefined, undefined, { uid: 'u' }), pm('ust-cift-kapak', 800, undefined, undefined, { uid: 'v' })],
      },
      TEMPLATE_MAP,
      1460,
    );
    expect(fit.alt[0].w).toBe(600);
    expect(fit.alt.slice(1).reduce((s, p) => s + p.w, 0)).toBe(2400);
    expect(fit.uyarilar).toEqual([]);
    // kiler başta olduğundan yer tutucu başa gelir, üst dolaplar 600'den sonra başlar
    expect(fit.ust[0].x).toBe(600);
    expect(fit.ust[0].w + fit.ust[1].w).toBe(2400);
  });
});

describe('plaka optimizasyonu', () => {
  it('parçalar plakaya sığar ve üst üste binmez', () => {
    const parts = Array.from({ length: 30 }, (_, i) => ({ id: `${i}`, boy: 702, en: 560, damar: false, etiket: `${i}` }));
    const r = nest(parts, 3660, 1830, 4, 10);
    expect(r.sigmayan).toHaveLength(0);
    for (const s of r.sheets) {
      for (const a of s.yerlesim) {
        expect(a.x + a.l).toBeLessThanOrEqual(3660 - 10 + 0.01);
        expect(a.y + a.w).toBeLessThanOrEqual(1830 - 10 + 0.01);
        for (const b of s.yerlesim) {
          if (a === b) continue;
          const ayri = a.x + a.l + 4 <= b.x + 0.01 || b.x + b.l + 4 <= a.x + 0.01 || a.y + a.w + 4 <= b.y + 0.01 || b.y + b.w + 4 <= a.y + 0.01;
          expect(ayri).toBe(true);
        }
      }
    }
    // 30 parça × 0,393 m² = 11,8 m²; plaka 6,7 m² → en az 2 plaka
    expect(r.sheets.length).toBeGreaterThanOrEqual(2);
    expect(r.sheets.length).toBeLessThanOrEqual(3);
  });
  it('damarlı parça döndürülmez', () => {
    const r = nest([{ id: 'a', boy: 1500, en: 400, damar: true, etiket: 'a' }], 2800, 2100, 4, 10);
    expect(r.sheets[0].yerlesim[0].dondu).toBe(false);
  });
});

describe('proje hesabı', () => {
  it('örnek mutfak – fiyat ve listeler', () => {
    const p: Project = {
      id: 'p',
      no: 'T-1',
      ad: 'Test mutfak',
      tarih: '2026-01-01',
      durum: 'taslak',
      malzeme: VARSAYILAN_MALZEME,
      fiyat: VARSAYILAN_FIYAT,
      guncelleme: '',
      duvarlar: [
        {
          id: 'w1',
          ad: 'Duvar 1',
          uzunluk: 3200,
          yukseklik: 2600,
          tezgah: true,
          alt: [pm('alt-evye', 900, undefined, undefined, { uid: 'e' }), pm('alt-bulasik-boslugu', 600, undefined, undefined, { uid: 'b' }), pm('alt-3-cekmece', 600, undefined, undefined, { uid: 'c' }), pm('alt-ankastre-firin', 600, undefined, undefined, { uid: 'f' }), pm('alt-tek-kapak', 450, undefined, undefined, { uid: 't' })],
          ust: [pm('ust-cift-kapak', 900, undefined, undefined, { uid: 'u1' }), pm('ust-aspirator', 600, undefined, undefined, { uid: 'u2' }), pm('ust-tek-kapak', 450, undefined, undefined, { uid: 'u3' }), pm('ust-camli-cift', 800, undefined, undefined, { uid: 'u4' })],
        },
      ],
    };
    const h = hesapla(p, VARSAYILAN_AYARLAR, MATERIALS, TEMPLATES);
    expect(h.eksikMalzemeler).toEqual([]);
    expect(h.duvarUyarilari[0].uyarilar).toEqual([]);
    expect(h.plakalar.length).toBeGreaterThan(0);
    expect(h.tezgahlar[0].uzunluk).toBe(3200);
    expect(h.fiyat.genelToplam).toBeGreaterThan(h.fiyat.malzemeToplam);
    const toplamW = h.yerlesimler.filter((y) => y.lane === 'alt').reduce((s, y) => s + y.mod.w, 0);
    expect(toplamW).toBe(3200);
  });
});

describe('hazır dizilimler', () => {
  it('mutfak önerisi farklı duvar ölçülerinde boşluk/taşma bırakmaz', async () => {
    const { mutfakOner, gardiropOner } = await import('../data/presets');
    for (const L of [1200, 1800, 2400, 2600, 3000, 3200, 3600, 4200, 5000]) {
      const o = mutfakOner(L);
      const fit = fitWall({ id: 'w', ad: 'D', uzunluk: L, yukseklik: 2600, ...o }, TEMPLATE_MAP, 1460);
      expect(fit.uyarilar, `L=${L}`).toEqual([]);
    }
    for (const [L, k] of [[1800, 4], [2600, 6], [3100, 7]] as const) {
      const o = gardiropOner(L, 2600, k, 'ikili', false);
      const fit = fitWall({ id: 'w', ad: 'D', uzunluk: L, yukseklik: 2600, ...o }, TEMPLATE_MAP, 1460);
      expect(fit.uyarilar, `gardırop L=${L}`).toEqual([]);
    }
  });
});
