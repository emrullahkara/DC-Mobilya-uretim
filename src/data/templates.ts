// ============================================================================
// Modül kütüphanesi – parametrik (ölçüye göre şekillenen) mobilya modülleri
// Ölçüler mm. H: ayak dahil toplam yükseklik, D: gövde derinliği (kapak hariç).
// ============================================================================
import type { CarcassSpec, Column, ModuleCategory, ModuleRow, ModuleTemplate, Zone } from '../engine/types';

type T = Omit<ModuleTemplate, 'kategori' | 'sira' | 'govde' | 'esnek' | 'w' | 'h' | 'd'> &
  Partial<Pick<ModuleTemplate, 'esnek' | 'govde'>> & { w: [number, number, number]; h?: [number, number, number]; d?: [number, number, number] };

const dim = (a: [number, number, number]) => ({ def: a[0], min: a[1], max: a[2] });

function grup(kategori: ModuleCategory, sira: ModuleRow, govde: CarcassSpec, h: [number, number, number], d: [number, number, number], list: T[]): ModuleTemplate[] {
  return list.map((t) => ({
    ...t,
    kategori,
    sira,
    esnek: t.esnek ?? true,
    govde: t.govde ?? govde,
    w: dim(t.w),
    h: dim(t.h ?? h),
    d: dim(t.d ?? d),
  }));
}

const col = (...zones: Zone[]): Column => ({ zones });
const colW = (pay: number, ...zones: Zone[]): Column => ({ w: { pay }, zones });
const raf = (adet?: number, extra: Partial<Zone> = {}): Zone => ({ tip: 'raf', adet, ...extra });
const cek = (adet: number, oranlar?: number[], extra: Partial<Zone> = {}): Zone => ({ tip: 'cekmece', adet, oranlar, ...extra });

// Gövde tipleri
const ALT: CarcassSpec = { ust: 'kusak', ayak: true };
const UST: CarcassSpec = { ust: 'tabla' };
const BOY: CarcassSpec = { ust: 'tabla', ayak: true };
const GARD: CarcassSpec = { ust: 'tabla', ayak: true };
const SERBEST: CarcassSpec = { ust: 'tabla', ayak: true, bazaYok: true };
const BAZALI: CarcassSpec = { ust: 'tabla', ayak: true };

