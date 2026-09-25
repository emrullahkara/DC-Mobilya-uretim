import { useState } from 'react';
import { useStore } from '../store';
import { git } from '../router';
import { DURUM_ADI, Empty, Modal, Text, useHesap } from '../ui/common';
import DesignTab from './DesignTab';
import MaterialChoiceTab from './MaterialChoiceTab';
import QuoteTab from './QuoteTab';
import BomTab from './BomTab';
import CutTab from './CutTab';
import type { Project } from '../engine/types';

const TABS = [
  { k: 'tasarim', ad: '1. Ölçü & Tasarım' },
  { k: 'malzeme', ad: '2. Malzeme Seçimi' },
  { k: 'teklif', ad: '3. Teklif' },
  { k: 'liste', ad: '4. Malzeme Listesi' },
  { k: 'kesim', ad: '5. Kesim Listesi' },
];

export default function ProjectEditor({ id, tab }: { id: string; tab: string }) {
  const p = useStore((s) => s.projects.find((x) => x.id === id));
  const customers = useStore((s) => s.customers);
  const updateProject = useStore((s) => s.updateProject);
  const removeProject = useStore((s) => s.removeProject);
  const duplicateProject = useStore((s) => s.duplicateProject);
  const hesap = useHesap(p);
  const [silSor, setSilSor] = useState(false);

  if (!p || !hesap)
    return (
      <div className="page">
        <Empty>
          İş bulunamadı. <button className="btn" onClick={() => git('projeler')}>İşlere dön</button>
        </Empty>
      </div>
    );

  const up = (fn: (x: Project) => void) => updateProject(p.id, fn);

  return (
    <div className="page project">
      <div className="proj-head no-print">
        <div className="proj-title">
          <input className="title-input" value={p.ad} onChange={(e) => up((x) => (x.ad = e.target.value))} aria-label="İş adı" />
          <div className="proj-meta">
            <span className="muted">No: {p.no}</span>
            <select value={p.musteriId ?? ''} onChange={(e) => up((x) => (x.musteriId = e.target.value || undefined))}>
              <option value="">— Müşteri seçin —</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.ad}
                </option>
              ))}
            </select>
            <select className={`badge-select d-${p.durum}`} value={p.durum} onChange={(e) => up((x) => (x.durum = e.target.value as Project['durum']))}>
              {Object.entries(DURUM_ADI).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="proj-actions">
          <div className="total-pill" title="KDV dahil genel toplam">
            <small>Teklif</small>
            <b>{new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(hesap.fiyat.genelToplam)}</b>
          </div>
          <button
            className="btn"
            onClick={() => {
              const c = duplicateProject(p.id);
              if (c) git('proje', c.id, tab);
            }}
          >
            Kopyala
          </button>
          <button className="btn danger" onClick={() => setSilSor(true)}>
            Sil
          </button>
        </div>
      </div>
      <nav className="tabs no-print">
        {TABS.map((t) => (
          <button key={t.k} className={tab === t.k ? 'on' : ''} onClick={() => git('proje', p.id, t.k)}>
            {t.ad}
          </button>
        ))}
      </nav>
      {hesap.eksikMalzemeler.length > 0 && (
        <div className="alert no-print">
          ⚠ Kütüphanede bulunamayan malzeme: {hesap.eksikMalzemeler.join(', ')} – “Malzeme Seçimi” sekmesinden yeniden seçin.
        </div>
      )}
      {tab === 'tasarim' && <DesignTab p={p} hesap={hesap} />}
      {tab === 'malzeme' && <MaterialChoiceTab p={p} />}
      {tab === 'teklif' && <QuoteTab p={p} hesap={hesap} />}
      {tab === 'liste' && <BomTab p={p} hesap={hesap} />}
      {tab === 'kesim' && <CutTab p={p} hesap={hesap} />}
      {tab === 'tasarim' && (
        <section className="card no-print">
          <h3>İş notu</h3>
          <Text value={p.not} onChange={(v) => up((x) => (x.not = v))} multiline placeholder="Müşteri istekleri, renk, kulp modeli, montaj notları…" />
        </section>
      )}
      {silSor && (
        <Modal title="İşi sil" onClose={() => setSilSor(false)}>
          <p>
            <b>{p.ad}</b> kalıcı olarak silinecek. Emin misiniz?
          </p>
          <div className="modal-actions">
            <button className="btn" onClick={() => setSilSor(false)}>
              Vazgeç
            </button>
            <button
              className="btn danger"
              onClick={() => {
                removeProject(p.id);
                git('projeler');
              }}
            >
              Evet, sil
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
