// ============================================================================
// DC Mobilya Üretim – varsayılan malzeme kütüphanesi (seed data)
// Fiyatlar TL, KDV hariç, 2026 sonu Türkiye piyasası için tahmini değerlerdir.
// Kullanıcı Malzeme Kütüphanesi ekranından fiyat/ad değiştirebilir;
// id'ler motor tarafından referans alındığı için değiştirilmemelidir (bkz. hw.ts).
// ============================================================================

import type { Material, MaterialGroup, PriceUnit } from '../engine/types';

// ---------------------------------------------------------------------------
// Yardımcılar
// ---------------------------------------------------------------------------

const M = (
  id: string,
  kod: string,
  ad: string,
  grup: MaterialGroup,
  alt: string,
  birim: PriceUnit,
  fiyat: number,
  o: Partial<Material> = {},
): Material => ({ id, kod, ad, grup, alt, birim, fiyat, ...o });

/** Fiyatı 10 TL'ye yuvarlar */
const r10 = (n: number) => Math.round(n / 10) * 10;

interface Dekor {
  /** id son eki */
  k: string;
  /** kod son eki */
  kod: string;
  ad: string;
  renk: string;
  damarli?: boolean;
}

const DEKOR = {
  beyaz: { k: 'beyaz', kod: 'BYZ', ad: 'Beyaz', renk: '#F4F4F1' },
  antrasit: { k: 'antrasit', kod: 'ANT', ad: 'Antrasit', renk: '#3B3E42' },
  krem: { k: 'krem', kod: 'KRM', ad: 'Krem', renk: '#EDE3CF' },
  kasmir: { k: 'kasmir', kod: 'KSM', ad: 'Kaşmir', renk: '#CFC3B0' },
  ceviz: { k: 'ceviz', kod: 'CVZ', ad: 'Ceviz', renk: '#6B4A32', damarli: true },
  mese: { k: 'mese', kod: 'MSE', ad: 'Meşe', renk: '#B89468', damarli: true },
  sonoma: { k: 'sonoma', kod: 'SNM', ad: 'Sonoma Meşe', renk: '#C8A77C', damarli: true },
  venge: { k: 'venge', kod: 'VNG', ad: 'Venge', renk: '#3E2B22', damarli: true },
  beton: { k: 'beton', kod: 'BTN', ad: 'Beton Gri', renk: '#9A9A96' },
  siyah: { k: 'siyah', kod: 'SYH', ad: 'Siyah', renk: '#1F1F20' },
  gri: { k: 'gri', kod: 'GRI', ad: 'Gri', renk: '#8C8F93' },
  kirmizi: { k: 'kirmizi', kod: 'KRZ', ad: 'Kırmızı', renk: '#B0192A' },
  yesil: { k: 'yesil', kod: 'YSL', ad: 'Adaçayı Yeşili', renk: '#8A9A7E' },
  lacivert: { k: 'lacivert', kod: 'LCV', ad: 'Lacivert', renk: '#25324A' },
} satisfies Record<string, Dekor>;

type DK = keyof typeof DEKOR;
const d = (k: DK): Dekor => DEKOR[k];

// ============================================================================
// 1) GÖVDE PLAKALARI
// ============================================================================

const suntalam18: [DK, number][] = [
  ['beyaz', 2400],
  ['antrasit', 2550],
  ['krem', 2550],
  ['kasmir', 2550],
  ['ceviz', 2650],
  ['mese', 2650],
  ['sonoma', 2650],
  ['venge', 2650],
  ['beton', 2650],
  ['siyah', 2600],
];

const mdflam18: [DK, number][] = [
  ['beyaz', 2900],
  ['antrasit', 3100],
  ['kasmir', 3100],
  ['krem', 3100],
  ['ceviz', 3250],
  ['mese', 3250],
  ['siyah', 3150],
];

const GOVDE: Material[] = [
  // Suntalam 18 mm – 1830x3660
  ...suntalam18.map(([k, fiyat]) => {
    const x = d(k);
    return M(`govde-suntalam-18-${x.k}`, `GV-SL18-${x.kod}`, `Suntalam 18 mm ${x.ad}`, 'govde', 'Suntalam 18 mm', 'plaka', fiyat, {
      kalinlik: 18,
      plakaBoy: 3660,
      plakaEn: 1830,
      damarli: !!x.damarli,
      bantId: `bant-04-${x.k}`,
      renk: x.renk,
      aciklama: 'Melamin kaplı yonga levha (MFB), E1. Gövde yan, alt, üst ve raflar için standart malzeme.',
    });
  }),
  // Suntalam 16 mm
  M('govde-suntalam-16-beyaz', 'GV-SL16-BYZ', 'Suntalam 16 mm Beyaz', 'govde', 'Suntalam 16 mm', 'plaka', 2250, {
    kalinlik: 16, plakaBoy: 3660, plakaEn: 1830, damarli: false, bantId: 'bant-04x19-beyaz', renk: DEKOR.beyaz.renk,
    aciklama: 'Çekmece kutusu yan/ön/arka ve ekonomik gövde için.',
  }),
  M('govde-suntalam-16-antrasit', 'GV-SL16-ANT', 'Suntalam 16 mm Antrasit', 'govde', 'Suntalam 16 mm', 'plaka', 2400, {
    kalinlik: 16, plakaBoy: 3660, plakaEn: 1830, damarli: false, bantId: 'bant-04x19-antrasit', renk: DEKOR.antrasit.renk,
  }),
  // Kalın suntalam
  M('govde-suntalam-25-beyaz', 'GV-SL25-BYZ', 'Suntalam 25 mm Beyaz', 'govde', 'Suntalam 25-30 mm', 'plaka', 3250, {
    kalinlik: 25, plakaBoy: 3660, plakaEn: 1830, damarli: false, bantId: 'bant-04x42-beyaz', renk: DEKOR.beyaz.renk,
    aciklama: 'Sehim yapmaması için uzun raflar, masa tablası ve üst tablalar.',
  }),
  M('govde-suntalam-25-antrasit', 'GV-SL25-ANT', 'Suntalam 25 mm Antrasit', 'govde', 'Suntalam 25-30 mm', 'plaka', 3450, {
    kalinlik: 25, plakaBoy: 3660, plakaEn: 1830, damarli: false, bantId: 'bant-04x42-antrasit', renk: DEKOR.antrasit.renk,
  }),
  M('govde-suntalam-25-ceviz', 'GV-SL25-CVZ', 'Suntalam 25 mm Ceviz', 'govde', 'Suntalam 25-30 mm', 'plaka', 3550, {
    kalinlik: 25, plakaBoy: 3660, plakaEn: 1830, damarli: true, bantId: 'bant-04x42-ceviz', renk: DEKOR.ceviz.renk,
  }),
  M('govde-suntalam-30-beyaz', 'GV-SL30-BYZ', 'Suntalam 30 mm Beyaz', 'govde', 'Suntalam 25-30 mm', 'plaka', 3900, {
    kalinlik: 30, plakaBoy: 3660, plakaEn: 1830, damarli: false, bantId: 'bant-2x42-beyaz', renk: DEKOR.beyaz.renk,
    aciklama: 'Kalın tabla, çalışma masası ve dekoratif raflar.',
  }),
  M('govde-suntalam-30-antrasit', 'GV-SL30-ANT', 'Suntalam 30 mm Antrasit', 'govde', 'Suntalam 25-30 mm', 'plaka', 4100, {
    kalinlik: 30, plakaBoy: 3660, plakaEn: 1830, damarli: false, bantId: 'bant-2x42-antrasit', renk: DEKOR.antrasit.renk,
  }),
  // İnce suntalam
  M('govde-suntalam-8-beyaz', 'GV-SL08-BYZ', 'Suntalam 8 mm Beyaz', 'govde', 'Suntalam 8 mm', 'plaka', 1350, {
    kalinlik: 8, plakaBoy: 3660, plakaEn: 1830, damarli: false, bantId: 'bant-04x12-beyaz', renk: DEKOR.beyaz.renk,
    aciklama: 'Çekmece tabanı ve kanala geçme arkalık için.',
  }),
  M('govde-suntalam-8-antrasit', 'GV-SL08-ANT', 'Suntalam 8 mm Antrasit', 'govde', 'Suntalam 8 mm', 'plaka', 1450, {
    kalinlik: 8, plakaBoy: 3660, plakaEn: 1830, damarli: false, bantId: 'bant-04x12-antrasit', renk: DEKOR.antrasit.renk,
  }),
  // MDFlam 18 mm – 2100x2800
  ...mdflam18.map(([k, fiyat]) => {
    const x = d(k);
    return M(`govde-mdflam-18-${x.k}`, `GV-ML18-${x.kod}`, `MDFlam 18 mm ${x.ad}`, 'govde', 'MDFlam 18 mm', 'plaka', fiyat, {
      kalinlik: 18,
      plakaBoy: 2800,
      plakaEn: 2100,
      damarli: !!x.damarli,
      bantId: `bant-04-${x.k}`,
      renk: x.renk,
      aciklama: 'Melamin kaplı MDF. Vida tutuşu ve kenar kalitesi suntalamdan iyidir.',
    });
  }),
  M('govde-mdflam-18-nem-beyaz', 'GV-ML18-NEM', 'MDFlam 18 mm Beyaz (Nem Dayanımlı)', 'govde', 'Nem dayanımlı', 'plaka', 3500, {
    kalinlik: 18, plakaBoy: 2800, plakaEn: 2100, damarli: false, bantId: 'bant-04-beyaz', renk: DEKOR.beyaz.renk,
    aciklama: 'Yeşil çekirdekli (MR) MDF üzeri melamin. Evye altı ve banyo dolapları.',
  }),
  M('govde-mdf-18-su-yesili', 'GV-MDF18-MR', 'Su Yeşili MDF 18 mm (Nem Dayanımlı, Ham)', 'govde', 'Nem dayanımlı', 'plaka', 2600, {
    kalinlik: 18, plakaBoy: 2800, plakaEn: 2100, damarli: false, renk: '#7F9C7A',
    aciklama: 'MR (moisture resistant) ham MDF. Banyo ve evye altında boyanarak/kaplanarak kullanılır.',
  }),
  // Ham levhalar
  M('govde-ham-sunta-18', 'GV-HS18', 'Ham Sunta 18 mm', 'govde', 'Ham levha', 'plaka', 1450, {
    kalinlik: 18, plakaBoy: 3660, plakaEn: 1830, damarli: false, renk: '#C9B28E',
    aciklama: 'Kaplamasız yonga levha. Görünmeyen iç bölmeler, baza altı, ambalaj.',
  }),
  M('govde-ham-mdf-18', 'GV-HMDF18', 'Ham MDF 18 mm', 'govde', 'Ham levha', 'plaka', 1900, {
    kalinlik: 18, plakaBoy: 2800, plakaEn: 2100, damarli: false, renk: '#B89A74',
  }),
  M('govde-ham-mdf-22', 'GV-HMDF22', 'Ham MDF 22 mm', 'govde', 'Ham levha', 'plaka', 2350, {
    kalinlik: 22, plakaBoy: 2800, plakaEn: 2100, damarli: false, renk: '#B89A74',
  }),
  M('govde-ham-mdf-25', 'GV-HMDF25', 'Ham MDF 25 mm', 'govde', 'Ham levha', 'plaka', 2700, {
    kalinlik: 25, plakaBoy: 2800, plakaEn: 2100, damarli: false, renk: '#B89A74',
  }),
  M('govde-kontrplak-18', 'GV-KP18', 'Kontrplak 18 mm (Kavak)', 'govde', 'Kontrplak', 'plaka', 3200, {
    kalinlik: 18, plakaBoy: 2440, plakaEn: 1220, damarli: true, renk: '#D8BE93',
    aciklama: 'Kavak kontrplak. Dayanım gereken bölümler ve dekoratif açık kenar uygulamaları.',
  }),
  M('govde-kontrplak-18-hus', 'GV-KP18-HUS', 'Huş Kontrplak 18 mm', 'govde', 'Kontrplak', 'plaka', 5200, {
    kalinlik: 18, plakaBoy: 2500, plakaEn: 1250, damarli: true, renk: '#E3CDA4',
    aciklama: 'Huş (birch) kontrplak, görünen kenar tasarımları için.',
  }),
];

// ============================================================================
// 2) ARKALIKLAR
// ============================================================================