// ---------------------------------------------------------------------------
// MUTFAK – ALT DOLAPLAR (H: 820 = 720 gövde + 100 ayak, D: 560)
// ---------------------------------------------------------------------------
const mutfakAlt = grup('mutfak-alt', 'alt', ALT, [820, 700, 950], [560, 450, 650], [
  { id: 'alt-tek-kapak', ad: 'Alt Dolap – Tek Kapaklı', w: [450, 250, 600], columns: [col(raf(1))], etiket: ['kapaklı', 'raf'] },
  { id: 'alt-cift-kapak', ad: 'Alt Dolap – Çift Kapaklı', w: [800, 600, 1200], columns: [col(raf(1, { kapak: { adet: 2 } }))], etiket: ['kapaklı', 'iki kapak'] },
  { id: 'alt-acik-raf', ad: 'Alt Dolap – Açık Raflı', w: [300, 150, 900], columns: [col(raf(1, { cephe: 'acik' }))], etiket: ['açık', 'raf', 'uç'] },
  { id: 'alt-2-cekmece', ad: 'Alt Dolap – 2 Çekmeceli', w: [600, 300, 1000], columns: [col(cek(2, [1, 1]))], etiket: ['çekmece'] },
  { id: 'alt-3-cekmece', ad: 'Alt Dolap – 3 Çekmeceli', w: [600, 300, 1000], columns: [col(cek(3, [1.5, 1.5, 1]))], etiket: ['çekmece'] },
  { id: 'alt-4-cekmece', ad: 'Alt Dolap – 4 Çekmeceli', w: [600, 300, 1000], columns: [col(cek(4, [1.2, 1.2, 1, 0.8]))], etiket: ['çekmece'] },
  {
    id: 'alt-kasiklik-3-cekmece',
    ad: 'Alt Dolap – Kaşıklıklı 3 Çekmece',
    w: [600, 300, 1000],
    columns: [col(cek(3, [1.5, 1.5, 1]))],
    ekDonanim: [{ id: 'aks-kasiklik-*', adet: 1 }],
    etiket: ['çekmece', 'kaşıklık'],
  },
  {
    id: 'alt-ocak-alti',
    ad: 'Alt Dolap – Ocak Altı Çekmeceli',
    aciklama: 'Üstte ince çekmece (ocak payı), altta iki derin çekmece',
    w: [600, 450, 900],
    columns: [col(cek(3, [1.6, 1.4, 0.6]))],
    etiket: ['çekmece', 'ocak'],
  },
  {
    id: 'alt-cekmece-kapak',
    ad: 'Alt Dolap – Üstte Çekmece, Altta Kapak',
    w: [600, 300, 1200],
    columns: [col(raf(1, { ustTabla: true }), cek(1, undefined, { h: { mm: 140 } }))],
    etiket: ['çekmece', 'kapak'],
  },
  {
    id: 'alt-evye',
    ad: 'Evye Dolabı',
    aciklama: 'Arkalıksız, arkada dik kuşaklar – tesisat geçişi için',
    w: [900, 600, 1200],
    govde: { ust: 'kusak', ayak: true, evye: true },
    columns: [col({ tip: 'bos' })],
    ekDonanim: [{ id: 'aks-evye-alti-tepsi-*', adet: 1 }],
    etiket: ['evye', 'lavabo'],
  },
  {
    id: 'alt-evye-cop',
    ad: 'Evye Dolabı – Çöp Kovalı',
    w: [800, 600, 1200],
    govde: { ust: 'kusak', ayak: true, evye: true },
    columns: [col({ tip: 'bos' })],
    ekDonanim: [{ id: 'aks-cop-kovasi-kapak-alti', adet: 1 }],
    etiket: ['evye', 'çöp'],
  },
  {
    id: 'alt-ankastre-firin',
    ad: 'Ankastre Fırın Dolabı',
    aciklama: 'Altta çekmece, üstte 600 mm fırın boşluğu',
    w: [600, 600, 600],
    esnek: false,
    govde: { ust: 'kusak', ayak: true, arkalik: false },
    columns: [col(cek(1, undefined, { h: { mm: 120 }, ustTabla: true }), { tip: 'cihaz', cihaz: 'Ankastre fırın' })],
    ekDonanim: [{ id: 'aks-firin-izgara', adet: 1 }],
    etiket: ['fırın', 'ankastre'],
  },
  {
    id: 'alt-bulasik-boslugu',
    ad: 'Bulaşık Makinesi Boşluğu',
    aciklama: 'Solo/ankastre makine için boşluk – tezgah devam eder',
    w: [600, 450, 600],
    esnek: false,
    ozel: 'bosluk',
    columns: [],
    etiket: ['bulaşık', 'boşluk', 'tezgah-alti'],
  },
  {
    id: 'alt-bulasik-entegre',
    ad: 'Bulaşık Makinesi Entegre Kapağı',
    aciklama: 'Tam ankastre makineye takılan kapak paneli',
    w: [600, 450, 600],
    esnek: false,
    ozel: 'cihazKapak',
    columns: [],
    etiket: ['bulaşık', 'ankastre', 'kapak'],
  },
  {
    id: 'alt-camasir-boslugu',
    ad: 'Çamaşır Makinesi Boşluğu',
    w: [600, 600, 650],
    esnek: false,
    ozel: 'bosluk',
    columns: [],
    etiket: ['çamaşır', 'boşluk', 'tezgah-alti'],
  },
  {
    id: 'alt-kose',
    ad: 'Alt Köşe Dolap (Kör Köşe)',
    aciklama: 'L mutfak köşesi – kör kısım (650 mm) diğer duvardaki dolabın arkasında kalır. Yön = kapağın olduğu taraf',
    w: [1100, 1000, 1300],
    esnek: false,
    ozel: 'kose',
    koseKorPay: 650,
    columns: [col(raf(1))],
    etiket: ['köşe', 'L'],
  },
  {
    id: 'alt-kose-karusel',
    ad: 'Alt Köşe Dolap – Karuselli',
    w: [1100, 1000, 1300],
    esnek: false,
    ozel: 'kose',
    koseKorPay: 650,
    columns: [col({ tip: 'bos' })],
    ekDonanim: [{ id: 'aks-kose-karusel', adet: 1 }],
    etiket: ['köşe', 'karusel', 'frizbi'],
  },
  {
    id: 'alt-kose-sihirli',
    ad: 'Alt Köşe Dolap – Sihirli Köşe',
    w: [1100, 1000, 1300],
    esnek: false,
    ozel: 'kose',
    koseKorPay: 650,
    columns: [col({ tip: 'bos' })],
    ekDonanim: [{ id: 'aks-sihirli-kose', adet: 1 }],
    etiket: ['köşe', 'magic corner'],
  },
  {
    id: 'alt-cop',
    ad: 'Çöp Dolabı',
    w: [400, 300, 600],
    columns: [col({ tip: 'bos' })],
    ekDonanim: [{ id: 'aks-cop-kovasi-cift', adet: 1 }],
    etiket: ['çöp'],
  },
  {
    id: 'alt-siselik',
    ad: 'Şişelik (Çekme Mekanizmalı)',
    w: [200, 150, 300],
    columns: [col({ tip: 'bos', cephe: 'panel' })],
    ekDonanim: [{ id: 'aks-siselik-*', adet: 1 }],
    etiket: ['şişelik', 'dar'],
  },
  {
    id: 'alt-tepsilik',
    ad: 'Tepsilik (Dikey Bölmeli)',
    w: [300, 150, 400],
    columns: [col({ tip: 'bos' })],
    ekDonanim: [{ id: 'aks-tepsilik', adet: 1 }],
    etiket: ['tepsilik', 'dar'],
  },
  {
    id: 'alt-deterjanlik',
    ad: 'Deterjanlık (Çekme)',
    w: [300, 150, 400],
    columns: [col({ tip: 'bos', cephe: 'panel' })],
    ekDonanim: [{ id: 'aks-deterjanlik', adet: 1 }],
    etiket: ['deterjan', 'dar'],
  },
  {
    id: 'alt-cekme-sepet',
    ad: 'Alt Dolap – Çekme Tel Sepetli',
    w: [600, 450, 900],
    columns: [col(cek(2, [1, 1]))],
    ekDonanim: [{ id: 'aks-tel-sepet-cekme-60', adet: 2 }],
    etiket: ['sepet', 'çekme'],
  },
  { id: 'alt-dolgu', ad: 'Alt Dolgu Paneli', w: [50, 20, 200], esnek: false, ozel: 'dolgu', columns: [], etiket: ['dolgu', 'boşluk kapatma'] },
  { id: 'alt-yan-panel', ad: 'Alt Görünen Yan Panel', aciklama: 'Genişlik = panel kalınlığı', w: [18, 16, 40], esnek: false, ozel: 'yanPanel', govde: { ust: 'yok' }, columns: [], etiket: ['yan panel', 'dekor'] },
]);

