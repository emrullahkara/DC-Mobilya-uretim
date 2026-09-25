// Excel (.xlsx) ve CSV dışa aktarım – fason kesim, kapak siparişi, satın alma listesi
import writeXlsxFile from 'write-excel-file/browser';
import type { SheetData } from 'write-excel-file/browser';
import type { KesimSatiri, ProjeHesap } from '../engine/calc';
import type { Customer, Material, Project, Settings } from '../engine/types';
import { dosyaAdi, indir } from '../ui/common';

type Cell = { value: string | number | null; fontWeight?: 'bold'; backgroundColor?: string; wrap?: boolean };
const H = (v: string): Cell => ({ value: v, fontWeight: 'bold', backgroundColor: '#E9DCC9' });
const C = (v: string | number | null | undefined): Cell => ({ value: v === undefined ? null : v });

export function bantKodu(id: string | undefined, mat: Map<string, Material>): string {
  if (!id) return '';
  const m = mat.get(id);
  return m ? `${m.bantKalinlik ?? ''}mm ${m.kod}` : id;
}

const KESIM_BASLIK = ['No', 'Parça adı', 'Modül', 'Boy (mm)', 'En (mm)', 'Adet', 'Kalınlık', 'Damar', 'Boy bant 1', 'Boy bant 2', 'En bant 1', 'En bant 2', 'Malzeme kodu', 'Malzeme', 'Not'];

function kesimSatir(r: KesimSatiri, m: Material | undefined, mat: Map<string, Material>): (string | number)[] {
  return [
    r.no,
    r.ad,
    r.moduller,
    r.kesimBoy,
    r.kesimEn,
    r.adet,
    r.kalinlik,
    r.damar && m?.damarli ? 'Var' : 'Yok',
    bantKodu(r.kenar.b1, mat),
    bantKodu(r.kenar.b2, mat),
    bantKodu(r.kenar.e1, mat),
    bantKodu(r.kenar.e2, mat),
    m?.kod ?? r.malzemeId,
    m?.ad ?? '',
    r.not ?? '',
  ];
}

function sayfaAdi(s: string, kullanilan: Set<string>): string {
  let ad = s.replace(/[\\/?*[\]:]/g, ' ').slice(0, 28).trim() || 'Sayfa';
  let i = 2;
  const kok = ad;
  while (kullanilan.has(ad)) ad = `${kok.slice(0, 25)} ${i++}`;
  kullanilan.add(ad);
  return ad;
}

function baslikBilgi(p: Project, musteri: Customer | undefined, settings: Settings, notu: string): Cell[][] {
  return [
    [{ value: `${settings.firma.ad} – ${notu}`, fontWeight: 'bold' }],
    [C(`İş: ${p.no} – ${p.ad}`)],
    [C(`Müşteri: ${musteri?.ad ?? '-'}   Tarih: ${new Date().toLocaleDateString('tr-TR')}`)],
    [C(settings.uretim.bantDus ? 'Ölçüler KESİM ölçüsüdür (bant kalınlığı düşülmüştür).' : 'Ölçüler BANTLI NET ölçüdür – bant payını makinede düşünüz.')],
    [C('Boy = damar (plaka boyu) yönü.')],
    [],
  ];
}

/** Fason kesim listesi – her plaka malzemesi ayrı sayfa + özet + bant */
export async function kesimXlsx(p: Project, h: ProjeHesap, mat: Map<string, Material>, settings: Settings, musteri?: Customer) {
  const kullanilan = new Set<string>();
  const sheets: { data: SheetData; sheet: string; columns?: { width: number }[] }[] = [];

  const ozet: Cell[][] = [...baslikBilgi(p, musteri, settings, 'Fason Kesim Özeti'), [H('Malzeme kodu'), H('Malzeme'), H('Kalınlık'), H('Plaka ölçüsü'), H('Parça sayısı'), H('Parça alanı m²'), H('Plaka adedi')]];
  for (const pl of h.plakalar)
    ozet.push([
      C(pl.malzeme.kod),
      C(pl.malzeme.ad),
      C(pl.malzeme.kalinlik ?? ''),
      C(`${pl.malzeme.plakaBoy}×${pl.malzeme.plakaEn}`),
      C(pl.satirlar.reduce((s, r) => s + r.adet, 0)),
      C(Math.round(pl.parcaAlan * 100) / 100),
      C(pl.plakaSayisi),
    ]);
  ozet.push([], [H('Bant'), H('Kod'), H('Metre')]);
  for (const b of h.bantlar) ozet.push([C(b.malzeme.ad), C(b.malzeme.kod), C(b.metre)]);
  sheets.push({ data: ozet as SheetData, sheet: sayfaAdi('Özet', kullanilan), columns: [{ width: 16 }, { width: 40 }, { width: 10 }, { width: 14 }, { width: 12 }, { width: 14 }, { width: 12 }] });

  for (const pl of h.plakalar) {
    const data: Cell[][] = [...baslikBilgi(p, musteri, settings, `Kesim Listesi – ${pl.malzeme.ad}`), KESIM_BASLIK.map(H)];
    for (const r of pl.satirlar) data.push(kesimSatir(r, pl.malzeme, mat).map(C));
    data.push([], [C(`Toplam parça: ${pl.satirlar.reduce((s, r) => s + r.adet, 0)}   Tahmini plaka: ${pl.plakaSayisi}`)]);
    sheets.push({
      data: data as SheetData,
      sheet: sayfaAdi(`${pl.malzeme.kod}`, kullanilan),
      columns: [6, 26, 18, 10, 10, 7, 9, 8, 16, 16, 16, 16, 16, 30, 30].map((width) => ({ width })),
    });
  }
  const blob = await writeXlsxFile(sheets as never).toBlob();
  indir(blob, dosyaAdi(`Kesim_${p.no}_${p.ad}.xlsx`));
}

