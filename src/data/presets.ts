// Hazır başlangıçlar: duvar ölçüsünü girince modülleri otomatik dizer
import { gardiropBol } from '../engine/layout';
import type { PlacedModule, Wall } from '../engine/types';
import { TEMPLATE_MAP } from './templates';
import { uid } from '../store';

const m = (tid: string, w?: number, h?: number, d?: number): PlacedModule => {
  const t = TEMPLATE_MAP.get(tid)!;
  return { uid: uid(), templateId: tid, w: w ?? t.w.def, h: h ?? t.h.def, d: d ?? t.d.def };
};

export type IsTuru = 'mutfak' | 'gardirop' | 'vestiyer' | 'bos';

/**
 * Düz mutfak önerisi. Alt ve üst sıradaki modüllerin nominal genişlikleri eşleştirildiği için
 * akıllı sığdırmadan sonra üst dolaplar alt dolaplarla aynı hizada kalır.
 */
export function mutfakOner(uzunluk: number): Pick<Wall, 'alt' | 'ust'> {
  const alt: PlacedModule[] = [];
  const ust: PlacedModule[] = [];
  const cift = (w: number) => {
    alt.push(m('alt-cift-kapak', w));
    ust.push(m('ust-cift-kapak', w));
  };
  const tek = (w: number) => {
    alt.push(m('alt-tek-kapak', w));
    ust.push(m(w >= 600 ? 'ust-cift-kapak' : 'ust-tek-kapak', w));
  };
  if (uzunluk < 1500) {
    alt.push(m('alt-evye', 800));
    ust.push(m('ust-bulasiklik', 800));
    tek(Math.max(300, uzunluk - 800));
    return { alt, ust };
  }
  // Sabit modüllerin ustaya yakın dizilişi: evye – bulaşık – çekmece – fırın – kapaklı...
  alt.push(m('alt-evye', 900));
  ust.push(m('ust-bulasiklik', 900));
  let kalan = uzunluk - 900;
  if (kalan >= 1800) {
    alt.push(m('alt-bulasik-boslugu', 600));
    ust.push(m('ust-cift-kapak', 600));
    kalan -= 600;
  }
  if (kalan >= 1200) {
    alt.push(m('alt-kasiklik-3-cekmece', 600));
    ust.push(m('ust-cift-kapak', 600));
    kalan -= 600;
  }
  if (kalan >= 900) {
    alt.push(m('alt-ankastre-firin', 600));
    ust.push(m('ust-aspirator', 600));
    kalan -= 600;
  }
  // Kalan alanı 600-900 mm kapaklı modüllerle doldur
  while (kalan > 0) {
    if (kalan <= 600) {
      tek(Math.max(kalan, 300));
      kalan = 0;
    } else if (kalan <= 1200) {
      cift(kalan);
      kalan = 0;
    } else {
      cift(800);
      kalan -= 800;
    }
  }
  return { alt, ust };
}

export function gardiropOner(uzunluk: number, yukseklik: number, kapak: number, duzen: 'ikili' | 'tekli', yukluk: boolean): Pick<Wall, 'alt' | 'ust'> {
  // Devirme payı: dolap yatık getirilip dikildiği için köşegeni tavandan kısa olmalı
  const devirmeMax = Math.floor((Math.sqrt(yukseklik * yukseklik - 580 * 580) - 10) / 10) * 10;
  const govdeH = yukluk ? Math.min(2150, yukseklik - 400) : Math.min(devirmeMax, 2600);
  const alt = gardiropBol({ genislik: uzunluk, yukseklik: govdeH, derinlik: 580, kapakSayisi: kapak, duzen, ikiliTemplate: 'gard-iki-ic-cekmece', tekliTemplate: 'gard-tek-raf' }, uid);
  // İkili düzende modülleri çeşitlendir: ilk askı + iç çekmece, diğerleri askı / bölmeli
  if (duzen === 'ikili') {
    const cesit = ['gard-iki-ic-cekmece', 'gard-iki-bolmeli', 'gard-iki-aski', 'gard-iki-dis-cekmece'];
    let i = 0;
    for (const a of alt) if (a.templateId === 'gard-iki-ic-cekmece') a.templateId = cesit[i++ % cesit.length];
  } else {
    const cesit = ['gard-tek-aski', 'gard-tek-raf'];
    alt.forEach((a, i) => (a.templateId = cesit[i % 2]));
  }
  for (const a of alt) a.kilitli = false;
  const ust: PlacedModule[] = [];
  if (yukluk) {
    const h = Math.max(300, yukseklik - govdeH - 10);
    for (const a of alt) ust.push({ uid: uid(), templateId: 'gard-yukluk', w: a.w, h: Math.min(h, 900), d: 580, kapakAdet: a.templateId.includes('iki') ? 2 : 1 });
  }
  return { alt, ust };
}

export function vestiyerOner(uzunluk: number): Pick<Wall, 'alt' | 'ust'> {
  if (uzunluk < 900) return { alt: [m('ves-boy-ayakkabilik', uzunluk)], ust: [] };
  if (uzunluk < 1300) return { alt: [m('ves-boy-ayakkabilik', 450), m('ves-puf-oturakli', uzunluk - 450)], ust: [] };
  if (uzunluk < 2000) return { alt: [m('ves-uc-kapak', uzunluk)], ust: [] };
  return { alt: [m('ves-boy-ayakkabilik', 450), m('ves-puf-oturakli', 900), m('ves-iki-kapak-aski', uzunluk - 1350)], ust: [] };
}
