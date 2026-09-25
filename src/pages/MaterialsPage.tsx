import { useMemo, useRef, useState } from 'react';
import { useStore } from '../store';
import { GROUP_LABELS, UNIT_LABELS } from '../data/materials';
import { HW } from '../data/hw';
import { Field, Modal, Num, tl } from '../ui/common';
import { fiyatListesiXlsx } from '../export/excel';
import type { Material, MaterialGroup, PriceUnit } from '../engine/types';

const KORUMALI = new Set<string>(Object.values(HW));

export default function MaterialsPage() {
  const materials = useStore((s) => s.materials);
  const upsert = useStore((s) => s.upsertMaterial);
  const remove = useStore((s) => s.removeMaterial);
  const setMaterials = useStore((s) => s.setMaterials);
  const resetMaterials = useStore((s) => s.resetMaterials);
  const [grup, setGrup] = useState<MaterialGroup | ''>('govde');
  const [ara, setAra] = useState('');
  const [duzen, setDuzen] = useState<Material | null>(null);
  const [zam, setZam] = useState(false);
  const [mesaj, setMesaj] = useState<string>();
  const [sifirla, setSifirla] = useState(false);
  const dosya = useRef<HTMLInputElement>(null);

  const q = ara.toLocaleLowerCase('tr');
  const liste = useMemo(
    () => materials.filter((m) => (q ? [m.ad, m.kod, m.alt ?? ''].join(' ').toLocaleLowerCase('tr').includes(q) : !grup || m.grup === grup)),
    [materials, grup, q],
  );
  const sayilar = useMemo(() => {
    const s = new Map<string, number>();
    for (const m of materials) s.set(m.grup, (s.get(m.grup) ?? 0) + 1);
    return s;
  }, [materials]);

  const ice = async (f: File) => {
    try {
      let rows: (string | number | null)[][];
      if (/\.csv$/i.test(f.name)) {
        const txt = (await f.text()).replace(/^﻿/, '');
        const ayrac = txt.split('\n')[0].includes(';') ? ';' : ',';
        rows = txt.split(/\r?\n/).filter(Boolean).map((l) => l.split(ayrac).map((c) => c.replace(/^"|"$/g, '').trim()));
      } else {
        const { readSheet } = await import('read-excel-file/browser');
        rows = (await readSheet(f)) as (string | number | null)[][];
      }
      const bas = rows[0].map((c) => String(c ?? '').toLocaleLowerCase('tr'));
      const iKod = bas.findIndex((c) => c.startsWith('kod'));
      const iFiyat = bas.findIndex((c) => c.startsWith('fiyat'));
      const iId = bas.findIndex((c) => c === 'id');
      if (iFiyat < 0 || (iKod < 0 && iId < 0)) throw new Error('Başlık satırında "Kod" ve "Fiyat" sütunları bulunamadı.');
      const byKod = new Map(materials.map((m) => [m.kod.toLocaleLowerCase('tr'), m]));
      const byId = new Map(materials.map((m) => [m.id, m]));
      let n = 0;
      const yeni = materials.map((m) => ({ ...m }));
      const idx = new Map(yeni.map((m, i) => [m.id, i]));
      for (const r of rows.slice(1)) {
        const m = (iId >= 0 && byId.get(String(r[iId] ?? ''))) || (iKod >= 0 && byKod.get(String(r[iKod] ?? '').toLocaleLowerCase('tr')));
        const fiyat = Number(String(r[iFiyat] ?? '').replace(/\./g, '').replace(',', '.'));
        const fiyat2 = typeof r[iFiyat] === 'number' ? (r[iFiyat] as number) : fiyat;
        if (m && Number.isFinite(fiyat2) && fiyat2 > 0) {
          yeni[idx.get(m.id)!].fiyat = fiyat2;
          n++;
        }
      }
      setMaterials(yeni);
      setMesaj(`${n} malzemenin fiyatı güncellendi.`);
    } catch (e) {
      setMesaj(`İçe aktarma hatası: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  return (
    <div className="page">
      <div className="page-head">
        <h1>Malzeme & Fiyat Kütüphanesi</h1>
        <div className="row-actions">
          <button className="btn" onClick={() => setZam(true)}>
            % Toplu zam / indirim
          </button>
          <button className="btn" onClick={() => fiyatListesiXlsx(materials)}>
            ⬇ Excel’e aktar
          </button>
          <button className="btn" onClick={() => dosya.current?.click()}>
            ⬆ Fiyatları Excel/CSV’den yükle
          </button>
          <input ref={dosya} type="file" accept=".xlsx,.csv" hidden onChange={(e) => e.target.files?.[0] && ice(e.target.files[0])} />
          <button
            className="btn primary"
            onClick={() =>
              setDuzen({ id: '', kod: '', ad: '', grup: (grup || 'aksesuar') as MaterialGroup, birim: 'adet', fiyat: 0 })
            }
          >
            + Yeni malzeme
          </button>
        </div>
      </div>
      {mesaj && (
        <div className="info" onClick={() => setMesaj(undefined)}>
          {mesaj}
        </div>
      )}
      <p className="muted small">Fiyatlar KDV hariçtir. Excel’e aktarıp fiyat sütununu güncelleyerek geri yükleyebilirsiniz (Kod veya id ile eşleşir).</p>
      <input className="search" placeholder={`${materials.length} malzeme içinde ara (ad, kod)…`} value={ara} onChange={(e) => setAra(e.target.value)} />
      {!q && (
        <div className="chips">
          {(Object.keys(GROUP_LABELS) as MaterialGroup[]).map((g) => (
            <button key={g} className={`chip${grup === g ? ' on' : ''}`} onClick={() => setGrup(g)}>
              {GROUP_LABELS[g]} <small>{sayilar.get(g) ?? 0}</small>
            </button>
          ))}
        </div>
      )}
      <div className="table-wrap">
        <table className="tbl mat-tbl">
          <thead>
            <tr>
              <th>Kod</th>
              <th>Malzeme</th>
              <th className="hide-sm">Alt grup</th>
              <th className="hide-sm">Özellik</th>
              <th>Birim</th>
              <th>Fiyat (₺)</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {liste.map((m) => (
              <tr key={m.id} className={m.pasif ? 'pasif' : ''}>
                <td className="mono">{m.kod}</td>
                <td>
                  {m.renk && <i className="swatch" style={{ background: m.renk }} />}
                  {m.ad}
                </td>
                <td className="muted hide-sm">{m.alt}</td>
                <td className="muted hide-sm small">
                  {m.kalinlik ? `${m.kalinlik} mm ` : ''}
                  {m.plakaBoy ? `${m.plakaBoy}×${m.plakaEn} ` : ''}
                  {m.paketAdet ? `${m.paketAdet}'lü ` : ''}
                  {m.temin === 'hazir' ? 'hazır kapak' : ''}
                </td>
                <td>{UNIT_LABELS[m.birim]}</td>
                <td className="price">
                  <Num value={m.fiyat} onChange={(v) => upsert({ ...m, fiyat: v })} min={0} />
                </td>
                <td>
                  <button className="btn small ghost" onClick={() => setDuzen(m)}>
                    Düzenle
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="row-actions top">
        <button className="btn danger ghost" onClick={() => setSifirla(true)}>
          Kütüphaneyi fabrika ayarına döndür
        </button>
      </div>

      {duzen && (
        <MaterialEditor
          m={duzen}
          yeni={!duzen.id}
          korumali={KORUMALI.has(duzen.id)}
          onClose={() => setDuzen(null)}
          onSave={(m) => {
            upsert(m);
            setDuzen(null);
          }}
          onDelete={() => {
            remove(duzen.id);
            setDuzen(null);
          }}
          mevcutIdler={new Set(materials.map((x) => x.id))}
        />
      )}
      {zam && <ZamModal onClose={() => setZam(false)} grup={grup} />}
      {sifirla && (
        <Modal title="Fabrika ayarı" onClose={() => setSifirla(false)}>
          <p>Bütün fiyat ve malzeme değişiklikleriniz silinip varsayılan kütüphane yüklenecek.</p>
          <div className="modal-actions">
            <button className="btn" onClick={() => setSifirla(false)}>
              Vazgeç
            </button>
            <button
              className="btn danger"
              onClick={() => {
                resetMaterials();
                setSifirla(false);
              }}
            >
              Sıfırla
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function MaterialEditor({ m: ilk, yeni, korumali, onClose, onSave, onDelete, mevcutIdler }: { m: Material; yeni: boolean; korumali: boolean; onClose: () => void; onSave: (m: Material) => void; onDelete: () => void; mevcutIdler: Set<string> }) {
  const [m, setM] = useState<Material>(ilk);
  const set = <K extends keyof Material>(k: K, v: Material[K]) => setM({ ...m, [k]: v });
  const plaka = m.birim === 'plaka' || ['govde', 'arkalik', 'kapak'].includes(m.grup);
  const kaydet = () => {
    let id = m.id;
    if (!id) {
      id = (m.kod || m.ad).toLocaleLowerCase('tr').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'malzeme';
      let i = 2;
      const kok = id;
      while (mevcutIdler.has(id)) id = `${kok}-${i++}`;
    }
    onSave({ ...m, id });
  };
  return (
    <Modal title={yeni ? 'Yeni malzeme' : m.ad} onClose={onClose}>
      <div className="grid2">
        <Field label="Kod">
          <input value={m.kod} onChange={(e) => set('kod', e.target.value)} />
        </Field>
        <Field label="Ad">
          <input value={m.ad} onChange={(e) => set('ad', e.target.value)} />
        </Field>
        <Field label="Grup">
          <select value={m.grup} onChange={(e) => set('grup', e.target.value as MaterialGroup)}>
            {Object.entries(GROUP_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Alt grup">
          <input value={m.alt ?? ''} onChange={(e) => set('alt', e.target.value)} />
        </Field>
        <Field label="Birim">
          <select value={m.birim} onChange={(e) => set('birim', e.target.value as PriceUnit)}>
            {Object.entries(UNIT_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Fiyat (KDV hariç)">
          <Num value={m.fiyat} onChange={(v) => set('fiyat', v)} min={0} suffix="₺" />
        </Field>
        {m.birim === 'paket' && (
          <Field label="Paket içi adet">
            <Num value={m.paketAdet} onChange={(v) => set('paketAdet', v)} min={1} />
          </Field>
        )}
        {(plaka || m.grup === 'cam' || m.grup === 'tezgah') && (
          <Field label="Kalınlık">
            <Num value={m.kalinlik} onChange={(v) => set('kalinlik', v)} min={0} suffix="mm" />
          </Field>
        )}
        {plaka && (
          <>
            <Field label="Plaka boyu (damar yönü)">
              <Num value={m.plakaBoy} onChange={(v) => set('plakaBoy', v)} min={0} suffix="mm" />
            </Field>
            <Field label="Plaka eni">
              <Num value={m.plakaEn} onChange={(v) => set('plakaEn', v)} min={0} suffix="mm" />
            </Field>
            <label className="check">
              <input type="checkbox" checked={!!m.damarli} onChange={(e) => set('damarli', e.target.checked)} /> Damarlı (parçalar döndürülmez)
            </label>
          </>
        )}
        {m.grup === 'kapak' && (
          <Field label="Temin şekli">
            <select value={m.temin ?? 'kesim'} onChange={(e) => set('temin', e.target.value as 'kesim' | 'hazir')}>
              <option value="kesim">Plaka – fason kesim</option>
              <option value="hazir">Hazır kapak – m² sipariş</option>
            </select>
          </Field>
        )}
        {m.grup === 'bant' && (
          <Field label="Bant kalınlığı">
            <Num value={m.bantKalinlik} onChange={(v) => set('bantKalinlik', v)} min={0} max={5} suffix="mm" />
          </Field>
        )}
        <Field label="3D renk">
          <input type="color" value={m.renk ?? '#dddddd'} onChange={(e) => set('renk', e.target.value)} />
        </Field>
        <Field label="Açıklama" wide>
          <textarea rows={2} value={m.aciklama ?? ''} onChange={(e) => set('aciklama', e.target.value)} />
        </Field>
        <label className="check">
          <input type="checkbox" checked={!!m.pasif} onChange={(e) => set('pasif', e.target.checked)} /> Pasif (seçim listelerinde gösterme)
        </label>
      </div>
      <div className="modal-actions">
        {!yeni && !korumali && (
          <button className="btn danger ghost" onClick={onDelete}>
            Sil
          </button>
        )}
        {korumali && <span className="muted small">Bu kalem otomatik hesapta kullanılır, silinemez.</span>}
        <button className="btn" onClick={onClose}>
          Vazgeç
        </button>
        <button className="btn primary" disabled={!m.ad.trim()} onClick={kaydet}>
          Kaydet
        </button>
      </div>
    </Modal>
  );
}

function ZamModal({ onClose, grup }: { onClose: () => void; grup: MaterialGroup | '' }) {
  const materials = useStore((s) => s.materials);
  const setMaterials = useStore((s) => s.setMaterials);
  const [oran, setOran] = useState(10);
  const [kapsam, setKapsam] = useState<'grup' | 'hepsi'>(grup ? 'grup' : 'hepsi');
  const etkilenen = materials.filter((m) => kapsam === 'hepsi' || m.grup === grup);
  const ornek = etkilenen[0];
  return (
    <Modal title="Toplu fiyat güncelleme" onClose={onClose}>
      <div className="grid2">
        <Field label="Oran" hint="İndirim için eksi girin (örn. -5)">
          <Num value={oran} onChange={setOran} min={-90} max={500} suffix="%" />
        </Field>
        <Field label="Kapsam">
          <select value={kapsam} onChange={(e) => setKapsam(e.target.value as 'grup' | 'hepsi')}>
            {grup && <option value="grup">Sadece {GROUP_LABELS[grup]}</option>}
            <option value="hepsi">Tüm kütüphane</option>
          </select>
        </Field>
      </div>
      <p className="muted">
        {etkilenen.length} kalem güncellenecek.{' '}
        {ornek && (
          <>
            Örnek: {ornek.ad} {tl(ornek.fiyat)} → {tl(Math.round(ornek.fiyat * (1 + oran / 100) * 100) / 100)}
          </>
        )}
      </p>
      <div className="modal-actions">
        <button className="btn" onClick={onClose}>
          Vazgeç
        </button>
        <button
          className="btn primary"
          onClick={() => {
            const ids = new Set(etkilenen.map((m) => m.id));
            setMaterials(materials.map((m) => (ids.has(m.id) ? { ...m, fiyat: Math.round(m.fiyat * (1 + oran / 100) * 100) / 100 } : m)));
            onClose();
          }}
        >
          Uygula
        </button>
      </div>
    </Modal>
  );
}