const ARKALIK: Material[] = [
  M('arkalik-hdf-3-beyaz', 'AR-HDF3-BYZ', 'HDF (Duralit) 3 mm Beyaz', 'arkalik', 'HDF 3 mm', 'plaka', 520, {
    kalinlik: 3, plakaBoy: 2800, plakaEn: 2100, damarli: false, renk: DEKOR.beyaz.renk,
    aciklama: 'Tek yüzü beyaz lake HDF. Çakma arkalık için standart.',
  }),
  M('arkalik-hdf-3-beyaz-1830', 'AR-HDF3-BYZ-L', 'HDF (Duralit) 3 mm Beyaz 1830x3660', 'arkalik', 'HDF 3 mm', 'plaka', 610, {
    kalinlik: 3, plakaBoy: 3660, plakaEn: 1830, damarli: false, renk: DEKOR.beyaz.renk,
    aciklama: 'Boy dolaplarda ek yapmadan arkalık için uzun ebat.',
  }),
  M('arkalik-hdf-3-antrasit', 'AR-HDF3-ANT', 'HDF 3 mm Antrasit', 'arkalik', 'HDF 3 mm', 'plaka', 600, {
    kalinlik: 3, plakaBoy: 2800, plakaEn: 2100, damarli: false, renk: DEKOR.antrasit.renk,
  }),
  M('arkalik-hdf-3-ceviz', 'AR-HDF3-CVZ', 'HDF 3 mm Ceviz Desenli', 'arkalik', 'HDF 3 mm', 'plaka', 620, {
    kalinlik: 3, plakaBoy: 2800, plakaEn: 2100, damarli: true, renk: DEKOR.ceviz.renk,
  }),
  M('arkalik-hdf-3-mese', 'AR-HDF3-MSE', 'HDF 3 mm Meşe Desenli', 'arkalik', 'HDF 3 mm', 'plaka', 620, {
    kalinlik: 3, plakaBoy: 2800, plakaEn: 2100, damarli: true, renk: DEKOR.mese.renk,
  }),
  M('arkalik-hdf-3-krem', 'AR-HDF3-KRM', 'HDF 3 mm Krem', 'arkalik', 'HDF 3 mm', 'plaka', 600, {
    kalinlik: 3, plakaBoy: 2800, plakaEn: 2100, damarli: false, renk: DEKOR.krem.renk,
  }),
  M('arkalik-mdflam-5-beyaz', 'AR-ML5-BYZ', 'MDFlam 5 mm Beyaz', 'arkalik', 'MDFlam 5 mm', 'plaka', 1150, {
    kalinlik: 5, plakaBoy: 2800, plakaEn: 2100, damarli: false, renk: DEKOR.beyaz.renk,
    aciklama: 'Çift yüz melaminli. Kanala geçme arkalık ve çekmece tabanı.',
  }),
  M('arkalik-mdf-5-ham', 'AR-MDF5', 'Ham MDF 5 mm', 'arkalik', 'Ham MDF', 'plaka', 750, {
    kalinlik: 5, plakaBoy: 2800, plakaEn: 2100, damarli: false, renk: '#B89A74',
  }),
  M('arkalik-mdflam-8-beyaz', 'AR-ML8-BYZ', 'MDFlam 8 mm Beyaz', 'arkalik', 'MDFlam 8 mm', 'plaka', 1500, {
    kalinlik: 8, plakaBoy: 2800, plakaEn: 2100, damarli: false, renk: DEKOR.beyaz.renk,
    aciklama: 'Kanala geçme sağlam arkalık, asma dolap arkası, çekmece tabanı.',
  }),
  M('arkalik-mdflam-8-antrasit', 'AR-ML8-ANT', 'MDFlam 8 mm Antrasit', 'arkalik', 'MDFlam 8 mm', 'plaka', 1650, {
    kalinlik: 8, plakaBoy: 2800, plakaEn: 2100, damarli: false, renk: DEKOR.antrasit.renk,
  }),
  M('arkalik-suntalam-8-beyaz', 'AR-SL8-BYZ', 'Suntalam 8 mm Beyaz (Arkalık)', 'arkalik', 'Suntalam 8 mm', 'plaka', 1350, {
    kalinlik: 8, plakaBoy: 3660, plakaEn: 1830, damarli: false, renk: DEKOR.beyaz.renk,
  }),
];

// ============================================================================
// 3) KAPAK MALZEMELERİ
// ============================================================================

const KAPAK: Material[] = [
  // MDFlam kapak (kesim)
  ...(
    [
      ['beyaz', 2900],
      ['antrasit', 3100],
      ['krem', 3100],
      ['kasmir', 3100],
      ['ceviz', 3250],
      ['mese', 3250],
      ['sonoma', 3250],
      ['siyah', 3150],
    ] as [DK, number][]
  ).map(([k, fiyat]) => {
    const x = d(k);
    return M(`kapak-mdflam-18-${x.k}`, `KP-ML18-${x.kod}`, `MDFlam Kapak 18 mm ${x.ad}`, 'kapak', 'MDFlam kapak', 'plaka', fiyat, {
      kalinlik: 18, plakaBoy: 2800, plakaEn: 2100, damarli: !!x.damarli, temin: 'kesim',
      bantId: `bant-1-${x.k}`, renk: x.renk,
      aciklama: 'Kapak ve çekmece cephesi; 1 mm PVC bant ile bantlanır.',
    });
  }),
  // High Gloss (parlak) MDF – 2800x1220
  ...(
    [
      ['beyaz', 6500],
      ['krem', 6600],
      ['kasmir', 6600],
      ['antrasit', 6700],
      ['gri', 6700],
      ['siyah', 6700],
      ['kirmizi', 6900],
    ] as [DK, number][]
  ).map(([k, fiyat]) => {
    const x = d(k);
    return M(`kapak-highgloss-18-${x.k}`, `KP-HG18-${x.kod}`, `High Gloss MDF 18 mm ${x.ad}`, 'kapak', 'High Gloss (parlak)', 'plaka', fiyat, {
      kalinlik: 18, plakaBoy: 2800, plakaEn: 1220, damarli: false, temin: 'kesim',
      bantId: `bant-hg-1-${x.k}`, renk: x.renk,
      aciklama: 'Tek yüz parlak PET/UV kaplı MDF, arka yüz beyaz. Koruma filmiyle kesilir.',
    });
  }),
  // Akrilik kaplı MDF plaka
  ...(
    [
      ['beyaz', 7800],
      ['krem', 7900],
      ['kasmir', 7900],
      ['gri', 8000],
      ['antrasit', 8000],
      ['siyah', 8000],
    ] as [DK, number][]
  ).map(([k, fiyat]) => {
    const x = d(k);
    return M(`kapak-akrilik-18-${x.k}`, `KP-AK18-${x.kod}`, `Akrilik Kaplı MDF 18 mm ${x.ad}`, 'kapak', 'Akrilik plaka', 'plaka', fiyat, {
      kalinlik: 18, plakaBoy: 2800, plakaEn: 1220, damarli: false, temin: 'kesim',
      bantId: `bant-akrilik-1-${x.k}`, renk: x.renk,
      aciklama: 'Akrilik (PMMA) yüzeyli MDF, derin parlaklık. Lazer / akrilik bant önerilir.',
    });
  }),
  // Akrilik hazır kapak (m²)
  M('kapak-akrilik-hazir-parlak', 'KP-AKH-PRL', 'Akrilik Hazır Kapak Parlak', 'kapak', 'Akrilik hazır kapak', 'm2', 3600, {
    kalinlik: 18, temin: 'hazir', renk: DEKOR.beyaz.renk,
    aciklama: 'Ölçüye kesilip lazer bantlı teslim edilir. Renk kartelasından seçilir.',
  }),
  M('kapak-akrilik-hazir-mat', 'KP-AKH-MAT', 'Akrilik Hazır Kapak Mat', 'kapak', 'Akrilik hazır kapak', 'm2', 3900, {
    kalinlik: 18, temin: 'hazir', renk: DEKOR.kasmir.renk,
  }),
  M('kapak-akrilik-hazir-antrasit', 'KP-AKH-ANT', 'Akrilik Hazır Kapak Antrasit Parlak', 'kapak', 'Akrilik hazır kapak', 'm2', 3700, {
    kalinlik: 18, temin: 'hazir', renk: DEKOR.antrasit.renk,
  }),
  // Membran kapak (PVC vakum pres)
  M('kapak-membran-duz', 'KP-MB-DUZ', 'Membran Kapak Düz Model', 'kapak', 'Membran (PVC vakum)', 'm2', 2600, {
    kalinlik: 18, temin: 'hazir', renk: DEKOR.beyaz.renk,
    aciklama: 'MDF üzerine PVC folyo vakum pres. Kenarları yekpare, bant gerekmez.',
  }),
  M('kapak-membran-cizgili', 'KP-MB-CZG', 'Membran Kapak Çizgili (Frezeli) Model', 'kapak', 'Membran (PVC vakum)', 'm2', 2800, {
    kalinlik: 18, temin: 'hazir', renk: DEKOR.krem.renk,
  }),
  M('kapak-membran-country', 'KP-MB-CTR', 'Membran Kapak Country Model', 'kapak', 'Membran (PVC vakum)', 'm2', 3100, {
    kalinlik: 18, temin: 'hazir', renk: DEKOR.krem.renk,
    aciklama: 'Göbekli / pervazlı klasik model.',
  }),
  M('kapak-membran-shaker', 'KP-MB-SHK', 'Membran Kapak Shaker (Çerçeveli) Model', 'kapak', 'Membran (PVC vakum)', 'm2', 2900, {
    kalinlik: 18, temin: 'hazir', renk: DEKOR.kasmir.renk,
  }),
  M('kapak-membran-ahsap', 'KP-MB-AHS', 'Membran Kapak Ahşap Desenli', 'kapak', 'Membran (PVC vakum)', 'm2', 2750, {
    kalinlik: 18, temin: 'hazir', renk: DEKOR.mese.renk, damarli: true,
  }),
  M('kapak-membran-parlak', 'KP-MB-PRL', 'Membran Kapak Parlak (High Gloss Folyo)', 'kapak', 'Membran (PVC vakum)', 'm2', 3000, {
    kalinlik: 18, temin: 'hazir', renk: DEKOR.beyaz.renk,
  }),
  M('kapak-balon', 'KP-BLN', 'Balon Kapak (Thermoform)', 'kapak', 'Balon kapak', 'm2', 3000, {
    kalinlik: 18, temin: 'hazir', renk: DEKOR.beyaz.renk,
    aciklama: 'Thermoform folyo kaplama, yuvarlatılmış kenarlı.',
  }),
  M('kapak-balon-cam-cerceve', 'KP-BLN-CAM', 'Balon Cam Çerçeve Kapak', 'kapak', 'Balon kapak', 'm2', 3400, {
    kalinlik: 18, temin: 'hazir', renk: DEKOR.beyaz.renk, aciklama: 'Ortası camlık oyuklu balon çerçeve.',
  }),
  // Lake
  M('kapak-lake-mat', 'KP-LK-MAT', 'Lake Kapak Mat', 'kapak', 'Lake boyalı kapak', 'm2', 4200, {
    kalinlik: 18, temin: 'hazir', renk: DEKOR.beyaz.renk,
    aciklama: 'MDF üzeri poliüretan lake, çift yüz boyalı, RAL/NCS renk.',
  }),
  M('kapak-lake-parlak', 'KP-LK-PRL', 'Lake Kapak Parlak (Pianolu)', 'kapak', 'Lake boyalı kapak', 'm2', 4800, {
    kalinlik: 18, temin: 'hazir', renk: DEKOR.beyaz.renk,
  }),
  M('kapak-lake-dijital', 'KP-LK-DJT', 'Dijital Lake Kapak', 'kapak', 'Lake boyalı kapak', 'm2', 5200, {
    kalinlik: 18, temin: 'hazir', renk: DEKOR.gri.renk, aciklama: 'Dijital baskılı desen + lake vernik.',
  }),
  M('kapak-lake-shaker', 'KP-LK-SHK', 'Lake Kapak Shaker (Frezeli)', 'kapak', 'Lake boyalı kapak', 'm2', 4700, {
    kalinlik: 18, temin: 'hazir', renk: DEKOR.yesil.renk,
  }),
  M('kapak-lake-fitilli', 'KP-LK-FTL', 'Lake Kapak Fitilli (Oluklu) Model', 'kapak', 'Lake boyalı kapak', 'm2', 5400, {
    kalinlik: 18, temin: 'hazir', renk: DEKOR.kasmir.renk,
  }),
  M('kapak-ham-mdf-22-lake', 'KP-HMDF22', 'Ham MDF 22 mm (Lake için)', 'kapak', 'Lake için ham MDF', 'plaka', 2350, {
    kalinlik: 22, plakaBoy: 2800, plakaEn: 2100, damarli: false, temin: 'kesim', renk: '#B89A74',
    aciklama: 'Kendi boyahanesinde lake yapacaklar için; kenarlar boyanır, bant gerekmez.',
  }),
  M('kapak-ham-mdf-18-lake', 'KP-HMDF18', 'Ham MDF 18 mm (Lake için)', 'kapak', 'Lake için ham MDF', 'plaka', 1900, {
    kalinlik: 18, plakaBoy: 2800, plakaEn: 2100, damarli: false, temin: 'kesim', renk: '#B89A74',
  }),
  // Masif / kaplama
  M('kapak-kaplama-mese', 'KP-KPL-MSE', 'Meşe Kaplama Kapak', 'kapak', 'Masif / kaplama kapak', 'm2', 6800, {
    kalinlik: 19, temin: 'hazir', damarli: true, renk: '#B08B5B', aciklama: 'MDF üzeri doğal meşe kaplama, vernikli.',
  }),
  M('kapak-kaplama-ceviz', 'KP-KPL-CVZ', 'Ceviz Kaplama Kapak', 'kapak', 'Masif / kaplama kapak', 'm2', 7500, {
    kalinlik: 19, temin: 'hazir', damarli: true, renk: '#5E3F2A',
  }),
  M('kapak-masif-mese', 'KP-MSF-MSE', 'Masif Meşe Kapak (Çerçeveli)', 'kapak', 'Masif / kaplama kapak', 'm2', 9500, {
    kalinlik: 22, temin: 'hazir', damarli: true, renk: '#A9804F',
  }),
  M('kapak-masif-ceviz', 'KP-MSF-CVZ', 'Masif Ceviz Kapak', 'kapak', 'Masif / kaplama kapak', 'm2', 12500, {
    kalinlik: 22, temin: 'hazir', damarli: true, renk: '#553824',
  }),
  // Süper mat
  ...(
    [
      ['beyaz', 5200],
      ['kasmir', 5300],
      ['antrasit', 5400],
      ['siyah', 5400],
      ['yesil', 5500],
    ] as [DK, number][]
  ).map(([k, fiyat]) => {
    const x = d(k);
    return M(`kapak-supramat-18-${x.k}`, `KP-SM18-${x.kod}`, `Supramat (Süper Mat) MDF 18 mm ${x.ad}`, 'kapak', 'Supramat / süper mat', 'plaka', fiyat, {
      kalinlik: 18, plakaBoy: 2800, plakaEn: 1220, damarli: false, temin: 'kesim',
      bantId: `bant-supramat-1-${x.k}`, renk: x.renk,
      aciklama: 'Parmak izi tutmayan süper mat (anti-fingerprint) yüzey.',
    });
  }),
  // Laminat kapak
  M('kapak-laminat-18-beyaz', 'KP-LM18-BYZ', 'Laminat (HPL) Kaplı Kapak 18 mm Beyaz', 'kapak', 'Laminat kapak', 'plaka', 4200, {
    kalinlik: 18, plakaBoy: 2800, plakaEn: 2100, damarli: false, temin: 'kesim', bantId: 'bant-2-beyaz', renk: DEKOR.beyaz.renk,
    aciklama: 'HPL laminat preslenmiş MDF. Darbe ve çiziğe dayanıklı; 2 mm bant.',
  }),
  M('kapak-laminat-18-antrasit', 'KP-LM18-ANT', 'Laminat (HPL) Kaplı Kapak 18 mm Antrasit', 'kapak', 'Laminat kapak', 'plaka', 4400, {
    kalinlik: 18, plakaBoy: 2800, plakaEn: 2100, damarli: false, temin: 'kesim', bantId: 'bant-2-antrasit', renk: DEKOR.antrasit.renk,
  }),
  M('kapak-laminat-18-ceviz', 'KP-LM18-CVZ', 'Laminat (HPL) Kaplı Kapak 18 mm Ceviz', 'kapak', 'Laminat kapak', 'plaka', 4500, {
    kalinlik: 18, plakaBoy: 2800, plakaEn: 2100, damarli: true, temin: 'kesim', bantId: 'bant-2-ceviz', renk: DEKOR.ceviz.renk,
  }),
];