// ---------------------------------------------------------------------------
// MUTFAK – ÜST DOLAPLAR (H: 720, D: 320)
// ---------------------------------------------------------------------------
const mutfakUst = grup('mutfak-ust', 'ust', UST, [720, 300, 1100], [320, 250, 400], [
  { id: 'ust-tek-kapak', ad: 'Üst Dolap – Tek Kapaklı', w: [450, 250, 600], columns: [col(raf())], etiket: ['kapaklı'] },
  { id: 'ust-cift-kapak', ad: 'Üst Dolap – Çift Kapaklı', w: [800, 600, 1200], columns: [col(raf(undefined, { kapak: { adet: 2 } }))], etiket: ['kapaklı', 'iki kapak'] },
  { id: 'ust-camli-tek', ad: 'Üst Dolap – Camlı Tek Kapak', aciklama: 'Alüminyum çerçeveli cam kapak', w: [450, 300, 600], columns: [col(raf(undefined, { kapak: { mekanizma: 'cam' } }))], etiket: ['cam', 'vitrin'] },
  { id: 'ust-camli-cift', ad: 'Üst Dolap – Camlı Çift Kapak', w: [800, 600, 1200], columns: [col(raf(undefined, { kapak: { adet: 2, mekanizma: 'cam' } }))], etiket: ['cam', 'vitrin'] },
  { id: 'ust-kalkar', ad: 'Üst Dolap – Yukarı Kalkar (Amortisörlü)', w: [800, 400, 1200], h: [400, 300, 600], columns: [col(raf(0, { kapak: { mekanizma: 'kalkar' } }))], etiket: ['kalkar', 'piston', 'amortisör'] },
  { id: 'ust-dusen', ad: 'Üst Dolap – Düşen Kapak', w: [800, 400, 1200], h: [400, 300, 600], columns: [col(raf(0, { kapak: { mekanizma: 'dusen' } }))], etiket: ['düşen', 'düşer kapak'] },
  { id: 'ust-katlanir', ad: 'Üst Dolap – Katlanır Kapak', w: [900, 600, 1200], h: [720, 600, 900], columns: [col(raf(1, { kapak: { mekanizma: 'katlanir' } }))], etiket: ['katlanır', 'aventos hf'] },
  { id: 'ust-dikey-kalkar', ad: 'Üst Dolap – Dikey Kalkar', w: [900, 450, 1200], h: [400, 300, 600], columns: [col(raf(0, { kapak: { mekanizma: 'dikey' } }))], etiket: ['dikey', 'paralel kalkar'] },
  {
    id: 'ust-iki-katli',
    ad: 'Üst Dolap – İki Katlı (Altta Kapak, Üstte Kalkar)',
    w: [800, 450, 1200],
    h: [1080, 900, 1200],
    columns: [col(raf(1, { h: { pay: 2 }, ustTabla: true }), raf(0, { h: { pay: 1 }, ayri: true, kapak: { mekanizma: 'kalkar' } }))],
    etiket: ['tavana kadar', 'kalkar'],
  },
  { id: 'ust-aspirator', ad: 'Aspiratör Üstü Dolap', w: [600, 500, 900], h: [400, 250, 500], columns: [col(raf(0))], etiket: ['aspiratör', 'davlumbaz'] },
  { id: 'ust-bulasiklik', ad: 'Üst Dolap – Bulaşıklıklı (Süzgeçli)', w: [800, 600, 900], columns: [col({ tip: 'bos' })], ekDonanim: [{ id: 'aks-bulasiklik-*', adet: 1 }], etiket: ['bulaşıklık', 'süzgeç'] },
  { id: 'ust-kose', ad: 'Üst Köşe Dolap (Kör Köşe)', w: [750, 650, 1000], esnek: false, ozel: 'kose', koseKorPay: 370, columns: [col(raf())], etiket: ['köşe'] },
  { id: 'ust-acik-raf', ad: 'Üst Dolap – Açık Raflı', w: [300, 150, 900], columns: [col(raf(undefined, { cephe: 'acik' }))], etiket: ['açık', 'raf', 'uç'] },
  {
    id: 'ust-mikrodalga',
    ad: 'Üst Dolap – Mikrodalga Yerli',
    w: [600, 600, 700],
    esnek: false,
    columns: [col({ tip: 'cihaz', cihaz: 'Mikrodalga', h: { mm: 380 }, ustTabla: true }, raf(0))],
    etiket: ['mikrodalga', 'ankastre'],
  },
  { id: 'ust-baharatlik', ad: 'Üst Dolap – Baharatlık (Dar)', w: [200, 150, 300], columns: [col(raf(3))], ekDonanim: [{ id: 'aks-baharatlik', adet: 1 }], etiket: ['baharat', 'dar'] },
  { id: 'ust-bosluk', ad: 'Üst Boşluk (Pencere / Aspiratör)', w: [600, 50, 3000], esnek: false, ozel: 'bosluk', columns: [], etiket: ['boşluk', 'pencere', 'aspiratör'] },
  { id: 'ust-dolgu', ad: 'Üst Dolgu Paneli', w: [50, 20, 200], esnek: false, ozel: 'dolgu', columns: [], etiket: ['dolgu'] },
  { id: 'ust-yan-panel', ad: 'Üst Görünen Yan Panel', w: [18, 16, 40], esnek: false, ozel: 'yanPanel', govde: { ust: 'yok' }, columns: [], etiket: ['yan panel'] },
]);

// ---------------------------------------------------------------------------
// MUTFAK – BOY DOLAPLAR (H: 2180, D: 560)
// ---------------------------------------------------------------------------
const mutfakBoy = grup('mutfak-boy', 'boy', BOY, [2180, 1800, 2700], [560, 450, 650], [
  {
    id: 'boy-kiler',
    ad: 'Kiler Dolabı (Alt + Üst Kapak)',
    w: [600, 300, 900],
    columns: [col(raf(3, { h: { pay: 2.4 }, ustTabla: true }), raf(1, { h: { pay: 1 }, ayri: true }))],
    etiket: ['kiler', 'erzak'],
  },
  {
    id: 'boy-kiler-mekanizmali',
    ad: 'Kiler Dolabı – Çekme Kiler Ünitesi',
    w: [400, 300, 450],
    columns: [col({ tip: 'bos', h: { pay: 2.4 }, ustTabla: true }, raf(1, { h: { pay: 1 }, ayri: true }))],
    ekDonanim: [{ id: 'aks-kiler-*', adet: 1 }],
    etiket: ['kiler', 'mekanizma'],
  },
  {
    id: 'boy-ankastre-firin-mikro',
    ad: 'Boy Ankastre Dolabı (Fırın + Mikrodalga)',
    w: [600, 600, 600],
    esnek: false,
    govde: { ust: 'tabla', ayak: true, arkalik: false },
    columns: [
      col(
        cek(2, [1, 1], { h: { mm: 520 }, ustTabla: true }),
        { tip: 'cihaz', cihaz: 'Ankastre fırın', h: { mm: 595 }, ustTabla: true },
        { tip: 'cihaz', cihaz: 'Mikrodalga', h: { mm: 380 }, ustTabla: true },
        raf(0),
      ),
    ],
    ekDonanim: [{ id: 'aks-firin-izgara', adet: 1 }],
    etiket: ['fırın', 'mikrodalga', 'ankastre', 'boy'],
  },
  {
    id: 'boy-ankastre-firin',
    ad: 'Boy Ankastre Dolabı (Fırın)',
    w: [600, 600, 600],
    esnek: false,
    govde: { ust: 'tabla', ayak: true, arkalik: false },
    columns: [col(cek(3, [1.3, 1, 1], { h: { mm: 700 }, ustTabla: true }), { tip: 'cihaz', cihaz: 'Ankastre fırın', h: { mm: 595 }, ustTabla: true }, raf(1))],
    ekDonanim: [{ id: 'aks-firin-izgara', adet: 1 }],
    etiket: ['fırın', 'ankastre', 'boy'],
  },
  {
    id: 'boy-buzdolabi',
    ad: 'Buzdolabı Yeri (Üstü Dolaplı)',
    aciklama: 'Alt tablasız; buzdolabı boşluğu + üstte kapaklı dolap',
    w: [700, 600, 950],
    esnek: false,
    govde: { ust: 'tabla', ayak: false, alt: false, arkalik: false },
    columns: [col({ tip: 'cihaz', cihaz: 'Buzdolabı', h: { mm: 1850 }, ustTabla: true }, raf(0))],
    ekDonanim: [{ id: 'aks-buzdolabi-izgara', adet: 1 }],
    etiket: ['buzdolabı', 'boy'],
  },
  {
    id: 'boy-buzdolabi-entegre',
    ad: 'Buzdolabı Dolabı – Entegre (Kapaklı)',
    w: [600, 560, 650],
    esnek: false,
    columns: [col({ tip: 'cihaz', cihaz: 'Ankastre buzdolabı', h: { mm: 1780 }, ustTabla: true, cephe: 'kapak' }, raf(0, { ayri: true }))],
    etiket: ['buzdolabı', 'entegre', 'ankastre'],
  },
  { id: 'boy-supurgelik', ad: 'Temizlik Dolabı (Süpürge)', w: [450, 300, 600], columns: [col({ tip: 'bos', h: { pay: 4 }, ustTabla: true }, raf(1, { h: { pay: 1 } }))], etiket: ['süpürge', 'temizlik'] },
  {
    id: 'boy-cekmeceli',
    ad: 'Boy Dolap – Altta Çekmece, Üstte Kapak',
    w: [600, 400, 900],
    columns: [col(cek(3, [1.3, 1, 1], { h: { mm: 700 }, ustTabla: true }), raf(3))],
    etiket: ['çekmece', 'boy'],
  },
  {
    id: 'boy-camli',
    ad: 'Boy Dolap – Üstü Camlı Vitrin',
    w: [600, 400, 900],
    columns: [col(raf(2, { h: { pay: 1.2 }, ustTabla: true }), raf(2, { h: { pay: 1 }, ayri: true, kapak: { mekanizma: 'cam' } }))],
    etiket: ['vitrin', 'cam', 'boy'],
  },
  { id: 'boy-dolgu', ad: 'Boy Dolgu Paneli', w: [50, 20, 200], esnek: false, ozel: 'dolgu', columns: [], etiket: ['dolgu'] },
  { id: 'boy-yan-panel', ad: 'Boy Görünen Yan Panel', w: [18, 16, 40], esnek: false, ozel: 'yanPanel', govde: { ust: 'yok' }, columns: [], etiket: ['yan panel'] },
]);

