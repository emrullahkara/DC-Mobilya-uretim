import { useState } from 'react';
import { useStore } from '../store';
import { git } from '../router';
import { DURUM_ADI, Empty, tarih } from '../ui/common';
import NewProjectModal from './NewProjectModal';
import type { Project } from '../engine/types';

export default function Projects() {
  const projects = useStore((s) => s.projects);
  const customers = useStore((s) => s.customers);
  const [ara, setAra] = useState('');
  const [durum, setDurum] = useState<Project['durum'] | ''>('');
  const [yeni, setYeni] = useState(false);
  const q = ara.toLocaleLowerCase('tr');
  const musteri = (id?: string) => customers.find((c) => c.id === id);
  const liste = projects.filter(
    (p) => (!durum || p.durum === durum) && (!q || [p.ad, p.no, musteri(p.musteriId)?.ad ?? '', musteri(p.musteriId)?.telefon ?? ''].join(' ').toLocaleLowerCase('tr').includes(q)),
  );

  return (
    <div className="page">
      <div className="page-head">
        <h1>İşler</h1>
        <button className="btn primary" onClick={() => setYeni(true)}>
          + Yeni iş / teklif
        </button>
      </div>
      <div className="filters">
        <input className="search" placeholder="Ara: iş adı, no, müşteri, telefon" value={ara} onChange={(e) => setAra(e.target.value)} />
        <select value={durum} onChange={(e) => setDurum(e.target.value as Project['durum'] | '')}>
          <option value="">Tüm durumlar</option>
          {Object.entries(DURUM_ADI).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </div>
      {liste.length === 0 ? (
        <Empty>Kayıt yok.</Empty>
      ) : (
        <div className="list">
          {liste.map((p) => {
            const modul = p.duvarlar.reduce((s, w) => s + w.alt.length + w.ust.filter((m) => !m.ref).length, 0);
            return (
              <button key={p.id} className="list-row" onClick={() => git('proje', p.id, 'tasarim')}>
                <span>
                  <b>{p.ad}</b>
                  <small>
                    {p.no} · {musteri(p.musteriId)?.ad ?? 'Müşterisiz'} · {tarih(p.tarih)} · {p.duvarlar.length} duvar, {modul} modül
                  </small>
                </span>
                <span className={`badge d-${p.durum}`}>{DURUM_ADI[p.durum]}</span>
              </button>
            );
          })}
        </div>
      )}
      {yeni && <NewProjectModal tur="mutfak" onClose={() => setYeni(false)} />}
    </div>
  );
}