// ============================================================================
// 4) CAM / AYNA (m²)
// ============================================================================

const cam = (id: string, kod: string, ad: string, alt: string, fiyat: number, kalinlik: number, renk: string, aciklama?: string) =>
  M(id, kod, ad, 'cam', alt, 'm2', fiyat, { kalinlik, renk, aciklama });

const CAM: Material[] = [
  cam('cam-seffaf-4', 'CM-SF4', 'Şeffaf Cam 4 mm', 'Cam', 650, 4, '#CFE3E8', 'Kenar rodajlı, çerçeveli cam kapak için.'),
  cam('cam-fume-4', 'CM-FM4', 'Füme Cam 4 mm', 'Cam', 850, 4, '#5B6166'),
  cam('cam-bronz-4', 'CM-BR4', 'Bronz Cam 4 mm', 'Cam', 850, 4, '#8C6B4A'),
  cam('cam-buzlu-4', 'CM-BZ4', 'Buzlu Cam 4 mm', 'Cam', 900, 4, '#E4ECEE'),
  cam('cam-satine-4', 'CM-ST4', 'Satine (Asitli) Cam 4 mm', 'Cam', 950, 4, '#E9EFF0'),
  cam('cam-fitilli-4', 'CM-FT4', 'Fitilli (Reeded) Cam 4 mm', 'Cam', 1450, 4, '#D7E4E6'),
  cam('cam-fitilli-fume-4', 'CM-FT4-FM', 'Fitilli Füme Cam 4 mm', 'Cam', 1650, 4, '#5F6468'),
  cam('cam-temperli-seffaf-6', 'CM-TSF6', 'Temperli Şeffaf Cam 6 mm', 'Temperli cam', 1300, 6, '#CFE3E8', 'Çerçevesiz kapak ve raf için.'),
  cam('cam-temperli-fume-6', 'CM-TFM6', 'Temperli Füme Cam 6 mm', 'Temperli cam', 1550, 6, '#5B6166'),
  cam('cam-temperli-raf-8', 'CM-TRF8', 'Temperli Cam Raf 8 mm (Rodajlı)', 'Temperli cam', 1900, 8, '#CFE3E8'),
  cam('cam-lacobel-beyaz-4', 'CM-LCB4-BYZ', 'Lacobel (Boyalı Cam) 4 mm Beyaz', 'Lacobel', 1650, 4, '#F2F2EE'),
  cam('cam-lacobel-siyah-4', 'CM-LCB4-SYH', 'Lacobel (Boyalı Cam) 4 mm Siyah', 'Lacobel', 1650, 4, '#141414'),
  cam('cam-lacobel-krem-4', 'CM-LCB4-KRM', 'Lacobel (Boyalı Cam) 4 mm Krem', 'Lacobel', 1650, 4, '#EDE3CF'),
  cam('cam-lacobel-antrasit-4', 'CM-LCB4-ANT', 'Lacobel (Boyalı Cam) 4 mm Antrasit', 'Lacobel', 1700, 4, '#3B3E42'),
  cam('ayna-gumus-4', 'AY-GMS4', 'Gümüş Ayna 4 mm', 'Ayna', 900, 4, '#D9DEE2', 'Rodajlı, arkası folyolu (kırılma emniyetli).'),
  cam('ayna-gumus-5', 'AY-GMS5', 'Gümüş Ayna 5 mm', 'Ayna', 1100, 5, '#D9DEE2'),
  cam('ayna-fume-4', 'AY-FM4', 'Füme Ayna 4 mm', 'Ayna', 1500, 4, '#6C7277'),
  cam('ayna-bronz-4', 'AY-BR4', 'Bronz Ayna 4 mm', 'Ayna', 1500, 4, '#A58767'),
];

// ============================================================================
// 5) KENAR BANTLARI (mt)
// ============================================================================

const bant = (
  id: string,
  kod: string,
  ad: string,
  alt: string,
  fiyat: number,
  bantKalinlik: number,
  renk: string,
  aciklama?: string,
) => M(id, kod, ad, 'bant', alt, 'mt', fiyat, { bantKalinlik, renk, aciklama });

const BANT_RENK_TAM: DK[] = ['beyaz', 'antrasit', 'krem', 'kasmir', 'ceviz', 'mese', 'sonoma', 'venge', 'beton', 'siyah'];
const ahsap = (k: DK) => !!(DEKOR[k] as Dekor).damarli;

const BANT: Material[] = [
  // 0.4 x 22 mm – gövde
  ...BANT_RENK_TAM.map((k) =>
    bant(`bant-04-${k}`, `BT-04-${DEKOR[k].kod}`, `PVC Bant 0.4x22 mm ${DEKOR[k].ad}`, 'PVC 0.4 mm', ahsap(k) ? 4.5 : 4, 0.4, DEKOR[k].renk,
      'Gövde görünmeyen / iç kenarlar.'),
  ),
  // 0.4 mm – diğer genişlikler
  bant('bant-04x12-beyaz', 'BT-04X12-BYZ', 'PVC Bant 0.4x12 mm Beyaz (8 mm plaka)', 'PVC 0.4 mm', 3, 0.4, DEKOR.beyaz.renk),
  bant('bant-04x12-antrasit', 'BT-04X12-ANT', 'PVC Bant 0.4x12 mm Antrasit (8 mm plaka)', 'PVC 0.4 mm', 3.2, 0.4, DEKOR.antrasit.renk),
  bant('bant-04x19-beyaz', 'BT-04X19-BYZ', 'PVC Bant 0.4x19 mm Beyaz (16 mm plaka)', 'PVC 0.4 mm', 3.5, 0.4, DEKOR.beyaz.renk),
  bant('bant-04x19-antrasit', 'BT-04X19-ANT', 'PVC Bant 0.4x19 mm Antrasit (16 mm plaka)', 'PVC 0.4 mm', 3.8, 0.4, DEKOR.antrasit.renk),
  bant('bant-04x42-beyaz', 'BT-04X42-BYZ', 'PVC Bant 0.4x42 mm Beyaz (25-30 mm plaka)', 'PVC 0.4 mm', 7, 0.4, DEKOR.beyaz.renk),
  bant('bant-04x42-antrasit', 'BT-04X42-ANT', 'PVC Bant 0.4x42 mm Antrasit (25-30 mm plaka)', 'PVC 0.4 mm', 7.5, 0.4, DEKOR.antrasit.renk),
  bant('bant-04x42-ceviz', 'BT-04X42-CVZ', 'PVC Bant 0.4x42 mm Ceviz (25-30 mm plaka)', 'PVC 0.4 mm', 8, 0.4, DEKOR.ceviz.renk),
  // 0.8 mm
  bant('bant-08-beyaz', 'BT-08-BYZ', 'PVC Bant 0.8x22 mm Beyaz', 'PVC 0.8 mm', 7, 0.8, DEKOR.beyaz.renk),
  bant('bant-08-antrasit', 'BT-08-ANT', 'PVC Bant 0.8x22 mm Antrasit', 'PVC 0.8 mm', 7.5, 0.8, DEKOR.antrasit.renk),
  bant('bant-08-ceviz', 'BT-08-CVZ', 'PVC Bant 0.8x22 mm Ceviz', 'PVC 0.8 mm', 8, 0.8, DEKOR.ceviz.renk),
  // 1 mm – kapak
  ...BANT_RENK_TAM.map((k) =>
    bant(`bant-1-${k}`, `BT-1-${DEKOR[k].kod}`, `PVC Bant 1x22 mm ${DEKOR[k].ad}`, 'PVC 1 mm', ahsap(k) ? 10 : 9, 1, DEKOR[k].renk,
      'Kapak ve görünen ön kenarlar.'),
  ),
  // 2 mm
  ...(['beyaz', 'antrasit', 'krem', 'kasmir', 'ceviz', 'mese', 'beton', 'siyah'] as DK[]).map((k) =>
    bant(`bant-2-${k}`, `BT-2-${DEKOR[k].kod}`, `PVC Bant 2x22 mm ${DEKOR[k].ad}`, 'PVC 2 mm', ahsap(k) ? 15 : 14, 2, DEKOR[k].renk,
      'Darbeye açık kenarlar, laminat kapak, raf önleri.'),
  ),
  bant('bant-2x42-beyaz', 'BT-2X42-BYZ', 'PVC Bant 2x42 mm Beyaz', 'PVC 2 mm', 26, 2, DEKOR.beyaz.renk),
  bant('bant-2x42-antrasit', 'BT-2X42-ANT', 'PVC Bant 2x42 mm Antrasit', 'PVC 2 mm', 28, 2, DEKOR.antrasit.renk),
  // ABS
  bant('bant-abs-2-beyaz', 'BT-ABS2-BYZ', 'ABS Bant 2x22 mm Beyaz', 'ABS 2 mm', 17, 2, DEKOR.beyaz.renk, 'Halojensiz, esnek ABS bant.'),
  bant('bant-abs-2-antrasit', 'BT-ABS2-ANT', 'ABS Bant 2x22 mm Antrasit', 'ABS 2 mm', 18, 2, DEKOR.antrasit.renk),
  bant('bant-abs-2-ceviz', 'BT-ABS2-CVZ', 'ABS Bant 2x22 mm Ceviz', 'ABS 2 mm', 19, 2, DEKOR.ceviz.renk),
  // High gloss 1 mm
  ...(['beyaz', 'krem', 'kasmir', 'antrasit', 'gri', 'siyah', 'kirmizi'] as DK[]).map((k) =>
    bant(`bant-hg-1-${k}`, `BT-HG1-${DEKOR[k].kod}`, `High Gloss Bant 1x22 mm ${DEKOR[k].ad}`, 'High gloss 1 mm', 16, 1, DEKOR[k].renk,
      'Parlak kapaklarla eşleşen parlak PVC bant.'),
  ),
  // Akrilik 1 mm
  ...(['beyaz', 'krem', 'kasmir', 'gri', 'antrasit', 'siyah'] as DK[]).map((k) =>
    bant(`bant-akrilik-1-${k}`, `BT-AK1-${DEKOR[k].kod}`, `Akrilik Bant 1x22 mm ${DEKOR[k].ad}`, 'Akrilik 1 mm', 18, 1, DEKOR[k].renk),
  ),
  // Akrilik 2 mm (3D)
  ...(['beyaz', 'antrasit', 'siyah'] as DK[]).map((k) =>
    bant(`bant-akrilik-2-3d-${k}`, `BT-AK2-3D-${DEKOR[k].kod}`, `Akrilik 3D Bant 2x22 mm ${DEKOR[k].ad}`, 'Akrilik 2 mm (3D)', 28, 2, DEKOR[k].renk,
      'Şeffaf akrilik, arkası baskılı derinlik efektli bant.'),
  ),
  // Supramat 1 mm
  ...(['beyaz', 'kasmir', 'antrasit', 'siyah', 'yesil'] as DK[]).map((k) =>
    bant(`bant-supramat-1-${k}`, `BT-SM1-${DEKOR[k].kod}`, `Süper Mat Bant 1x22 mm ${DEKOR[k].ad}`, 'Süper mat 1 mm', 18, 1, DEKOR[k].renk),
  ),
];