// ---------------------------------------------------------------------------
// GARDIROP (H: 2400 = 2300 gövde + 100 baza, D: 580)
// ---------------------------------------------------------------------------
const askiRaf = (): Zone[] => [{ tip: 'aski', h: { pay: 4.5 }, ustTabla: true }, raf(0, { h: { pay: 1 } })];

const gardirop = grup('gardirop', 'alt', GARD, [2400, 1800, 2800], [580, 450, 650], [
  { id: 'gard-tek-raf', ad: 'Gardırop – Tek Kapak Raflı', w: [450, 300, 650], kapakDegisken: true, columns: [col(raf())], etiket: ['tek kapak', 'raf'] },
  { id: 'gard-tek-aski', ad: 'Gardırop – Tek Kapak Askılı', w: [450, 350, 650], kapakDegisken: true, columns: [col(...askiRaf())], etiket: ['tek kapak', 'askı'] },
  {
    id: 'gard-tek-ic-cekmece',
    ad: 'Gardırop – Tek Kapak, İçten Çekmeceli',
    w: [500, 400, 650],
    kapakDegisken: true,
    columns: [col({ tip: 'icCekmece', adet: 3, h: { mm: 620 }, ustTabla: true }, { tip: 'aski', h: { pay: 3.5 }, ustTabla: true }, raf(0, { h: { pay: 1 } }))],
    etiket: ['iç çekmece'],
  },
  {
    id: 'gard-tek-dis-cekmece',
    ad: 'Gardırop – Tek Kapak, Dıştan Çekmeceli',
    w: [500, 400, 650],
    kapakDegisken: true,
    columns: [col(cek(2, [1, 1], { h: { mm: 460 }, ustTabla: true }), { tip: 'aski', h: { pay: 3.5 }, ustTabla: true }, raf(0, { h: { pay: 1 } }))],
    etiket: ['dış çekmece'],
  },
  {
    id: 'gard-iki-aski',
    ad: 'Gardırop – 2 Kapaklı Askılı',
    w: [900, 700, 1200],
    kapakDegisken: true,
    columns: [col({ tip: 'aski', h: { pay: 4.5 }, ustTabla: true, kapak: { adet: 2 } }, raf(0, { h: { pay: 1 }, kapak: { adet: 2 } }))],
    etiket: ['iki kapak', 'askı'],
  },
  {
    id: 'gard-iki-raf',
    ad: 'Gardırop – 2 Kapaklı Raflı',
    w: [900, 700, 1200],
    kapakDegisken: true,
    columns: [col(raf(undefined, { kapak: { adet: 2 } }))],
    etiket: ['iki kapak', 'raf', 'çamaşır'],
  },
  {
    id: 'gard-iki-bolmeli',
    ad: 'Gardırop – 2 Kapaklı Bölmeli (Askı + Raf)',
    w: [900, 700, 1200],
    kapakDegisken: true,
    columns: [col(...askiRaf()), col(raf())],
    etiket: ['iki kapak', 'askı', 'raf', 'ara dikme'],
  },
  {
    id: 'gard-iki-ic-cekmece',
    ad: 'Gardırop – 2 Kapaklı, İçten Çekmeceli',
    w: [900, 700, 1200],
    kapakDegisken: true,
    columns: [col({ tip: 'icCekmece', adet: 3, h: { mm: 620 }, ustTabla: true, kapak: { adet: 2 } }, { tip: 'aski', h: { pay: 3.5 }, ustTabla: true }, raf(0, { h: { pay: 1 } }))],
    etiket: ['iki kapak', 'iç çekmece'],
  },
  {
    id: 'gard-iki-dis-cekmece',
    ad: 'Gardırop – 2 Kapaklı, Dıştan Çekmeceli',
    w: [900, 700, 1200],
    kapakDegisken: true,
    columns: [col(cek(2, [1, 1], { h: { mm: 460 }, ustTabla: true }), { tip: 'aski', h: { pay: 3.5 }, ustTabla: true, kapak: { adet: 2 } }, raf(0, { h: { pay: 1 } }))],
    etiket: ['iki kapak', 'dış çekmece'],
  },
  {
    id: 'gard-iki-pantolonluk',
    ad: 'Gardırop – 2 Kapaklı, Pantolonluk + Kravatlık',
    w: [900, 700, 1200],
    kapakDegisken: true,
    columns: [col({ tip: 'aski', h: { pay: 2 }, ustTabla: true, kapak: { adet: 2 } }, { tip: 'aski', h: { pay: 2 }, ustTabla: true }, raf(0, { h: { pay: 1 } }))],
    ekDonanim: [
      { id: 'aks-pantolonluk-cekme', adet: 1 },
      { id: 'aks-kravatlik', adet: 1 },
    ],
    etiket: ['pantolonluk', 'kravatlık', 'çift askı'],
  },
  {
    id: 'gard-uc-kapak',
    ad: 'Gardırop – 3 Kapaklı (Askı + Raf)',
    w: [1350, 1050, 1800],
    kapakDegisken: true,
    columns: [colW(2, { tip: 'aski', h: { pay: 4.5 }, ustTabla: true, kapak: { adet: 2 } }, raf(0, { h: { pay: 1 }, kapak: { adet: 2 } })), colW(1, raf())],
    etiket: ['üç kapak'],
  },
  {
    id: 'gard-dort-kapak',
    ad: 'Gardırop – 4 Kapaklı (Askı + Raf + Çekmece)',
    w: [1800, 1400, 2400],
    kapakDegisken: true,
    columns: [
      col({ tip: 'aski', h: { pay: 4.5 }, ustTabla: true, kapak: { adet: 2 } }, raf(0, { h: { pay: 1 }, kapak: { adet: 2 } })),
      col({ tip: 'icCekmece', adet: 3, h: { mm: 620 }, ustTabla: true, kapak: { adet: 2 } }, raf(undefined, { h: { pay: 3 } })),
    ],
    etiket: ['dört kapak'],
  },
  {
    id: 'gard-aynali-tek',
    ad: 'Gardırop – Aynalı Tek Kapak',
    w: [450, 350, 650],
    kapakDegisken: true,
    columns: [col({ tip: 'aski', h: { pay: 4.5 }, ustTabla: true, kapak: { mekanizma: 'ayna' } }, raf(0, { h: { pay: 1 } }))],
    etiket: ['ayna', 'aynalı kapak'],
  },
  {
    id: 'gard-aynali-iki',
    ad: 'Gardırop – Aynalı 2 Kapak',
    w: [900, 700, 1200],
    kapakDegisken: true,
    columns: [col({ tip: 'aski', h: { pay: 4.5 }, ustTabla: true, kapak: { adet: 2, mekanizma: 'ayna' } }, raf(0, { h: { pay: 1 } }))],
    etiket: ['ayna', 'aynalı kapak'],
  },
  {
    id: 'gard-kose',
    ad: 'Gardırop – Köşe Modülü (Kör Köşe)',
    w: [1200, 1100, 1400],
    esnek: false,
    ozel: 'kose',
    koseKorPay: 650,
    columns: [col(...askiRaf())],
    etiket: ['köşe', 'L gardırop'],
  },
  {
    id: 'gard-surgulu-2',
    ad: 'Sürgülü Gardırop – 2 Kapak',
    aciklama: 'Ray payı için derinlik 620 önerilir',
    w: [1800, 1200, 2400],
    d: [620, 550, 700],
    ozel: 'surgulu',
    columns: [col(...askiRaf()), col({ tip: 'icCekmece', adet: 3, h: { mm: 620 }, ustTabla: true }, raf())],
    etiket: ['sürgülü', 'kayar kapak'],
  },
  {
    id: 'gard-surgulu-3',
    ad: 'Sürgülü Gardırop – 3 Kapak',
    w: [2400, 1800, 3300],
    d: [620, 550, 700],
    ozel: 'surgulu',
    columns: [col(...askiRaf()), col(raf()), col(...askiRaf())],
    etiket: ['sürgülü', 'kayar kapak'],
  },
  {
    id: 'gard-acik-giyinme',
    ad: 'Giyinme Odası – Açık Modül',
    w: [900, 400, 1200],
    columns: [col({ tip: 'icCekmece', adet: 2, h: { mm: 420 }, ustTabla: true, cephe: 'acik' }, { tip: 'aski', h: { pay: 3.5 }, ustTabla: true, cephe: 'acik' }, raf(0, { h: { pay: 1 }, cephe: 'acik' }))],
    etiket: ['açık', 'giyinme odası', 'walk-in'],
  },
  {
    id: 'gard-ayakkabilik',
    ad: 'Gardırop – Ayakkabılık Modülü',
    w: [600, 400, 900],
    kapakDegisken: true,
    columns: [col({ tip: 'ayakkabi', h: { pay: 3 }, ustTabla: true }, raf(1, { h: { pay: 1 } }))],
    etiket: ['ayakkabılık'],
  },
  { id: 'gard-dolgu', ad: 'Gardırop Dolgu Paneli', w: [50, 20, 250], esnek: false, ozel: 'dolgu', columns: [], etiket: ['dolgu'] },
  { id: 'gard-yan-panel', ad: 'Gardırop Görünen Yan Panel', w: [18, 16, 40], esnek: false, ozel: 'yanPanel', govde: { ust: 'yok' }, columns: [], etiket: ['yan panel'] },
]);

