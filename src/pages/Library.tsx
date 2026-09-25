import { Suspense, lazy, useMemo, useState } from 'react';
import { KATEGORI_ADLARI, TEMPLATES } from '../data/templates';
import { buildModule } from '../engine/builder';
import { useStore } from '../store';
import { Field, Num, mm, useMatMap } from '../ui/common';
import { TemplateCard } from '../project/ModulePicker';
import type { ModuleCategory, ModuleTemplate } from '../engine/types';

const Preview = lazy(() => import('../three/Scene3D').then((m) => ({ default: m.ModulePreview })));

export default function Library() {
  const [kat, setKat] = useState<ModuleCategory>('mutfak-alt');
  const [ara, setAra] = useState('');
  const [sec, setSec] = useState<ModuleTemplate | null>(null);
  const q = ara.toLocaleLowerCase('tr');
  const liste = TEMPLATES.filter((t) => (q ? [t.ad, t.aciklama ?? '', ...(t.etiket ?? [])].join(' ').toLocaleLowerCase('tr').includes(q) : t.kategori === kat));
  return (
    <div className="page">
      <div className="page-head">
        <h1>Modül Kütüphanesi</h1>
        <span className="muted">{TEMPLATES.length} parametrik modül – ölçüye göre şekillenir</span>
      </div>
      <input className="search" placeholder="Ara…" value={ara} onChange={(e) => setAra(e.target.value)} />
      {!q && (
        <div className="chips">
          {(Object.keys(KATEGORI_ADLARI) as ModuleCategory[]).map((k) => (
            <button key={k} className={`chip${kat === k ? ' on' : ''}`} onClick={() => setKat(k)}>
              {KATEGORI_ADLARI[k]} <small>{TEMPLATES.filter((t) => t.kategori === k).length}</small>
            </button>
          ))}
        </div>
      )}
      <div className="lib-layout">
        <div className="tpl-grid">
          {liste.map((t) => (
            <TemplateCard key={t.id} t={t} secili={sec?.id === t.id} onClick={() => setSec(t)} />
          ))}
        </div>
        {sec && <Detay key={sec.id} t={sec} onClose={() => setSec(null)} />}
      </div>
    </div>
  );
}

function Detay({ t, onClose }: { t: ModuleTemplate; onClose: () => void }) {
  const settings = useStore((s) => s.settings);
  const matMap = useMatMap();
  const [w, setW] = useState(t.w.def);
  const [h, setH] = useState(t.h.def);
  const [d, setD] = useState(t.d.def);
  const mod = useMemo(
    () => buildModule(t, { uid: 'onizleme', templateId: t.id, w, h, d }, { u: settings.uretim, secim: settings.varsayilanMalzeme, mat: (id) => (id ? matMap.get(id) : undefined) }),
    [t, w, h, d, settings, matMap],
  );
  return (
    <aside className="card lib-detail">
      <div className="card-head">
        <h3>{t.ad}</h3>
        <button className="btn ghost icon" onClick={onClose} aria-label="Kapat">
          ✕
        </button>
      </div>
      {t.aciklama && <p className="muted small">{t.aciklama}</p>}
      <div className="grid3">
        <Field label="Genişlik">
          <Num value={w} onChange={setW} min={10} max={6000} suffix="mm" />
        </Field>
        <Field label="Yükseklik">
          <Num value={h} onChange={setH} min={50} max={3500} suffix="mm" />
        </Field>
        <Field label="Derinlik">
          <Num value={d} onChange={setD} min={50} max={1200} suffix="mm" />
        </Field>
      </div>
      <Suspense fallback={<div className="loading">3D yükleniyor…</div>}>
        <Preview mod={mod} secim={settings.varsayilanMalzeme} mat={matMap} />
      </Suspense>
      <p className="small muted">
        {t.esnek ? `Esnek: ${t.w.min}–${t.w.max} mm arasında duvara göre ayarlanır.` : 'Sabit ölçülü modül.'} Kapak: {mod.kapakSayisi}, çekmece: {mod.cekmeceSayisi}
      </p>
      {mod.uyarilar.map((u, i) => (
        <p key={i} className="warn small">
          ⚠ {u}
        </p>
      ))}
      <div className="table-wrap">
        <table className="tbl small">
          <thead>
            <tr>
              <th>Parça</th>
              <th>Boy × En × Kal.</th>
              <th>Adet</th>
            </tr>
          </thead>
          <tbody>
            {mod.parts.map((p, i) => (
              <tr key={i}>
                <td>{p.ad}</td>
                <td>
                  {mm(p.boy)} × {mm(p.en)} × {p.kalinlik}
                </td>
                <td>{p.adet}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h4>Donanım</h4>
      <ul className="small hw-list">
        {mod.hardware.map((x) => (
          <li key={x.malzemeId}>
            {matMap.get(x.malzemeId)?.ad ?? x.malzemeId}: <b>{Math.round(x.adet * 100) / 100}</b> {matMap.get(x.malzemeId)?.birim === 'paket' ? 'adet' : matMap.get(x.malzemeId)?.birim}
          </li>
        ))}
      </ul>
    </aside>
  );
}