// ============================================================================
// 6) MENTEŞELER (adet)
// ============================================================================

const ment = (id: string, kod: string, ad: string, alt: string, fiyat: number, aciklama?: string) =>
  M(id, kod, ad, 'mentese', alt, 'adet', fiyat, { aciklama });

const MENTESE: Material[] = [
  ment('mentese-duz', 'MN-DUZ', 'Düz Menteşe (Tam Bindirme) 110°', 'Normal menteşe', 38, 'Kapak gövde yanını tamamen kapatır. Taban dahil.'),
  ment('mentese-duz-frenli', 'MN-DUZ-FR', 'Frenli Düz Menteşe (Tam Bindirme) 110°', 'Frenli menteşe', 95, 'Hidrolik frenli, tak-çıkar, 3 boyutlu ayar. Varsayılan menteşe.'),
  ment('mentese-yarim', 'MN-YRM', 'Yarım Deve Boynu Menteşe (Yarım Bindirme)', 'Normal menteşe', 40, 'Ortak dikmeye iki kapak geldiğinde.'),
  ment('mentese-yarim-frenli', 'MN-YRM-FR', 'Frenli Yarım Deve Boynu Menteşe', 'Frenli menteşe', 98),
  ment('mentese-tam', 'MN-TAM', 'Tam Deve Boynu Menteşe (Gömme)', 'Normal menteşe', 42, 'Kapak gövde içine gömülür.'),
  ment('mentese-tam-frenli', 'MN-TAM-FR', 'Frenli Tam Deve Boynu Menteşe (Gömme)', 'Frenli menteşe', 100),
  ment('mentese-165-derece', 'MN-165', '165° Köşe Menteşesi (Frenli)', 'Özel açılı menteşe', 260, 'L köşe dolap ve geniş açılım gereken kapaklar.'),
  ment('mentese-45-derece', 'MN-45', '45° Açılı Menteşe (Frenli)', 'Özel açılı menteşe', 150, 'Çapraz köşe dolap (45° pahlı) kapakları.'),
  ment('mentese-90-derece', 'MN-90', '90° Açılı Menteşe (Frenli)', 'Özel açılı menteşe', 140, 'Kör köşe (dik açı) kapak bağlantısı.'),
  ment('mentese-kor-kose', 'MN-KRK', 'Kör Köşe Menteşesi (-30°)', 'Özel açılı menteşe', 170),
  ment('mentese-cam-kapak', 'MN-CAM', 'Cam Kapak Menteşesi (Alüminyum Çerçeve)', 'Cam kapak menteşesi', 120, 'Alüminyum çerçeve profil kapak için özel kaide.'),
  ment('mentese-cam-cercevesiz', 'MN-CAM-DLK', 'Çerçevesiz Cam Kapak Menteşesi (Delmesiz)', 'Cam kapak menteşesi', 160, 'Camı delmeden sıkıştırmalı tip.'),
  ment('mentese-ters', 'MN-TRS', 'Ters Menteşe (Ankastre Buzdolabı Kapağı)', 'Özel menteşe', 180, 'Ankastre buzdolabı / bulaşık makinesi kapak bağlantısı.'),
  ment('mentese-ankastre-buzdolabi-kit', 'MN-BZD-KIT', 'Ankastre Buzdolabı Kapak Kaydırma Kiti', 'Özel menteşe', 350, 'Kızaklı kapak taşıma seti (takım başına).'),
  ment('mentese-push', 'MN-PSH', 'Push (Bas-Aç) Menteşe (Yaysız)', 'Push menteşe', 110, 'Kulpsuz kapaklarda bas-aç iticiyle kullanılır.'),
  ment('mentese-mini-26', 'MN-MN26', 'Mini Menteşe 26 mm Kapaklı', 'Mini menteşe', 45, 'İnce kapak, küçük aksesuar dolapları.'),
  ment('mentese-kalin-kapak', 'MN-KLN', 'Kalın Kapak Menteşesi (40 mm kapağa kadar)', 'Özel menteşe', 160, 'Lake / masif kalın kapaklar için derin kaide.'),
  ment('mentese-170-derece', 'MN-170', '170° Geniş Açılı Menteşe (Frenli)', 'Özel açılı menteşe', 280),
  ment('mentese-samet-frenli', 'MN-SMT-FR', 'Samet Frenli Menteşe (Yerli)', 'Frenli menteşe', 120, 'Yerli üretim kaliteli frenli menteşe.'),
  ment('mentese-samet-normal', 'MN-SMT', 'Samet Normal Menteşe (Yerli)', 'Normal menteşe', 55),
  ment('mentese-blum-cliptop', 'MN-BLM-CT', 'Blum Clip Top Blumotion 110° Menteşe', 'Premium menteşe', 320, 'Entegre frenli, kaide dahil.'),
  ment('mentese-blum-cliptop-155', 'MN-BLM-155', 'Blum Clip Top Blumotion 155° Menteşe', 'Premium menteşe', 780),
  ment('mentese-hettich-sensys', 'MN-HTC-SNS', 'Hettich Sensys 110° Frenli Menteşe', 'Premium menteşe', 290),
  ment('mentese-hettich-sensys-165', 'MN-HTC-165', 'Hettich Sensys 165° Menteşe', 'Premium menteşe', 720),
  ment('mentese-kapak-ayar-kaidesi', 'MN-KAIDE', 'Menteşe Yedek Kaidesi (Ayarlı)', 'Menteşe yedek', 15),
];

// ============================================================================
// 7) ÇEKMECE RAYLARI VE SİSTEMLERİ (takım)
// ============================================================================

const RAY_BOY = [30, 35, 40, 45, 50, 55];

const rayFamily = (
  prefix: string,
  kodPrefix: string,
  adFn: (cm: number) => string,
  alt: string,
  fiyat45: number,
  boylar: number[],
  aciklama?: string,
  adimFiyat = 0.06,
) =>
  boylar.map((cm) =>
    M(`${prefix}-${cm}`, `${kodPrefix}-${cm}`, adFn(cm), 'ray', alt, 'takim', r10(fiyat45 * (1 + ((cm - 45) / 5) * adimFiyat)), { aciklama }),
  );

const RAY: Material[] = [
  ...rayFamily('ray-teleskopik', 'RY-TLS', (cm) => `Teleskopik Bilyalı Ray ${cm} cm`, 'Teleskopik ray', 180, [25, ...RAY_BOY],
    'Tam açılım, 45 mm, frensiz. Takım = sağ + sol.'),
  ...rayFamily('ray-teleskopik-frenli', 'RY-TLS-FR', (cm) => `Frenli Teleskopik Ray ${cm} cm`, 'Frenli teleskopik ray', 420, [25, ...RAY_BOY],
    'Soft-close, tam açılım. Takım = sağ + sol. Varsayılan ray.'),
  ...rayFamily('ray-teleskopik-push', 'RY-TLS-PSH', (cm) => `Bas-Aç (Push) Teleskopik Ray ${cm} cm`, 'Push teleskopik ray', 480, [35, 40, 45, 50, 55],
    'Kulpsuz çekmeceler için bas-aç.'),
  ...rayFamily('ray-gizli-frenli', 'RY-GZL-FR', (cm) => `Gizli Frenli Ray (Undermount) ${cm} cm`, 'Gizli ray', 850, RAY_BOY,
    'Çekmece altına gizlenen, tam açılım frenli ray. Takım = sağ + sol + kilit klipsleri.'),
  ...rayFamily('ray-gizli-push', 'RY-GZL-PSH', (cm) => `Gizli Bas-Aç (Push) Ray ${cm} cm`, 'Gizli ray', 950, [40, 45, 50],
    'Kulpsuz çekmece için gizli push-open ray.'),
  ...rayFamily('ray-metal-kutu', 'RY-MTK', (cm) => `Metal Kutu Çekmece Sistemi (Slim Box) ${cm} cm`, 'Metal kutu çekmece', 2200, RAY_BOY,
    'Frenli ray + metal yanlar dahil. Sadece taban ve arkalık kesilir.'),
  ...rayFamily('ray-samet-alfa-slim', 'RY-SMT-ALF', (cm) => `Samet Alfa Slim Metal Çekmece ${cm} cm`, 'Metal kutu çekmece', 2600, [40, 45, 50],
    'Yerli premium metal yanlı çekmece sistemi; yanlar dahil.'),
  ...rayFamily('ray-blum-tandembox', 'RY-BLM-TDB', (cm) => `Blum Tandembox Antaro ${cm} cm`, 'Premium çekmece sistemi', 5800, [40, 45, 50],
    'Blumotion frenli, metal yanlar dahil. Taban 16 mm, arkalık kesilir.'),
  ...rayFamily('ray-blum-movento', 'RY-BLM-MOV', (cm) => `Blum Movento Gizli Ray ${cm} cm`, 'Premium çekmece sistemi', 2900, [40, 45, 50],
    'Ağır yük (40-60 kg) gizli frenli ray.'),
  ...rayFamily('ray-rulmanli', 'RY-RLM', (cm) => `Rulmanlı (Tekerli) Ray ${cm} cm`, 'Rulmanlı ray', 70, [30, 35, 40, 45, 50],
    'Ekonomik, 3/4 açılım beyaz tekerli ray.'),
  M('ray-agir-yuk-60', 'RY-AGR-60', 'Ağır Yük Teleskopik Ray 60 cm (80 kg)', 'ray', 'Ağır yük ray', 'takim', 1450, {
    aciklama: 'Kiler, ağır çekmece ve fırın çekmeceleri için.',
  }),
  M('ray-agir-yuk-70', 'RY-AGR-70', 'Ağır Yük Teleskopik Ray 70 cm (80 kg)', 'ray', 'Ağır yük ray', 'takim', 1650),
  M('ray-klavye', 'RY-KLV', 'Klavye Rayı (Masa Altı)', 'ray', 'Özel ray', 'takim', 380, { aciklama: 'Çalışma masası klavye tablası rayı.' }),
  M('ray-cift-cekmece-45', 'RY-CFT-45', 'Çift Çekmece (İç Çekmece) Rayı 45 cm', 'ray', 'Özel ray', 'takim', 520, {
    aciklama: 'Kapak arkası iç çekmece için kısa yanlı frenli ray.',
  }),
];

// ============================================================================
// 8) KAPAK MEKANİZMALARI
// ============================================================================