const gardiropUst = grup('gardirop', 'ust', { ust: 'tabla' }, [500, 300, 900], [580, 450, 650], [
  { id: 'gard-yukluk', ad: 'Yüklük (Gardırop Üstü)', w: [900, 400, 1200], kapakDegisken: true, columns: [col(raf(0))], etiket: ['yüklük', 'asma', 'tavan'] },
  { id: 'gard-yukluk-kalkar', ad: 'Yüklük – Yukarı Kalkar', w: [900, 400, 1200], columns: [col(raf(0, { kapak: { mekanizma: 'kalkar' } }))], etiket: ['yüklük', 'kalkar'] },
  { id: 'gard-ust-bosluk', ad: 'Üst Boşluk', w: [300, 50, 3000], esnek: false, ozel: 'bosluk', columns: [], etiket: ['boşluk'] },
]);

// ---------------------------------------------------------------------------
// VESTİYER / PORTMANTO (H: 2000, D: 400)
// ---------------------------------------------------------------------------
const vestiyer = grup('vestiyer', 'alt', BAZALI, [2000, 1500, 2600], [400, 300, 500], [
  {
    id: 'ves-boy-ayakkabilik',
    ad: 'Vestiyer – Boy Dolap Tek Kapak (Ayakkabılık)',
    w: [450, 300, 650],
    columns: [col({ tip: 'ayakkabi', h: { pay: 2 }, ustTabla: true }, raf(1, { h: { pay: 1 } }))],
    etiket: ['ayakkabılık', 'boy'],
  },
  {
    id: 'ves-boy-iki-ayakkabilik',
    ad: 'Vestiyer – Boy Dolap 2 Kapak (Ayakkabılık)',
    w: [800, 600, 1100],
    columns: [col({ tip: 'ayakkabi', h: { pay: 2 }, ustTabla: true, kapak: { adet: 2 } }, raf(1, { h: { pay: 1 }, kapak: { adet: 2 } }))],
    etiket: ['ayakkabılık', 'boy'],
  },
  {
    id: 'ves-acik-askilik',
    ad: 'Vestiyer – Açık Askılık',
    aciklama: 'Arkalıkta askı kancaları, altta açık ayakkabı rafı, üstte şapka rafı',
    w: [700, 400, 1200],
    columns: [col({ tip: 'ayakkabi', adet: 1, h: { mm: 400 }, ustTabla: true, cephe: 'acik' }, { tip: 'bos', h: { pay: 3 }, ustTabla: true, cephe: 'acik' }, raf(0, { h: { mm: 320 }, cephe: 'acik' }))],
    ekDonanim: [{ id: 'aks-aski-kancasi', adet: 5 }],
    etiket: ['açık', 'askılık', 'kanca'],
  },
  {
    id: 'ves-puf-oturakli',
    ad: 'Vestiyer – Puf Oturaklı Açık Askılık',
    w: [900, 600, 1400],
    columns: [col({ tip: 'oturak', h: { mm: 430 }, ustTabla: true, cephe: 'acik' }, { tip: 'bos', h: { pay: 3 }, ustTabla: true, cephe: 'acik' }, raf(0, { h: { mm: 320 }, cephe: 'acik' }))],
    ekDonanim: [{ id: 'aks-aski-kancasi', adet: 5 }],
    etiket: ['puf', 'oturak', 'askılık'],
  },
  {
    id: 'ves-puf-kapakli',
    ad: 'Vestiyer – Puf Oturaklı, Üstü Kapaklı',
    w: [900, 600, 1400],
    columns: [col({ tip: 'oturak', h: { mm: 430 }, ustTabla: true, cephe: 'acik' }, { tip: 'bos', h: { pay: 3 }, ustTabla: true, cephe: 'acik' }, raf(0, { h: { mm: 380 }, ayri: true }))],
    ekDonanim: [{ id: 'aks-aski-kancasi', adet: 5 }],
    etiket: ['puf', 'oturak', 'üst kapak'],
  },
  {
    id: 'ves-dort-kapak',
    ad: 'Vestiyer – 4 Kapaklı (Kenarlar Ayakkabılık, Orta Askılık)',
    w: [1600, 1200, 2200],
    columns: [
      colW(1, { tip: 'ayakkabi', h: { pay: 2 }, ustTabla: true }, raf(1, { h: { pay: 1 } })),
      colW(2, { tip: 'aski', h: { pay: 4 }, ustTabla: true, kapak: { adet: 2 } }, raf(0, { h: { pay: 1 }, kapak: { adet: 2 } })),
      colW(1, { tip: 'ayakkabi', h: { pay: 2 }, ustTabla: true }, raf(1, { h: { pay: 1 } })),
    ],
    etiket: ['dört kapak', 'askı', 'ayakkabılık'],
  },
  {
    id: 'ves-uc-kapak',
    ad: 'Vestiyer – 3 Kapaklı (Ayakkabılık + Askılık)',
    w: [1200, 900, 1600],
    columns: [colW(1, { tip: 'ayakkabi', h: { pay: 2 }, ustTabla: true }, raf(1, { h: { pay: 1 } })), colW(2, { tip: 'aski', h: { pay: 4 }, ustTabla: true, kapak: { adet: 2 } }, raf(0, { h: { pay: 1 }, kapak: { adet: 2 } }))],
    etiket: ['üç kapak'],
  },
  {
    id: 'ves-iki-kapak-aski',
    ad: 'Vestiyer – 2 Kapaklı Askılık',
    w: [800, 600, 1100],
    columns: [col({ tip: 'aski', h: { pay: 4 }, ustTabla: true, kapak: { adet: 2 } }, raf(0, { h: { pay: 1 }, kapak: { adet: 2 } }))],
    etiket: ['askı', 'iki kapak'],
  },
  {
    id: 'ves-gizli-aski',
    ad: 'Vestiyer – Kapak İçi Gizli Askılı',
    aciklama: 'Kapak arkasında askı kancaları, içeride ayakkabı rafları',
    w: [500, 350, 650],
    columns: [col({ tip: 'ayakkabi', kapak: { gizliAski: true } })],
    etiket: ['gizli askı', 'kapak içi'],
  },
  {
    id: 'ves-aynali',
    ad: 'Vestiyer – Aynalı Kapaklı Boy Dolap',
    w: [500, 350, 650],
    columns: [col({ tip: 'ayakkabi', h: { pay: 2 }, ustTabla: true, kapak: { mekanizma: 'ayna' } }, raf(1, { h: { pay: 1 } }))],
    etiket: ['ayna', 'boy ayna'],
  },
  {
    id: 'ves-ayakkabilik-alt',
    ad: 'Ayakkabılık – Alçak Kapaklı',
    w: [800, 400, 1400],
    h: [1000, 600, 1300],
    d: [350, 280, 450],
    columns: [col({ tip: 'ayakkabi' })],
    etiket: ['ayakkabılık', 'konsol'],
  },
  {
    id: 'ves-klapa',
    ad: 'Ayakkabılık – Klapa (Devrilir Kapaklı)',
    aciklama: 'İnce gövde, 2 katlı klapa mekanizması',
    w: [800, 500, 1200],
    h: [1100, 800, 1400],
    d: [250, 180, 300],
    columns: [col({ tip: 'bos', cephe: 'panel' }, { tip: 'bos', cephe: 'panel', ayri: true })],
    ekDonanim: [{ id: 'aks-klapa-ayakkabilik-mek', adet: 2 }],
    etiket: ['klapa', 'ince ayakkabılık'],
  },
  {
    id: 'ves-cekmeceli-konsol',
    ad: 'Vestiyer Konsolu – Çekmeceli',
    w: [900, 600, 1400],
    h: [900, 700, 1100],
    columns: [col(cek(3, [1.2, 1, 1]))],
    etiket: ['konsol', 'çekmece'],
  },
  {
    id: 'ves-puf-bank',
    ad: 'Puf / Bank (Altı Ayakkabılık)',
    w: [900, 500, 1500],
    h: [450, 400, 500],
    govde: { ust: 'tabla', ayak: true },
    columns: [col({ tip: 'oturak', cephe: 'acik' })],
    etiket: ['puf', 'bank', 'oturak'],
  },
  { id: 'ves-dolgu', ad: 'Vestiyer Dolgu Paneli', w: [50, 20, 200], esnek: false, ozel: 'dolgu', columns: [], etiket: ['dolgu'] },
  { id: 'ves-yan-panel', ad: 'Vestiyer Görünen Yan Panel', w: [18, 16, 40], esnek: false, ozel: 'yanPanel', govde: { ust: 'yok' }, columns: [], etiket: ['yan panel'] },
]);

