import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useStore } from '../store';
import { hesapla } from '../engine/calc';
import { TEMPLATES } from '../data/templates';
import { GROUP_LABELS } from '../data/materials';
import type { Material, MaterialGroup, Project } from '../engine/types';

// ---------------------------------------------------------------------------
// Biçimlendirme
// ---------------------------------------------------------------------------
const tlFmt = new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 2 });
const numFmt = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 });
export const tl = (n: number) => tlFmt.format(n || 0);
export const sayi = (n: number, d = 2) => new Intl.NumberFormat('tr-TR', { maximumFractionDigits: d }).format(n || 0);
export const mm = (n: number) => numFmt.format(Math.round(n * 10) / 10);
export const tarih = (s?: string) => (s ? new Date(s).toLocaleDateString('tr-TR') : '');

export const DURUM_ADI: Record<Project['durum'], string> = {
  taslak: 'Taslak',
  teklif: 'Teklif verildi',
  onay: 'Sipariş (onaylandı)',
  uretim: 'Üretimde',
  montaj: 'Montajda',
  teslim: 'Teslim edildi',
  iptal: 'İptal / Olmadı',
};

// ---------------------------------------------------------------------------
// Hesap kancası
// ---------------------------------------------------------------------------
export function useHesap(p: Project | undefined) {
  const settings = useStore((s) => s.settings);
  const materials = useStore((s) => s.materials);
  return useMemo(() => (p ? hesapla(p, settings, materials, TEMPLATES) : undefined), [p, settings, materials]);
}

export function useMatMap() {
  const materials = useStore((s) => s.materials);
  return useMemo(() => new Map(materials.map((m) => [m.id, m])), [materials]);
}

// ---------------------------------------------------------------------------
// Form elemanları
// ---------------------------------------------------------------------------
export function Field({ label, children, hint, wide }: { label: string; children: ReactNode; hint?: string; wide?: boolean }) {
  return (
    <label className={`field${wide ? ' wide' : ''}`}>
      <span className="field-label">{label}</span>
      {children}
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  );
}

/** Sayı girişi – yazarken değil, alan terk edilince / Enter'da kaydeder */
export function Num({
  value,
  onChange,
  min,
  max,
  step,
  suffix,
  disabled,
  placeholder,
}: {
  value: number | undefined;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  disabled?: boolean;
  placeholder?: string;
}) {
  const [txt, setTxt] = useState(value === undefined ? '' : String(value));
  useEffect(() => setTxt(value === undefined ? '' : String(Math.round(value * 100) / 100)), [value]);
  const kaydet = () => {
    const n = Number(txt.replace(',', '.'));
    if (txt.trim() === '' || Number.isNaN(n)) {
      setTxt(value === undefined ? '' : String(value));
      return;
    }
    let v = n;
    if (min !== undefined) v = Math.max(min, v);
    if (max !== undefined) v = Math.min(max, v);
    if (v !== value) onChange(v);
    setTxt(String(v));
  };
  return (
    <span className="num">
      <input
        inputMode="decimal"
        value={txt}
        disabled={disabled}
        placeholder={placeholder}
        step={step}
        onChange={(e) => setTxt(e.target.value)}
        onBlur={kaydet}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
        }}
        onFocus={(e) => e.target.select()}
      />
      {suffix && <span className="suffix">{suffix}</span>}
    </span>
  );
}

export function Text({ value, onChange, placeholder, multiline }: { value: string | undefined; onChange: (s: string) => void; placeholder?: string; multiline?: boolean }) {
  const [txt, setTxt] = useState(value ?? '');
  useEffect(() => setTxt(value ?? ''), [value]);
  if (multiline)
    return <textarea value={txt} placeholder={placeholder} rows={4} onChange={(e) => setTxt(e.target.value)} onBlur={() => txt !== value && onChange(txt)} />;
  return (
    <input
      value={txt}
      placeholder={placeholder}
      onChange={(e) => setTxt(e.target.value)}
      onBlur={() => txt !== (value ?? '') && onChange(txt)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
      }}
    />
  );
}

/** Malzeme seçici – gruplara göre filtreli, aramalı */
export function MatSelect({ value, onChange, gruplar, filtre, bos }: { value: string | undefined; onChange: (id: string) => void; gruplar: MaterialGroup[]; filtre?: (m: Material) => boolean; bos?: string }) {
  const materials = useStore((s) => s.materials);
  const list = materials.filter((m) => gruplar.includes(m.grup) && !m.pasif && (!filtre || filtre(m)));
  const byAlt = new Map<string, Material[]>();
  for (const m of list) {
    const k = `${GROUP_LABELS[m.grup]}${m.alt ? ' – ' + m.alt : ''}`;
    byAlt.set(k, [...(byAlt.get(k) ?? []), m]);
  }
  const secili = materials.find((m) => m.id === value);
  return (
    <select value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
      {bos !== undefined && <option value="">{bos}</option>}
      {secili && !list.includes(secili) && <option value={secili.id}>{secili.ad}</option>}
      {!secili && value && <option value={value}>⚠ Bulunamadı: {value}</option>}
      {[...byAlt.entries()].map(([k, ms]) => (
        <optgroup key={k} label={k}>
          {ms.map((m) => (
            <option key={m.id} value={m.id}>
              {m.ad} — {tl(m.fiyat)}/{m.birim === 'm2' ? 'm²' : m.birim}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}

export function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    const f = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', f);
    return () => window.removeEventListener('keydown', f);
  }, [onClose]);
  return (
    <div className="modal-bg" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal${wide ? ' wide' : ''}`} role="dialog" aria-label={title}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="btn ghost icon" onClick={onClose} aria-label="Kapat">
            ✕
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="empty">{children}</div>;
}

export function Uyarilar({ list }: { list: string[] }) {
  if (!list.length) return null;
  return (
    <ul className="warn-list">
      {list.map((u, i) => (
        <li key={i}>⚠ {u}</li>
      ))}
    </ul>
  );
}

/** Dosya indirme yardımcısı */
export function indir(blob: Blob, ad: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = ad;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function dosyaAdi(s: string) {
  const tr: Record<string, string> = { ç: 'c', Ç: 'C', ğ: 'g', Ğ: 'G', ı: 'i', İ: 'I', ö: 'o', Ö: 'O', ş: 's', Ş: 'S', ü: 'u', Ü: 'U' };
  return s.replace(/[çÇğĞıİöÖşŞüÜ]/g, (c) => tr[c]).replace(/[^\w.-]+/g, '_');
}

export function yazdir() {
  window.print();
}