const MEKANIZMA: Material[] = [
  ...(
    [
      [60, 55],
      [80, 60],
      [100, 65],
      [120, 70],
      [150, 80],
    ] as [number, number][]
  ).map(([n, fiyat]) =>
    M(`mek-piston-${n}n`, `MK-PST-${n}`, `Amortisörlü Kapak Pistonu ${n}N`, 'mekanizma', 'Kalkar kapak pistonu', 'adet', fiyat, {
      aciklama: 'Yukarı kalkar kapak için gazlı piston; kapak başına 2 adet.',
    }),
  ),
  M('mek-piston-frenli-100n', 'MK-PST-FR100', 'Frenli (Yavaş Kapanan) Kapak Pistonu 100N', 'mekanizma', 'Kalkar kapak pistonu', 'adet', 110),
  M('mek-dusen-makas', 'MK-DSN', 'Düşen Kapak Makası (Frenli)', 'mekanizma', 'Düşer kapak', 'takim', 420, {
    aciklama: 'Aşağı açılan kapak için frenli makas takımı (sağ + sol).',
  }),
  M('mek-kalkar-kol', 'MK-KLK-HK', 'Yukarı Kalkar Kol Mekanizması (HK Tipi, Yerli)', 'mekanizma', 'Kalkar mekanizma', 'takim', 1200, {
    aciklama: 'Her konumda duran frenli kalkar kapak kolu.',
  }),
  M('mek-katlanir', 'MK-KTL-HF', 'Katlanır Kapak Mekanizması (HF Tipi, Yerli)', 'mekanizma', 'Katlanır kapak', 'takim', 2400, {
    aciklama: 'İki parçalı yukarı katlanan kapak takımı.',
  }),
  M('mek-dikey-kalkar', 'MK-DKY-HL', 'Dikey / Paralel Kalkar Mekanizma (HL/HS Tipi, Yerli)', 'mekanizma', 'Dikey kalkar', 'takim', 2800),
  M('mek-aventos-hks', 'MK-BLM-HKS', 'Blum Aventos HK-S', 'mekanizma', 'Blum Aventos', 'takim', 2800, { aciklama: 'Küçük üst dolap kalkar kapak.' }),
  M('mek-aventos-hk', 'MK-BLM-HK', 'Blum Aventos HK Top', 'mekanizma', 'Blum Aventos', 'takim', 4200),
  M('mek-aventos-hl', 'MK-BLM-HL', 'Blum Aventos HL Top (Paralel Kalkar)', 'mekanizma', 'Blum Aventos', 'takim', 7500),
  M('mek-aventos-hs', 'MK-BLM-HS', 'Blum Aventos HS Top (Kavisli Kalkar)', 'mekanizma', 'Blum Aventos', 'takim', 7200),
  M('mek-aventos-hf', 'MK-BLM-HF', 'Blum Aventos HF Top (Katlanır)', 'mekanizma', 'Blum Aventos', 'takim', 6800),
  // Sürgü
  M('mek-surgu-2kapak', 'MK-SRG-2', 'Sürgülü Gardırop Ray Takımı 2 Kapak (Alüminyum)', 'mekanizma', 'Sürgülü kapak', 'takim', 1400, {
    aciklama: 'Üst + alt alüminyum ray (dolap boyu), makaralar ve stoperler. 2 kapak.',
  }),
  M('mek-surgu-3kapak', 'MK-SRG-3', 'Sürgülü Gardırop Ray Takımı 3 Kapak (Alüminyum)', 'mekanizma', 'Sürgülü kapak', 'takim', 2100),
  M('mek-surgu-frenli-2kapak', 'MK-SRG-FR2', 'Frenli Sürgülü Gardırop Ray Takımı 2 Kapak', 'mekanizma', 'Sürgülü kapak', 'takim', 2600),
  M('mek-surgu-ust-ray', 'MK-SRG-UST', 'Sürgü Üst Ray Alüminyum (Çift Kanal)', 'mekanizma', 'Sürgülü kapak', 'mt', 320),
  M('mek-surgu-alt-ray', 'MK-SRG-ALT', 'Sürgü Alt Ray Alüminyum (Çift Kanal)', 'mekanizma', 'Sürgülü kapak', 'mt', 260),
  M('mek-surgu-kapak-profili', 'MK-SRG-PRF', 'Gardırop Sürgü Kapak Profili Alüminyum (Çerçeve)', 'mekanizma', 'Sürgülü kapak', 'mt', 380, {
    aciklama: 'Sürgü kapak kasası; dikey kulp + yatay üst/alt profiller.',
  }),
  M('mek-surgu-makara-seti', 'MK-SRG-MKR', 'Sürgü Kapak Makara Seti (1 Kapak)', 'mekanizma', 'Sürgülü kapak', 'takim', 280),
  M('mek-akordiyon', 'MK-AKR', 'Katlanır (Akordiyon) Kapak Takımı', 'mekanizma', 'Katlanır kapak', 'takim', 1600, {
    aciklama: 'Yan katlanan 2 kanat için üst ray + taşıyıcılar.',
  }),
  M('mek-pocket-kapak', 'MK-PCK', 'Gömme (Pocket) Kapak Sistemi', 'mekanizma', 'Özel kapak', 'takim', 5200, {
    aciklama: 'Kapak açılıp gövde yanına kayar (TV / kahve köşesi).',
  }),
  // Bas-aç ve küçük parçalar
  M('mek-tip-on', 'MK-TPON', 'Blum Tip-On Bas-Aç İtici', 'mekanizma', 'Bas-aç', 'adet', 180),
  M('mek-bas-ac', 'MK-BAC', 'Bas-Aç İtici (Mıknatıslı, Yerli)', 'mekanizma', 'Bas-aç', 'adet', 60),
  M('mek-kapak-stoperi', 'MK-STP', 'Kapak Stoperi (Açılma Sınırlayıcı)', 'mekanizma', 'Kapak aksesuarı', 'adet', 25),
  M('mek-damper', 'MK-DMP', 'Frenli Kapak Amortisörü (Tak-Çıkar Damper)', 'mekanizma', 'Kapak aksesuarı', 'adet', 35, {
    aciklama: 'Frensiz menteşeli kapaklara sonradan fren ekler.',
  }),
  M('mek-miknatisli-tutucu', 'MK-MKN', 'Mıknatıslı Kapak Tutucu', 'mekanizma', 'Kapak aksesuarı', 'adet', 20),
  M('mek-kapak-kilidi', 'MK-KLT', 'Mobilya Kapak Kilidi', 'mekanizma', 'Kilit', 'adet', 90),
  M('mek-cekmece-kilidi', 'MK-KLT-CK', 'Çekmece Kilidi', 'mekanizma', 'Kilit', 'adet', 90),
  M('mek-merkezi-kilit', 'MK-KLT-MRK', 'Merkezi Çekmece Kilit Sistemi', 'mekanizma', 'Kilit', 'takim', 450),
  M('mek-cocuk-kilidi', 'MK-KLT-COC', 'Çocuk Emniyet Kilidi (Gizli)', 'mekanizma', 'Kilit', 'adet', 45),
  M('mek-kapak-surgusu', 'MK-SRGU', 'Kapak Sürgüsü (Gizli Sürgü)', 'mekanizma', 'Kapak aksesuarı', 'adet', 30),
];

// ============================================================================
// 9) KULPLAR
// ============================================================================

interface KulpRenk {
  k: string;
  kod: string;
  ad: string;
  carpan: number;
}
const KULP_RENK: KulpRenk[] = [
  { k: 'inox', kod: 'INX', ad: 'İnox', carpan: 1 },
  { k: 'krom', kod: 'KRM', ad: 'Krom', carpan: 0.9 },
  { k: 'siyah', kod: 'SYH', ad: 'Siyah Mat', carpan: 1.1 },
  { k: 'altin', kod: 'ALT', ad: 'Altın (Fırçalı)', carpan: 1.35 },
];
const KULP_BOY: [number, number][] = [
  [96, 45],
  [128, 55],
  [160, 65],
  [192, 75],
  [224, 85],
  [256, 95],
  [320, 115],
];

const KULP: Material[] = [
  ...KULP_BOY.flatMap(([mm, fiyat]) =>
    KULP_RENK.map((c) =>
      M(`kulp-${mm}-${c.k}`, `KL-${mm}-${c.kod}`, `Kulp ${mm} mm ${c.ad}`, 'kulp', 'Çubuk kulp', 'adet', r10(fiyat * c.carpan) || 5, {
        aciklama: `Delik arası ${mm} mm.`,
      }),
    ),
  ),
  M('kulp-448-inox', 'KL-448-INX', 'Kulp 448 mm İnox', 'kulp', 'Çubuk kulp', 'adet', 160, { aciklama: 'Delik arası 448 mm. Boy dolap / gardırop.' }),
  M('kulp-448-siyah', 'KL-448-SYH', 'Kulp 448 mm Siyah Mat', 'kulp', 'Çubuk kulp', 'adet', 175),
  M('kulp-448-altin', 'KL-448-ALT', 'Kulp 448 mm Altın', 'kulp', 'Çubuk kulp', 'adet', 220),
  // Düğme
  M('kulp-dugme-inox', 'KL-DGM-INX', 'Düğme Kulp İnox', 'kulp', 'Düğme kulp', 'adet', 35),
  M('kulp-dugme-siyah', 'KL-DGM-SYH', 'Düğme Kulp Siyah Mat', 'kulp', 'Düğme kulp', 'adet', 40),
  M('kulp-dugme-altin', 'KL-DGM-ALT', 'Düğme Kulp Altın', 'kulp', 'Düğme kulp', 'adet', 50),
  M('kulp-dugme-seramik', 'KL-DGM-SRM', 'Düğme Kulp Seramik (Country)', 'kulp', 'Düğme kulp', 'adet', 55),
  // Gömme
  M('kulp-gomme-128', 'KL-GMM-128', 'Gömme Kulp 128 mm', 'kulp', 'Gömme kulp', 'adet', 90, { aciklama: 'Kapağa frezelenerek gömülür.' }),
  M('kulp-gomme-yuvarlak', 'KL-GMM-YVR', 'Gömme Kulp Yuvarlak (Sürgü Kapak)', 'kulp', 'Gömme kulp', 'adet', 60),
  M('kulp-gomme-siyah-160', 'KL-GMM-160-SYH', 'Gömme Kulp 160 mm Siyah', 'kulp', 'Gömme kulp', 'adet', 120),
  // Profil kulp
  M('kulp-profil-aluminyum', 'KL-PRF-ALU', 'Alüminyum Profil Kulp (Kapak Üstü)', 'kulp', 'Profil kulp', 'mt', 280, {
    aciklama: 'Kapak üst kenarına vidalanan / geçen boydan profil kulp.',
  }),
  M('kulp-profil-aluminyum-siyah', 'KL-PRF-ALU-SYH', 'Alüminyum Profil Kulp Siyah', 'kulp', 'Profil kulp', 'mt', 320),
  M('kulp-j-profil', 'KL-J-PRF', 'J Profil Kulp (Kapak Üstü) İnox Görünüm', 'kulp', 'Profil kulp', 'mt', 320),
  M('kulp-j-profil-siyah', 'KL-J-PRF-SYH', 'J Profil Kulp Siyah', 'kulp', 'Profil kulp', 'mt', 360),
  M('kulp-kenar-mini', 'KL-KNR-50', 'Kapak Kenar Kulpu (Edge Pull) 50 mm', 'kulp', 'Profil kulp', 'adet', 60),
  // Deri
  M('kulp-deri-128', 'KL-DRI-128', 'Deri Kulp 128 mm', 'kulp', 'Deri kulp', 'adet', 110),
  M('kulp-deri-256', 'KL-DRI-256', 'Deri Kulp 256 mm', 'kulp', 'Deri kulp', 'adet', 160),
  // Gardırop boy kulp
  ...(
    [
      [600, 320],
      [800, 400],
      [1000, 480],
    ] as [number, number][]
  ).flatMap(([mm, fiyat]) => [
    M(`kulp-boy-${mm}-inox`, `KL-BOY-${mm}-INX`, `Gardırop Boy Kulp ${mm} mm İnox`, 'kulp', 'Boy kulp', 'adet', fiyat),
    M(`kulp-boy-${mm}-siyah`, `KL-BOY-${mm}-SYH`, `Gardırop Boy Kulp ${mm} mm Siyah`, 'kulp', 'Boy kulp', 'adet', r10(fiyat * 1.1)),
  ]),
  M('kulp-antik-bronz-128', 'KL-128-ANT', 'Kulp 128 mm Antik Bronz (Klasik)', 'kulp', 'Klasik kulp', 'adet', 85),
];

// ============================================================================
// 10) AYAKLAR VE BAZA
// ============================================================================