const vestiyerUst = grup('vestiyer', 'ust', { ust: 'tabla' }, [500, 300, 800], [400, 300, 500], [
  { id: 'ves-ust-dolap', ad: 'Vestiyer Üst Dolabı', w: [800, 400, 1200], columns: [col(raf(0))], etiket: ['üst', 'asma'] },
  { id: 'ves-ust-bosluk', ad: 'Üst Boşluk', w: [300, 50, 3000], esnek: false, ozel: 'bosluk', columns: [], etiket: ['boşluk'] },
]);

// ---------------------------------------------------------------------------
// YATAK ODASI – KOMİDİN, ŞİFONYER
// ---------------------------------------------------------------------------
const yatak = grup('yatak-odasi', 'serbest', SERBEST, [550, 400, 800], [400, 300, 500], [
  { id: 'komidin-1-cekmece', ad: 'Komidin – Tek Çekmeceli (Altı Açık)', w: [450, 350, 650], columns: [col(raf(0, { cephe: 'acik', ustTabla: true }), cek(1, undefined, { h: { mm: 150 } }))], etiket: ['komidin', 'çekmece'] },
  { id: 'komidin-2-cekmece', ad: 'Komidin – 2 Çekmeceli', w: [450, 350, 650], columns: [col(cek(2, [1, 1]))], etiket: ['komidin', 'çekmece'] },
  { id: 'komidin-3-cekmece', ad: 'Komidin – 3 Çekmeceli', w: [450, 350, 650], h: [650, 500, 800], columns: [col(cek(3, [1.2, 1, 1]))], etiket: ['komidin', 'çekmece'] },
  { id: 'komidin-kapakli', ad: 'Komidin – Çekmece + Kapak', w: [450, 350, 650], columns: [col(raf(0, { ustTabla: true }), cek(1, undefined, { h: { mm: 150 } }))], etiket: ['komidin', 'kapak'] },
  { id: 'sifonyer-3-cekmece', ad: 'Şifonyer – 3 Çekmeceli (Geniş)', w: [1000, 700, 1400], h: [800, 700, 1000], d: [450, 400, 550], columns: [col(cek(3, [1.2, 1, 1]))], etiket: ['şifonyer', 'çekmece'] },
  { id: 'sifonyer-4-cekmece', ad: 'Şifonyer – 4 Çekmeceli', w: [800, 600, 1200], h: [950, 800, 1100], d: [450, 400, 550], columns: [col(cek(4, [1.2, 1.1, 1, 1]))], etiket: ['şifonyer', 'çekmece'] },
  { id: 'sifonyer-5-cekmece', ad: 'Şifonyer – 5 Çekmeceli', w: [800, 600, 1200], h: [1150, 950, 1300], d: [450, 400, 550], columns: [col(cek(5, [1.2, 1.1, 1, 1, 1]))], etiket: ['şifonyer', 'çekmece'] },
  { id: 'sifonyer-6-cekmece', ad: 'Şifonyer – 6 Çekmeceli (2×3)', w: [1200, 900, 1600], h: [850, 700, 1000], d: [450, 400, 550], columns: [col(cek(3, [1.2, 1, 1])), col(cek(3, [1.2, 1, 1]))], etiket: ['şifonyer', 'çekmece', 'çift sıra'] },
  { id: 'sifonyer-kapak-cekmece', ad: 'Şifonyer – Kapaklı + Çekmeceli', w: [1200, 900, 1600], h: [850, 700, 1000], d: [450, 400, 550], columns: [col(raf(1)), col(cek(4, [1.2, 1.1, 1, 1]))], etiket: ['şifonyer', 'kapak', 'çekmece'] },
  { id: 'sifonyer-dar-uzun', ad: 'Şifonyer – Dar Uzun (6 Çekmece)', w: [500, 400, 650], h: [1300, 1100, 1500], d: [450, 400, 550], columns: [col(cek(6, [1.2, 1.1, 1, 1, 1, 1]))], etiket: ['şifonyer', 'dar'] },
  { id: 'makyaj-konsol', ad: 'Makyaj Konsolu (Çekmeceli)', w: [1000, 800, 1400], h: [760, 700, 800], d: [450, 400, 550], columns: [col(cek(3, [1, 1, 1])), col(raf(0, { cephe: 'acik' })), col(cek(3, [1, 1, 1]))], etiket: ['makyaj', 'konsol'] },
]);