/** Tek dosya CSV (noktalı virgül, UTF-8 BOM – Türkçe Excel doğrudan açar) */
export function kesimCsv(p: Project, h: ProjeHesap, mat: Map<string, Material>) {
  const esc = (v: string | number) => {
    const s = typeof v === 'number' ? String(v).replace('.', ',') : v;
    return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const satirlar = [KESIM_BASLIK.join(';')];
  for (const pl of h.plakalar) for (const r of pl.satirlar) satirlar.push(kesimSatir(r, pl.malzeme, mat).map(esc).join(';'));
  const blob = new Blob(['﻿' + satirlar.join('\r\n')], { type: 'text/csv;charset=utf-8' });
  indir(blob, dosyaAdi(`Kesim_${p.no}_${p.ad}.csv`));
}

/** Hazır kapak + cam siparişi */
export async function kapakSiparisXlsx(p: Project, h: ProjeHesap, settings: Settings, musteri?: Customer) {
  const data: Cell[][] = [...baslikBilgi(p, musteri, settings, 'Kapak / Cam Sipariş Listesi'), [H('No'), H('Malzeme'), H('Parça'), H('Boy (mm)'), H('En (mm)'), H('Adet'), H('m²'), H('Not')]];
  for (const g of [...h.hazirKapaklar, ...h.camlar]) {
    for (const r of g.satirlar) data.push([C(r.no), C(g.malzeme.ad), C(r.ad), C(r.boy), C(r.en), C(r.adet), C(Math.round(((r.boy * r.en * r.adet) / 1e6) * 1000) / 1000), C(r.not ?? '')]);
    data.push([C(''), { value: `${g.malzeme.ad} toplam`, fontWeight: 'bold' }, C(''), C(''), C(''), C(g.satirlar.reduce((s, r) => s + r.adet, 0)), { value: Math.round(g.alan * 1000) / 1000, fontWeight: 'bold' }, C('')]);
  }
  const blob = await writeXlsxFile(data as SheetData, { columns: [6, 34, 24, 10, 10, 7, 9, 30].map((width) => ({ width })) }).toBlob();
  indir(blob, dosyaAdi(`Kapak_Siparis_${p.no}.xlsx`));
}

/** Satın alma listesi (plaka, bant, hırdavat, tezgah) */
export async function satinAlmaXlsx(p: Project, h: ProjeHesap, settings: Settings, musteri?: Customer) {
  const data: Cell[][] = [...baslikBilgi(p, musteri, settings, 'Malzeme / Satın Alma Listesi'), [H('Grup'), H('Kod'), H('Malzeme'), H('Miktar'), H('Birim'), H('Alınacak'), H('Birim fiyat'), H('Tutar'), H('Not')]];
  for (const pl of h.plakalar) data.push([C('Plaka'), C(pl.malzeme.kod), C(pl.malzeme.ad), C(Math.round(pl.parcaAlan * 100) / 100), C('m² parça'), C(`${pl.plakaSayisi} plaka`), C(pl.malzeme.fiyat), C(pl.tutar), C('')]);
  for (const g of [...h.hazirKapaklar, ...h.camlar]) data.push([C('Sipariş'), C(g.malzeme.kod), C(g.malzeme.ad), C(Math.round(g.alan * 1000) / 1000), C('m²'), C(`${Math.round(g.alan * 100) / 100} m²`), C(g.malzeme.fiyat), C(g.tutar), C('')]);
  for (const b of h.bantlar) data.push([C('Bant'), C(b.malzeme.kod), C(b.malzeme.ad), C(b.metre), C('mt'), C(`${b.metre} mt`), C(b.malzeme.fiyat), C(b.tutar), C('')]);
  for (const d of h.donanimlar) data.push([C(d.malzeme.grup), C(d.malzeme.kod), C(d.malzeme.ad), C(d.miktar), C(d.malzeme.birim === 'paket' ? 'adet' : d.malzeme.birim), C(`${d.alim} ${d.alimBirim}`), C(d.malzeme.fiyat), C(d.tutar), C(d.notlar.join(', '))]);
  const blob = await writeXlsxFile(data as SheetData, { columns: [12, 16, 40, 10, 10, 18, 12, 12, 40].map((width) => ({ width })) }).toBlob();
  indir(blob, dosyaAdi(`Malzeme_Listesi_${p.no}.xlsx`));
}

/** Fiyat listesi dışa aktarım (Excel'de düzenleyip geri yüklemek için) */
export async function fiyatListesiXlsx(materials: Material[]) {
  const data: Cell[][] = [[H('Kod'), H('Ad'), H('Grup'), H('Alt grup'), H('Birim'), H('Fiyat (KDV hariç)'), H('Kalınlık'), H('Plaka boy'), H('Plaka en'), H('Paket adet'), H('id')]];
  for (const m of materials) data.push([C(m.kod), C(m.ad), C(m.grup), C(m.alt ?? ''), C(m.birim), C(m.fiyat), C(m.kalinlik ?? ''), C(m.plakaBoy ?? ''), C(m.plakaEn ?? ''), C(m.paketAdet ?? ''), C(m.id)]);
  const blob = await writeXlsxFile(data as SheetData, { columns: [16, 50, 12, 24, 8, 14, 9, 9, 9, 9, 30].map((width) => ({ width })) }).toBlob();
  indir(blob, `Fiyat_Listesi_${new Date().toISOString().slice(0, 10)}.xlsx`);
}