const AYAK: Material[] = [
  ...(
    [
      [8, 12],
      [10, 14],
      [12, 16],
      [14, 18],
      [15, 19],
    ] as [number, number][]
  ).map(([cm, fiyat]) =>
    M(`ayak-plastik-${cm}`, `AY-PLS-${cm}`, `Plastik Ayarlı Dolap Ayağı ${cm} cm`, 'ayak', 'Plastik ayarlı ayak', 'adet', fiyat, {
      aciklama: 'Ayarlı, baza klipsine uygun mutfak ayağı.',
    }),
  ),
  M('ayak-krom-10', 'AY-KRM-10', 'Krom Ayak 10 cm (Ayarlı)', 'ayak', 'Metal ayak', 'adet', 55),
  M('ayak-krom-15', 'AY-KRM-15', 'Krom Ayak 15 cm (Ayarlı)', 'ayak', 'Metal ayak', 'adet', 65),
  M('ayak-metal-siyah-10', 'AY-MTS-10', 'Siyah Metal Ayak 10 cm', 'ayak', 'Metal ayak', 'adet', 70),
  M('ayak-metal-siyah-15', 'AY-MTS-15', 'Siyah Metal Ayak 15 cm', 'ayak', 'Metal ayak', 'adet', 85),
  M('ayak-kare-metal-10', 'AY-KRE-10', 'Kare Metal Ayak 10 cm', 'ayak', 'Metal ayak', 'adet', 80),
  M('ayak-altin-12', 'AY-ALT-12', 'Altın Metal Ayak 12 cm', 'ayak', 'Metal ayak', 'adet', 120),
  M('ayak-ahsap-konik-10', 'AY-AHS-10', 'Ahşap Konik Ayak 10 cm (Komidin/Şifonyer)', 'ayak', 'Ahşap ayak', 'adet', 70),
  M('ayak-ahsap-konik-15', 'AY-AHS-15', 'Ahşap Konik Ayak 15 cm (Komidin/Şifonyer)', 'ayak', 'Ahşap ayak', 'adet', 85),
  M('ayak-tekerlek', 'AY-TKR', 'Döner Tekerlek (Frensiz)', 'ayak', 'Tekerlek', 'adet', 50),
  M('ayak-tekerlek-frenli', 'AY-TKR-FR', 'Döner Tekerlek (Frenli)', 'ayak', 'Tekerlek', 'adet', 60),
  M('ayak-plastik-kisa', 'AY-PLS-KSA', 'Plastik Mobilya Tapası / Kısa Ayak 2 cm', 'ayak', 'Plastik ayarlı ayak', 'adet', 4),
  // Baza
  M('baza-aluminyum-10', 'BZ-ALU-10', 'Alüminyum Baza 10 cm', 'ayak', 'Baza', 'mt', 260, { aciklama: 'Eloksal alüminyum mutfak bazası.' }),
  M('baza-aluminyum-12', 'BZ-ALU-12', 'Alüminyum Baza 12 cm', 'ayak', 'Baza', 'mt', 300),
  M('baza-aluminyum-15', 'BZ-ALU-15', 'Alüminyum Baza 15 cm', 'ayak', 'Baza', 'mt', 360),
  M('baza-pvc-beyaz-10', 'BZ-PVC-10-BYZ', 'PVC Baza 10 cm Beyaz', 'ayak', 'Baza', 'mt', 120),
  M('baza-pvc-antrasit-10', 'BZ-PVC-10-ANT', 'PVC Baza 10 cm Antrasit', 'ayak', 'Baza', 'mt', 130),
  M('baza-klipsi', 'BZ-KLP', 'Baza Klipsi (Ayak Bağlantı)', 'ayak', 'Baza aksesuarı', 'paket', 150, {
    paketAdet: 50, aciklama: 'Bazayı plastik ayağa tutturan klips.',
  }),
  M('baza-kose-birlestirme', 'BZ-KOSE', 'Baza Köşe Birleştirme Parçası (90°)', 'ayak', 'Baza aksesuarı', 'adet', 45),
  M('baza-ek-parcasi', 'BZ-EK', 'Baza Düz Ek Parçası', 'ayak', 'Baza aksesuarı', 'adet', 25),
  M('baza-uc-kapagi', 'BZ-UC', 'Baza Uç Kapağı', 'ayak', 'Baza aksesuarı', 'adet', 20),
  M('baza-contasi', 'BZ-CNT', 'Baza Alt Contası (Fitil)', 'ayak', 'Baza aksesuarı', 'mt', 18),
];

// ============================================================================
// 11) VİDA / ÇİVİ / DÜBEL / BAĞLANTI (paket – paketAdet)
// ============================================================================

const pk = (id: string, kod: string, ad: string, alt: string, fiyat: number, paketAdet: number, aciklama?: string) =>
  M(id, kod, ad, 'vida', alt, 'paket', fiyat, { paketAdet, aciklama });

const SUNTA_VIDA: [string, number, number][] = [
  // [ölçü, fiyat, paketAdet]
  ['3x12', 160, 1000],
  ['3x16', 180, 1000],
  ['3.5x16', 200, 1000],
  ['3.5x25', 240, 1000],
  ['3.5x30', 260, 1000],
  ['3.5x35', 280, 1000],
  ['4x16', 230, 1000],
  ['4x20', 250, 1000],
  ['4x25', 280, 1000],
  ['4x30', 310, 1000],
  ['4x35', 350, 1000],
  ['4x40', 380, 1000],
  ['4x45', 420, 1000],
  ['4x50', 450, 1000],
  ['4x60', 280, 500],
  ['5x50', 320, 500],
  ['5x60', 360, 500],
  ['5x70', 420, 500],
  ['5x80', 460, 500],
];

const VIDA_KULLANIM: Record<string, string> = {
  '3.5x16': 'Menteşe, ray, ayak ve aksesuar montajı.',
  '4x30': 'Çekmece kutusu birleşimi.',
  '4x40': 'Kuşak ve sabit raf bağlantısı.',
  '4x50': 'Gövde birleşimi (yan-alt-üst-dikme).',
  '5x60': 'Dübelli duvar montajı.',
};

const VIDA: Material[] = [
  ...SUNTA_VIDA.map(([o, fiyat, adet]) =>
    pk(`vida-${o}`, `VD-${o.replace('.', '')}`, `Sunta Vidası ${o} (${adet}'li)`, 'Sunta vidası', fiyat, adet,
      VIDA_KULLANIM[o] ?? 'Sarı (galvaniz) sunta vidası, yıldız başlı.'),
  ),
  // Kulp vidaları
  ...(
    [
      ['m4x22', 'M4x22', 85],
      ['m4x25', 'M4x25', 90],
      ['m4x30', 'M4x30', 95],
      ['m4x35', 'M4x35', 105],
      ['m4x40', 'M4x40', 115],
      ['m4x45', 'M4x45', 130],
    ] as [string, string, number][]
  ).map(([k, ad, fiyat]) =>
    pk(`vida-kulp-${k}`, `VD-KLP-${ad.toUpperCase()}`, `Kulp Vidası ${ad} (100'lü)`, 'Kulp vidası', fiyat, 100,
      k === 'm4x25' ? '18 mm kapak için standart kulp vidası.' : 'Kalın kapak / arkadan somunlu montaj için.'),
  ),
  pk('vida-arkalik-3x20', 'VD-ARK-320', "Arkalık Vidası 3x20 Pullu (1000'li)", 'Arkalık bağlantı', 200, 1000),
  pk('civi-arkalik-zimba', 'CV-ARK-ZMB', "Arkalık Zımba Çivisi (Brad) 20 mm (5000'li)", 'Arkalık bağlantı', 220, 5000, 'Havalı tabanca ile çakma arkalık.'),
  pk('civi-20mm', 'CV-20', "Arkalık Çivisi 20 mm (1000'li)", 'Arkalık bağlantı', 120, 1000),
  pk('civi-cekmece-taban', 'CV-CKM-TBN', "Çekmece Tabanı Zımba Çivisi 25 mm (5000'li)", 'Çivi / zımba', 240, 5000),
  pk('zimba-teli-14', 'ZM-14', "Zımba Teli 14 mm (80 Seri, 5000'li)", 'Çivi / zımba', 150, 5000, 'Döşeme, sünger ve kumaş tutturma.'),
  // Raf pimleri
  pk('raf-pimi-5mm', 'RP-5-MTL', "Raf Pimi 5 mm Metal (1000'li)", 'Raf pimi', 600, 1000, 'Ayarlı raf taşıma, raf başına 4 adet.'),
  pk('raf-pimi-5mm-plastik', 'RP-5-PLS', "Raf Pimi 5 mm Plastik Şeffaf (1000'li)", 'Raf pimi', 280, 1000),
  pk('raf-pimi-kilitli', 'RP-5-KLT', "Raf Pimi Kilitli (Raf Sabitlemeli) (100'lü)", 'Raf pimi', 250, 100),
  pk('raf-pimi-cam', 'RP-CAM', "Cam Raf Taşıyıcı Pim (Vantuzlu) (100'lü)", 'Raf pimi', 350, 100),
  // Bağlantı elemanları
  pk('modul-birlestirme-vidasi', 'BG-MDL', "Modül Birleştirme Vidası (İkiz Somunlu) (100'lü)", 'Bağlantı elemanı', 250, 100, 'Yan yana modülleri birbirine bağlar.'),
  pk('minifix-set', 'BG-MNFX', "Minifix Seti (Gövde + Pim) (100'lü)", 'Bağlantı elemanı', 650, 100, 'Sökülüp takılabilen gövde birleşimi.'),
  pk('eksantrik-baglanti', 'BG-EKS', "Eksantrik Bağlantı (Rafix) (100'lü)", 'Bağlantı elemanı', 550, 100),
  pk('konfirmat-7x50', 'BG-KNF-750', "Konfirmat Vidası 7x50 (500'lü)", 'Bağlantı elemanı', 380, 500),
  pk('dubel-8x30', 'DB-AHS-830', "Ahşap Kavela Dübel 8x30 (1000'li)", 'Ahşap dübel', 220, 1000),
  pk('dubel-8x40', 'DB-AHS-840', "Ahşap Kavela Dübel 8x40 (1000'li)", 'Ahşap dübel', 260, 1000),
  pk('dubel-8x50', 'DB-AHS-850', "Ahşap Kavela Dübel 8x50 (1000'li)", 'Ahşap dübel', 300, 1000),
  pk('kosebent-plastik', 'BG-KSB-PLS', "Plastik Köşebent (100'lü)", 'Köşebent', 180, 100),
  pk('kosebent-metal', 'BG-KSB-MTL', "Metal Köşebent (100'lü)", 'Köşebent', 350, 100),
  pk('duvar-baglanti-l', 'BG-DVR-L', "Duvar Bağlantı L Demiri (Devrilme Emniyeti) (100'lü)", 'Köşebent', 250, 100, 'Boy dolapları duvara sabitler.'),
  pk('kapak-tamponu', 'BG-TMP', "Kapak Tamponu Şeffaf Silikon (1000'li)", 'Kapak aksesuarı', 180, 1000),
  // Duvar dübelleri
  pk('dubel-plastik-6', 'DB-PLS-6', "Plastik Dübel 6 mm (100'lü)", 'Duvar dübeli', 45, 100),
  pk('dubel-plastik-8', 'DB-PLS-8', "Plastik Dübel 8 mm (100'lü)", 'Duvar dübeli', 60, 100),
  pk('dubel-plastik-10', 'DB-PLS-10', "Plastik Dübel 10 mm (100'lü)", 'Duvar dübeli', 80, 100),
  pk('dubel-celik-8', 'DB-CLK-8', "Çelik Dübel 8x60 (50'li)", 'Duvar dübeli', 350, 50, 'Ağır asma dolaplar ve beton duvar.'),
  pk('dubel-alcipan', 'DB-ALC', "Alçıpan Dübeli (Kelebek) (100'lü)", 'Duvar dübeli', 180, 100),
  // Kör tapa
  ...(['beyaz', 'antrasit', 'krem', 'ceviz', 'mese'] as DK[]).map((k) =>
    pk(`kor-tapa-${k}`, `KT-${DEKOR[k].kod}`, `Kör Tapa (Vida Kapağı) ${DEKOR[k].ad} (1000'li)`, 'Kör tapa', 150, 1000),
  ),
  // Asma dolap
  M('ust-dolap-aski-aparati', 'BG-ASK-APR', 'Üst Dolap Askı Aparatı (Ayarlı)', 'vida', 'Asma dolap', 'adet', 45, {
    aciklama: 'Üst dolap başına 2 adet; askı rayına oturur.',
  }),
  M('ust-dolap-aski-rayi', 'BG-ASK-RAY', 'Üst Dolap Askı Rayı (Metal)', 'vida', 'Asma dolap', 'mt', 95),
];

// ============================================================================
// 12) ALÜMİNYUM PROFİLLER
// ============================================================================