// ---------------------------------------------------------------------------
// BANYO
// ---------------------------------------------------------------------------
const banyoAlt = grup('banyo', 'alt', { ust: 'kusak', ayak: true, evye: true }, [700, 450, 900], [460, 350, 550], [
  { id: 'banyo-lavabo-kapakli', ad: 'Banyo Lavabo Altı – Kapaklı', w: [800, 400, 1200], columns: [col({ tip: 'bos' })], etiket: ['lavabo', 'banyo'] },
  { id: 'banyo-lavabo-cekmeceli', ad: 'Banyo Lavabo Altı – 2 Çekmeceli', aciklama: 'Üst çekmecede sifon için U kesim gerekir', w: [800, 400, 1200], columns: [col(cek(2, [1.2, 1]))], etiket: ['lavabo', 'çekmece'] },
  { id: 'banyo-camasir-boslugu', ad: 'Çamaşır Makinesi Boşluğu', w: [650, 600, 700], esnek: false, ozel: 'bosluk', columns: [], etiket: ['çamaşır', 'boşluk'] },
]);
const banyoBoy = grup('banyo', 'alt', { ust: 'tabla', ayak: true }, [1800, 1400, 2200], [320, 250, 450], [
  { id: 'banyo-boy', ad: 'Banyo Boy Dolap (Alt + Üst Kapak)', w: [400, 300, 600], columns: [col(raf(2, { h: { pay: 1.5 }, ustTabla: true }), raf(2, { h: { pay: 1 }, ayri: true }))], etiket: ['boy', 'banyo'] },
  { id: 'banyo-makine-ustu', ad: 'Çamaşır Makinesi Üstü Boy Dolap', w: [650, 600, 750], d: [620, 550, 650], columns: [col({ tip: 'cihaz', cihaz: 'Çamaşır makinesi', h: { mm: 870 }, ustTabla: true }, raf(1))], etiket: ['çamaşır', 'makine üstü'] },
]);
const banyoUst = grup('banyo', 'ust', { ust: 'tabla' }, [700, 400, 900], [150, 120, 250], [
  { id: 'banyo-ust-aynali', ad: 'Banyo Üst Dolap – Aynalı', w: [800, 400, 1200], columns: [col(raf(2, { kapak: { mekanizma: 'ayna' } }))], etiket: ['ayna', 'banyo'] },
  { id: 'banyo-ust-kapakli', ad: 'Banyo Üst Dolap – Kapaklı', w: [600, 300, 1200], columns: [col(raf(2))], etiket: ['banyo'] },
]);