const PROFIL: Material[] = [
  M('profil-gola-c', 'PR-GOL-C', 'Gola Profili C (Ara Çekmece)', 'profil', 'Gola profili', 'mt', 420, { aciklama: 'Kulpsuz mutfak ara çekmece profili.' }),
  M('profil-gola-l', 'PR-GOL-L', 'Gola Profili L (Üst)', 'profil', 'Gola profili', 'mt', 360),
  M('profil-gola-c-siyah', 'PR-GOL-C-SYH', 'Gola Profili C Siyah', 'profil', 'Gola profili', 'mt', 480),
  M('profil-gola-l-siyah', 'PR-GOL-L-SYH', 'Gola Profili L Siyah', 'profil', 'Gola profili', 'mt', 420),
  M('profil-gola-dikey', 'PR-GOL-DKY', 'Gola Dikey Profil (Boy Dolap)', 'profil', 'Gola profili', 'mt', 450),
  M('profil-gola-ic-kose', 'PR-GOL-KSE', 'Gola İç/Dış Köşe Birleştirme', 'profil', 'Gola aksesuarı', 'adet', 60),
  M('profil-gola-uc-kapak', 'PR-GOL-UC', 'Gola Uç Kapağı', 'profil', 'Gola aksesuarı', 'adet', 35),
  M('profil-cam-cerceve', 'PR-CAM-CRC', 'Cam Kapak Alüminyum Çerçeve Profili 20 mm', 'profil', 'Cam kapak profili', 'mt', 380, {
    aciklama: 'Kapak çevresi (2×(E+B)) kadar; köşe takozları ile birleşir.',
  }),
  M('profil-cam-cerceve-siyah', 'PR-CAM-CRC-SYH', 'Cam Kapak Alüminyum Çerçeve Profili Siyah', 'profil', 'Cam kapak profili', 'mt', 440),
  M('profil-cam-cerceve-ince', 'PR-CAM-CRC-45', 'İnce Cam Çerçeve Profili 45° (Vitrin)', 'profil', 'Cam kapak profili', 'mt', 420),
  M('profil-cam-kose-takozu', 'PR-CAM-KSE', 'Cam Çerçeve Köşe Takozu', 'profil', 'Cam kapak profili', 'adet', 25),
  M('profil-kulp-kapak-arasi', 'PR-KLP-ARA', 'Kapak Arası Gizli Kulp Profili', 'profil', 'Kulp profili', 'mt', 300),
  M('profil-led-sivaustu', 'PR-LED-SVU', 'LED Profili Sıva Üstü (Difüzörlü)', 'profil', 'LED profili', 'mt', 120),
  M('profil-led-gomme', 'PR-LED-GMM', 'LED Profili Gömme (Difüzörlü)', 'profil', 'LED profili', 'mt', 140),
  M('profil-led-kose', 'PR-LED-KSE', 'LED Profili Köşe 45°', 'profil', 'LED profili', 'mt', 150),
  M('profil-led-raf', 'PR-LED-RAF', 'LED Raf Önü Profili', 'profil', 'LED profili', 'mt', 180),
  M('profil-baza-baglanti', 'PR-BZ-BGL', 'Alüminyum Baza Bağlantı Parçası', 'profil', 'Baza profili', 'adet', 40),
  M('profil-tezgah-arasi-cita', 'PR-TZG-CTA', 'Tezgah Arası Alüminyum Bitiş Çıtası', 'profil', 'Tezgah arası', 'mt', 140),
  M('profil-kapak-kenar', 'PR-KPK-KNR', 'Alüminyum Kapak Kenar Profili', 'profil', 'Kapak profili', 'mt', 180),
  M('profil-surgu-kapak-dikey', 'PR-SRG-DKY', 'Gardırop Sürgü Kapak Dikey (Kulp) Profili', 'profil', 'Sürgü kapak profili', 'mt', 420),
  M('profil-surgu-kapak-yatay-ust', 'PR-SRG-YUS', 'Gardırop Sürgü Kapak Yatay Üst Profili', 'profil', 'Sürgü kapak profili', 'mt', 260),
  M('profil-surgu-kapak-yatay-alt', 'PR-SRG-YAL', 'Gardırop Sürgü Kapak Yatay Alt Profili', 'profil', 'Sürgü kapak profili', 'mt', 260),
  M('profil-surgu-kapak-ara', 'PR-SRG-ARA', 'Sürgü Kapak Ara Kayıt (Bölme) Profili', 'profil', 'Sürgü kapak profili', 'mt', 200),
  M('profil-duvar-bitis', 'PR-DVR-BTS', 'Duvar Bitiş / Dolgu Profili', 'profil', 'Bitiş profili', 'mt', 160),
];

// ============================================================================
// 13) AKSESUARLAR (gardırop / vestiyer / mutfak / aydınlatma)
// ============================================================================

const aks = (id: string, kod: string, ad: string, alt: string, birim: PriceUnit, fiyat: number, aciklama?: string) =>
  M(id, kod, ad, 'aksesuar', alt, birim, fiyat, { aciklama });

const AKSESUAR: Material[] = [
  // Gardırop
  aks('aks-aski-borusu-oval', 'AK-ASB-OVL', 'Askı Borusu Oval Krom', 'Gardırop', 'mt', 110, 'Gardırop elbise askı borusu.'),
  aks('aks-aski-borusu-oval-siyah', 'AK-ASB-OVL-SYH', 'Askı Borusu Oval Siyah Mat', 'Gardırop', 'mt', 140),
  aks('aks-aski-borusu-yuvarlak', 'AK-ASB-YVR', 'Askı Borusu Yuvarlak Krom Ø25', 'Gardırop', 'mt', 90),
  aks('aks-boru-tasiyici', 'AK-BRT', 'Askı Borusu Taşıyıcı (Rozet)', 'Gardırop', 'adet', 15, 'Boru başına 2 adet.'),
  aks('aks-boru-orta-tasiyici', 'AK-BRT-ORT', 'Askı Borusu Orta Taşıyıcı (Raftan Sarkan)', 'Gardırop', 'adet', 45),
  aks('aks-aski-kancasi', 'AK-KNC', 'Askı Kancası (Vestiyer / Duvar)', 'Gardırop', 'adet', 35),
  aks('aks-oturak-sunger', 'AK-OTR-SNG', 'Oturak Süngeri 5 cm (32 DNS)', 'Vestiyer', 'm2', 850),
  aks('aks-oturak-kumas', 'AK-OTR-KMS', 'Oturak Döşeme Kumaşı / Deri', 'Vestiyer', 'm2', 450),
  aks('aks-ayakkabi-rafi-metal', 'AK-AYK-MTL', 'Metal Ayakkabı Rafı (Tel) 60 cm', 'Ayakkabılık', 'adet', 380),
  aks('aks-ayakkabilik-teli-cekme', 'AK-AYK-CKM', 'Çekme Ayakkabılık Teli (Raylı)', 'Ayakkabılık', 'adet', 950),
  aks('aks-klapa-ayakkabilik-mek', 'AK-AYK-KLP', 'Klapa Ayakkabılık Mekanizması (Takım)', 'Ayakkabılık', 'takim', 260, 'Devrilir ayakkabılık kapağı için 2 li takım.'),
  aks('aks-pantolonluk-cekme', 'AK-PNT', 'Pantolonluk (Çekme, Raylı)', 'Gardırop', 'adet', 1400),
  aks('aks-kravatlik', 'AK-KRV', 'Kravatlık (Çekme)', 'Gardırop', 'adet', 650),
  aks('aks-kemerlik', 'AK-KMR', 'Kemerlik (Çekme)', 'Gardırop', 'adet', 650),
  aks('aks-asansorlu-aski-80', 'AK-ASN-80', 'Asansörlü Askı 80-115 cm', 'Gardırop', 'adet', 2100, 'Yüksek askı alanını aşağı indiren mekanizma.'),
  aks('aks-asansorlu-aski-100', 'AK-ASN-100', 'Asansörlü Askı 100-150 cm', 'Gardırop', 'adet', 2400),
  aks('aks-gardirop-sepet-60', 'AK-GSP-60', 'Gardırop Çekme Tel Sepet 60 cm', 'Gardırop', 'adet', 900),
  aks('aks-gardirop-sepet-80', 'AK-GSP-80', 'Gardırop Çekme Tel Sepet 80 cm', 'Gardırop', 'adet', 1050),
  aks('aks-gardirop-sepet-90', 'AK-GSP-90', 'Gardırop Çekme Tel Sepet 90 cm', 'Gardırop', 'adet', 1150),
  aks('aks-cekme-ayna', 'AK-CKM-AYN', 'Çekme Boy Aynası (Raylı, Gardırop İçi)', 'Gardırop', 'adet', 1800),
  aks('aks-mucevherlik', 'AK-MCV', 'Mücevherlik Çekmece İçliği (Kadife)', 'Gardırop', 'adet', 550),
  aks('aks-gardirop-aydinlatma', 'AK-GRD-LED', 'Gardırop İçi Sensörlü Askı Borusu LED', 'Aydınlatma', 'mt', 420),
  // Mutfak – kaşıklık
  ...(
    [
      [30, 180],
      [40, 210],
      [45, 230],
      [60, 280],
      [80, 360],
      [90, 420],
    ] as [number, number][]
  ).map(([cm, f]) => aks(`aks-kasiklik-${cm}`, `AK-KSK-${cm}`, `Kaşıklık ${cm} cm (Çekmece İçi)`, 'Mutfak – çekmece içi', 'adet', f, 'Kesilebilir plastik kaşıklık.')),
  aks('aks-cekmece-bolucu', 'AK-CKM-BLC', 'Çekmece Bölücü (Ayarlı, Takım)', 'Mutfak – çekmece içi', 'takim', 250),
  aks('aks-tabak-rafi', 'AK-TBK', 'Çekmece İçi Tabak Tutucu (Peg Board)', 'Mutfak – çekmece içi', 'adet', 450),
  aks('aks-baharatlik', 'AK-BHR', 'Baharatlık (Çekmece İçi Eğimli)', 'Mutfak – çekmece içi', 'adet', 750),
  aks('aks-tepsilik', 'AK-TPS', 'Tepsilik Bölme Teli (Dikey)', 'Mutfak', 'adet', 650),
  // Mutfak – çöp / evye
  aks('aks-cop-kovasi-tek', 'AK-COP-1', 'Çöp Kovası Tek Gözlü (Çekmeceli)', 'Mutfak – evye altı', 'adet', 650),
  aks('aks-cop-kovasi-cift', 'AK-COP-2', 'Çöp Kovası Çift Gözlü (Çekmeceli)', 'Mutfak – evye altı', 'adet', 1350),
  aks('aks-cop-kovasi-3lu', 'AK-COP-3', 'Geri Dönüşüm Çöp Kovası 3 Gözlü (Raylı)', 'Mutfak – evye altı', 'adet', 2800),
  aks('aks-cop-kovasi-kapak-alti', 'AK-COP-KPK', 'Kapak Altı Çöp Kovası (Kapak Açılınca Açılır)', 'Mutfak – evye altı', 'adet', 450),
  aks('aks-evye-alti-tepsi-80', 'AK-EVT-80', 'Evye Altı Alüminyum Tepsi 80 cm', 'Mutfak – evye altı', 'adet', 450),
  aks('aks-evye-alti-tepsi-90', 'AK-EVT-90', 'Evye Altı Alüminyum Tepsi 90 cm', 'Mutfak – evye altı', 'adet', 500),
  aks('aks-deterjanlik', 'AK-DTR', 'Deterjanlık (Çekme Tel Sepet)', 'Mutfak – evye altı', 'adet', 1250),
  aks('aks-havluluk', 'AK-HVL', 'Havluluk (Çekme, Kapak İçi)', 'Mutfak', 'adet', 450),
  // Bulaşıklık
  aks('aks-bulasiklik-60', 'AK-BLS-60', 'Bulaşıklık Süzgeci 60 cm (Üst Dolap)', 'Mutfak – üst dolap', 'adet', 1200),
  aks('aks-bulasiklik-80', 'AK-BLS-80', 'Bulaşıklık Süzgeci 80 cm (Üst Dolap)', 'Mutfak – üst dolap', 'adet', 1450),
  aks('aks-bulasiklik-90', 'AK-BLS-90', 'Bulaşıklık Süzgeci 90 cm (Üst Dolap)', 'Mutfak – üst dolap', 'adet', 1600),
  // Köşe
  aks('aks-kose-karusel', 'AK-KRS', 'Köşe Karuseli (Frizbi) 3/4', 'Mutfak – köşe', 'takim', 2200),
  aks('aks-kose-yarim-ay', 'AK-YAY', 'Yarım Ay Köşe Sepeti (Çıkar-Döner)', 'Mutfak – köşe', 'takim', 3400),
  aks('aks-sihirli-kose', 'AK-SHK', 'Sihirli Köşe (Magic Corner)', 'Mutfak – köşe', 'takim', 7800),
  // Kiler / şişelik
  aks('aks-kiler-30', 'AK-KLR-30', 'Kiler Ünitesi Sepet Mekanizması 30 cm', 'Mutfak – boy dolap', 'takim', 5800),
  aks('aks-kiler-40', 'AK-KLR-40', 'Kiler Ünitesi Sepet Mekanizması 40 cm', 'Mutfak – boy dolap', 'takim', 6400),
  aks('aks-kiler-45', 'AK-KLR-45', 'Kiler Ünitesi Sepet Mekanizması 45 cm', 'Mutfak – boy dolap', 'takim', 6800),
  aks('aks-siselik-15', 'AK-SSL-15', 'Şişelik (Çekme) 15 cm', 'Mutfak – çekme', 'takim', 1300),
  aks('aks-siselik-20', 'AK-SSL-20', 'Şişelik (Çekme) 20 cm', 'Mutfak – çekme', 'takim', 1450),
  aks('aks-siselik-30', 'AK-SSL-30', 'Şişelik (Çekme) 30 cm', 'Mutfak – çekme', 'takim', 1650),
  aks('aks-tel-sepet-cekme-60', 'AK-TSP-60', 'Çekme Tel Sepet (Tencere) 60 cm', 'Mutfak – çekme', 'takim', 1100),
  // Havalandırma
  aks('aks-firin-izgara', 'AK-IZG-FRN', 'Ankastre Fırın Havalandırma Izgarası', 'Mutfak – havalandırma', 'adet', 150),
  aks('aks-buzdolabi-izgara', 'AK-IZG-BZD', 'Buzdolabı Havalandırma Izgarası', 'Mutfak – havalandırma', 'adet', 180),
  aks('aks-baza-izgara', 'AK-IZG-BZA', 'Baza Havalandırma Izgarası', 'Mutfak – havalandırma', 'adet', 120),
  // Aydınlatma
  aks('aks-led-serit', 'AK-LED-SRT', 'LED Şerit Dolap Altı Aydınlatma 12V', 'Aydınlatma', 'mt', 90),
  aks('aks-led-trafo', 'AK-LED-TRF', 'LED Trafo (Adaptör) 12V 60W', 'Aydınlatma', 'adet', 450),
  aks('aks-led-sensor', 'AK-LED-SNS', 'Sensörlü LED Anahtar (El Hareketli / Kapak)', 'Aydınlatma', 'adet', 350),
  aks('aks-led-spot', 'AK-LED-SPT', 'LED Dolap Spotu (Gömme)', 'Aydınlatma', 'adet', 250),
  aks('aks-led-kablo', 'AK-LED-KBL', 'LED Bağlantı Kablosu', 'Aydınlatma', 'mt', 25),
  // Diğer
  aks('aks-kablo-gecis-tapasi', 'AK-KBL-TPA', 'Kablo Geçiş Tapası Ø60', 'Genel', 'adet', 25),
  aks('aks-priz-tezgah', 'AK-PRZ', 'Tezgah İçi Gömme Priz Kulesi', 'Genel', 'adet', 1450),
];

// ============================================================================
// 14) TEZGAHLAR
// ============================================================================

const TEZGAH: Material[] = [
  ...(
    [
      ['beyaz', 'Beyaz', 1450, '#F2F1EC'],
      ['antrasit', 'Antrasit', 1550, '#3B3E42'],
      ['beton', 'Beton Gri', 1550, '#9A9A96'],
      ['mermer', 'Mermer Desen (Calacatta)', 1650, '#E9E6E0'],
      ['granit-siyah', 'Siyah Granit Desen', 1600, '#2A2A2A'],
      ['ceviz', 'Ceviz', 1600, '#6B4A32'],
      ['mese', 'Meşe', 1600, '#B89468'],
      ['kasmir', 'Kaşmir', 1550, '#CFC3B0'],
    ] as [string, string, number, string][]
  ).map(([k, ad, fiyat, renk], i) =>
    M(`tezgah-laminat-38-${k}`, `TZ-LM38-${String(i + 1).padStart(2, '0')}`, `Laminat Tezgah 38 mm ${ad} (60 cm)`, 'tezgah', 'Laminat tezgah', 'mt', fiyat, {
      kalinlik: 38, renk, aciklama: 'Postforming laminat tezgah, 60 cm derinlik, 4.10 m boy.',
    }),
  ),
  M('tezgah-laminat-38-ada-beyaz', 'TZ-LM38-ADA', 'Laminat Tezgah 38 mm Beyaz (90 cm, Ada)', 'tezgah', 'Laminat tezgah', 'mt', 2400, { kalinlik: 38, renk: '#F2F1EC' }),
  M('tezgah-kompakt-12-beyaz', 'TZ-KMP12-BYZ', 'Kompakt Laminat Tezgah 12 mm Beyaz', 'tezgah', 'Kompakt laminat', 'm2', 5500, { kalinlik: 12, renk: '#F2F1EC' }),
  M('tezgah-kompakt-12-siyah', 'TZ-KMP12-SYH', 'Kompakt Laminat Tezgah 12 mm Siyah', 'tezgah', 'Kompakt laminat', 'm2', 5600, { kalinlik: 12, renk: '#1F1F20' }),
  M('tezgah-kompakt-12-beton', 'TZ-KMP12-BTN', 'Kompakt Laminat Tezgah 12 mm Beton', 'tezgah', 'Kompakt laminat', 'm2', 5600, { kalinlik: 12, renk: '#9A9A96' }),
  M('tezgah-cimstone', 'TZ-CMS', 'Çimstone Kuvars Tezgah 20 mm (Standart Seri)', 'tezgah', 'Kuvars tezgah', 'm2', 9000, {
    kalinlik: 20, renk: '#EDEBE6', aciklama: 'Ölçü alımı, kesim, montaj ve evye/ocak oyuğu dahil m² fiyatı.',
  }),
  M('tezgah-cimstone-premium', 'TZ-CMS-PRM', 'Çimstone Kuvars Tezgah 20 mm (Calacatta / Premium)', 'tezgah', 'Kuvars tezgah', 'm2', 12500, { kalinlik: 20, renk: '#F1EFEA' }),
  M('tezgah-belenco', 'TZ-BLN', 'Belenco Kuvars Tezgah 20 mm', 'tezgah', 'Kuvars tezgah', 'm2', 10500, { kalinlik: 20, renk: '#E8E6E1' }),
  M('tezgah-granit-siyah', 'TZ-GRN-SYH', 'Granit Tezgah Siyah (Absolute)', 'tezgah', 'Doğal taş', 'm2', 4500, { kalinlik: 20, renk: '#1E1E1E' }),
  M('tezgah-granit-gri', 'TZ-GRN-GRI', 'Granit Tezgah Gri (Bergama)', 'tezgah', 'Doğal taş', 'm2', 3800, { kalinlik: 20, renk: '#8E8E8C' }),
  M('tezgah-mermer-beyaz', 'TZ-MRM-BYZ', 'Mermer Tezgah Beyaz (Afyon)', 'tezgah', 'Doğal taş', 'm2', 6500, { kalinlik: 20, renk: '#F0EEE9' }),
  M('tezgah-masif-mese', 'TZ-MSF-MSE', 'Masif Meşe Tezgah 40 mm (Finger Joint)', 'tezgah', 'Masif ahşap', 'm2', 7500, { kalinlik: 40, renk: '#B08B5B' }),
  M('tezgah-masif-ceviz', 'TZ-MSF-CVZ', 'Masif Ceviz Tezgah 40 mm', 'tezgah', 'Masif ahşap', 'm2', 11000, { kalinlik: 40, renk: '#5E3F2A' }),
  M('tezgah-akrilik-solid', 'TZ-AKR', 'Akrilik Solid Surface Tezgah (Corian Tipi)', 'tezgah', 'Akrilik tezgah', 'm2', 12000, { kalinlik: 12, renk: '#F5F5F3' }),
  M('tezgah-porselen', 'TZ-PRS', 'Porselen (Sinterlenmiş) Tezgah 12 mm', 'tezgah', 'Porselen tezgah', 'm2', 14000, { kalinlik: 12, renk: '#E6E4DF' }),
  M('tezgah-uc-kapama', 'TZ-UC', 'Laminat Tezgah Uç Kapama (Alüminyum)', 'tezgah', 'Tezgah aksesuarı', 'adet', 90),
  M('tezgah-birlesim-profili', 'TZ-BRL', 'Laminat Tezgah Birleşim Profili (Köşe/Düz)', 'tezgah', 'Tezgah aksesuarı', 'adet', 180),
  M('tezgah-birlesim-civatasi', 'TZ-BRL-CVT', 'Tezgah Birleşim Cıvatası (Kurt Ağzı)', 'tezgah', 'Tezgah aksesuarı', 'adet', 60),
  M('tezgah-supurgelik', 'TZ-SPR', 'Tezgah Süpürgeliği (Alüminyum)', 'tezgah', 'Tezgah aksesuarı', 'mt', 180),
  M('tezgah-supurgelik-siyah', 'TZ-SPR-SYH', 'Tezgah Süpürgeliği Siyah', 'tezgah', 'Tezgah aksesuarı', 'mt', 210),
  M('tezgah-arasi-panel-laminat', 'TZ-ARA-LM', 'Tezgah Arası Panel (Laminat)', 'tezgah', 'Tezgah arası', 'm2', 1800, { renk: '#E9E6E0' }),
  M('tezgah-arasi-cam', 'TZ-ARA-CAM', 'Tezgah Arası Cam Panel (Temperli Boyalı)', 'tezgah', 'Tezgah arası', 'm2', 2600, { renk: '#F2F2EE' }),
  M('tezgah-arasi-cimstone', 'TZ-ARA-CMS', 'Tezgah Arası Kuvars Panel', 'tezgah', 'Tezgah arası', 'm2', 8000, { renk: '#EDEBE6' }),
  M('tezgah-bant', 'TZ-BNT', 'Laminat Tezgah Kenar Bandı (45 mm)', 'tezgah', 'Tezgah aksesuarı', 'mt', 25),
  M('tezgah-montaj-klipsi', 'TZ-KLP', 'Tezgah Montaj Bağlantı Klipsi', 'tezgah', 'Tezgah aksesuarı', 'adet', 8),
];

// ============================================================================
// 15) SARF MALZEMELERİ
// ============================================================================

const SARF: Material[] = [
  M('tutkal-pva', 'SR-TKL-PVA', 'PVA Ahşap Tutkalı (D3)', 'sarf', 'Yapıştırıcı', 'kg', 110),
  M('sarf-hotmelt', 'SR-TKL-HM', 'Hot-Melt Bant Tutkalı (Granül)', 'sarf', 'Yapıştırıcı', 'kg', 280),
  M('sarf-kontakt', 'SR-TKL-KNT', 'Kontakt Yapıştırıcı', 'sarf', 'Yapıştırıcı', 'kg', 320),
  M('silikon-seffaf', 'SR-SLK-SFF', 'Silikon Şeffaf (Kartuş)', 'sarf', 'Silikon / köpük', 'adet', 140),
  M('silikon-beyaz', 'SR-SLK-BYZ', 'Silikon Beyaz (Kartuş)', 'sarf', 'Silikon / köpük', 'adet', 140),
  M('sarf-ayna-yapistiricisi', 'SR-AYN-YPS', 'Ayna Yapıştırıcısı (Kartuş)', 'sarf', 'Yapıştırıcı', 'adet', 220),
  M('sarf-montaj-kopugu', 'SR-KPK', 'Montaj Köpüğü (Tabancalı)', 'sarf', 'Silikon / köpük', 'adet', 180),
  M('sarf-strec-film', 'SR-STR', 'Streç Film Rulo (50 cm)', 'sarf', 'Ambalaj', 'adet', 450),
  M('sarf-kose-koruyucu', 'SR-KSE', "Köşe Koruyucu Karton (100'lü)", 'sarf', 'Ambalaj', 'paket', 250, { paketAdet: 100 }),
  M('sarf-mukavva', 'SR-MKV', 'Oluklu Mukavva Rulo', 'sarf', 'Ambalaj', 'mt', 40),
  M('sarf-balonlu-naylon', 'SR-BLN', 'Hava Kabarcıklı Naylon', 'sarf', 'Ambalaj', 'mt', 25),
  M('sarf-maske-bant', 'SR-MSK', 'Maskeleme Bandı', 'sarf', 'Ambalaj', 'adet', 40),
  M('sarf-rotus-kalemi', 'SR-RTS', 'Rötuş Kalemi (Renk Seçenekli)', 'sarf', 'Rötuş / bakım', 'adet', 45),
  M('sarf-rotus-mumu', 'SR-RTS-MUM', 'Rötuş Dolgu Mumu', 'sarf', 'Rötuş / bakım', 'adet', 60),
  M('sarf-zimpara', 'SR-ZMP', "Zımpara Kağıdı (50'li, Karışık Kum)", 'sarf', 'Rötuş / bakım', 'paket', 300, { paketAdet: 50 }),
  M('sarf-temizlik-spreyi', 'SR-TMZ', 'Yüzey Temizlik Spreyi', 'sarf', 'Rötuş / bakım', 'adet', 110),
  M('sarf-mobilya-cilasi', 'SR-CLA', 'Mobilya Cilası / Parlatıcı', 'sarf', 'Rötuş / bakım', 'adet', 130),
  M('sarf-lake-boya', 'SR-LK-BYA', 'Poliüretan Lake Boya (Sonkat)', 'sarf', 'Boya', 'kg', 650),
  M('sarf-lake-astar', 'SR-LK-AST', 'Poliüretan Dolgu Astarı', 'sarf', 'Boya', 'kg', 450),
  M('sarf-tiner', 'SR-TNR', 'Selülozik / PU Tiner', 'sarf', 'Boya', 'kg', 180),
];

// ============================================================================
// Birleşik katalog
// ============================================================================

export const MATERIALS: Material[] = [
  ...GOVDE,
  ...ARKALIK,
  ...KAPAK,
  ...CAM,
  ...BANT,
  ...MENTESE,
  ...RAY,
  ...MEKANIZMA,
  ...KULP,
  ...AYAK,
  ...VIDA,
  ...PROFIL,
  ...AKSESUAR,
  ...TEZGAH,
  ...SARF,
];

export const GROUP_LABELS: Record<MaterialGroup, string> = {
  govde: 'Gövde Plakaları',
  arkalik: 'Arkalıklar',
  kapak: 'Kapak Malzemeleri',
  cam: 'Cam ve Ayna',
  bant: 'Kenar Bantları',
  mentese: 'Menteşeler',
  ray: 'Çekmece Rayları',
  mekanizma: 'Kapak Mekanizmaları',
  kulp: 'Kulplar',
  ayak: 'Ayaklar ve Baza',
  vida: 'Vida ve Bağlantı Elemanları',
  profil: 'Alüminyum Profiller',
  aksesuar: 'Aksesuarlar',
  tezgah: 'Tezgahlar',
  sarf: 'Sarf Malzemeleri',
};

export const UNIT_LABELS: Record<PriceUnit, string> = {
  plaka: 'Plaka',
  m2: 'm²',
  mt: 'mt',
  adet: 'Adet',
  paket: 'Paket',
  takim: 'Takım',
  kg: 'kg',
};