// ---------------------------------------------------------------------------
// SALON / GENEL
// ---------------------------------------------------------------------------
const salon = grup('salon', 'serbest', SERBEST, [500, 350, 700], [450, 350, 550], [
  { id: 'tv-unitesi', ad: 'TV Ünitesi – Kapak + Açık + Kapak', w: [1800, 1200, 2600], columns: [col(raf(0)), colW(1.3, raf(0, { cephe: 'acik' })), col(raf(0))], etiket: ['tv', 'ünite'] },
  { id: 'tv-unitesi-cekmeceli', ad: 'TV Ünitesi – Çekmeceli', w: [1800, 1200, 2600], columns: [col(cek(2, [1, 1])), colW(1.3, raf(0, { cephe: 'acik' })), col(cek(2, [1, 1]))], etiket: ['tv', 'çekmece'] },
  { id: 'konsol-2k-2c', ad: 'Konsol – 2 Kapak + 2 Çekmece', w: [1400, 1000, 1800], h: [800, 700, 950], columns: [col(raf(1)), col(cek(2, [1, 1])), col(raf(1))], etiket: ['konsol', 'büfe'] },
]);
const salonBoy = grup('salon', 'serbest', BAZALI, [2000, 1200, 2600], [350, 250, 450], [
  { id: 'kitaplik-acik', ad: 'Kitaplık – Açık Raflı', w: [800, 400, 1200], columns: [col(raf(undefined, { cephe: 'acik' }))], etiket: ['kitaplık', 'açık raf'] },
  { id: 'kitaplik-alt-kapakli', ad: 'Kitaplık – Altı Kapaklı', w: [800, 400, 1200], columns: [col(raf(1, { h: { mm: 700 }, ustTabla: true }), raf(undefined, { cephe: 'acik' }))], etiket: ['kitaplık', 'kapak'] },
  { id: 'vitrin', ad: 'Vitrin – Üstü Camlı Kapak', w: [800, 500, 1200], columns: [col(raf(1, { h: { mm: 750 }, ustTabla: true }), raf(3, { kapak: { mekanizma: 'cam' }, ayri: true }))], etiket: ['vitrin', 'cam'] },
]);
const salonUst = grup('salon', 'ust', { ust: 'tabla' }, [350, 250, 600], [300, 200, 400], [
  { id: 'tv-asma-kalkar', ad: 'TV Asma Dolap – Kalkar', w: [1200, 600, 2000], columns: [col(raf(0, { kapak: { mekanizma: 'kalkar', adet: 1 } }))], etiket: ['tv', 'asma'] },
  { id: 'duvar-rafi-kutu', ad: 'Duvar Rafı – Açık Kutu', w: [900, 300, 1800], columns: [col(raf(0, { cephe: 'acik' }))], etiket: ['raf', 'duvar'] },
]);

const genel = grup('genel', 'serbest', { ust: 'yok' }, [720, 50, 3000], [560, 50, 800], [
  { id: 'genel-bosluk', ad: 'Boşluk (Pencere, Kolon, Kapı)', w: [600, 50, 4000], esnek: false, ozel: 'bosluk', columns: [], etiket: ['boşluk', 'pencere', 'kolon', 'kapı'] },
  { id: 'genel-bosluk-esnek', ad: 'Esnek Boşluk (Kalanı Doldurur)', aciklama: 'Diğer modüllerle birlikte esner', w: [300, 0, 4000], esnek: true, ozel: 'bosluk', columns: [], etiket: ['boşluk', 'esnek'] },
]);

export const TEMPLATES: ModuleTemplate[] = [
  ...mutfakAlt,
  ...mutfakUst,
  ...mutfakBoy,
  ...gardirop,
  ...gardiropUst,
  ...vestiyer,
  ...vestiyerUst,
  ...yatak,
  ...banyoAlt,
  ...banyoBoy,
  ...banyoUst,
  ...salon,
  ...salonBoy,
  ...salonUst,
  ...genel,
];

export const KATEGORI_ADLARI: Record<ModuleCategory, string> = {
  'mutfak-alt': 'Mutfak – Alt Dolaplar',
  'mutfak-ust': 'Mutfak – Üst Dolaplar',
  'mutfak-boy': 'Mutfak – Boy Dolaplar',
  gardirop: 'Gardırop',
  vestiyer: 'Vestiyer / Portmanto',
  'yatak-odasi': 'Komidin / Şifonyer',
  banyo: 'Banyo',
  salon: 'Salon / TV / Kitaplık',
  genel: 'Boşluk / Genel',
};

export const TEMPLATE_MAP = new Map(TEMPLATES.map((t) => [t.id, t]));
