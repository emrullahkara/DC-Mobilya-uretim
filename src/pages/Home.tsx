import { useState } from 'react';
import { useStore } from '../store';
import { git } from '../router';
import { DURUM_ADI, tarih } from '../ui/common';
import NewProjectModal from './NewProjectModal';
import type { IsTuru } from '../data/presets';

export default function Home() {
  const projects = useStore((s) => s.projects);
  const customers = useStore((s) => s.customers);
  const [yeni, setYeni] = useState<IsTuru | null>(null);
  const say = (d: string[]) => projects.filter((p) => d.includes(p.durum)).length;
  const musteri = (id?: string) => customers.find((c) => c.id === id)?.ad ?? '—';

  return (
    <div className="page">
      <section className="hero">
        <h1>Ölçüyü gir, teklifi ver, kesim listesini al.</h1>
        <p>Müşteride duvarı ölç, modülleri seç, fiyatı hemen göster. Sipariş onaylanınca malzeme ve fason kesim listeleri hazır.</p>
        <div className="quick">
          <button className="quick-card" onClick={() => setYeni('mutfak')}>
            <span className="qi">🍳</span>
            <b>Mutfak Dolabı</b>
            <small>Duvar ölçüsünden otomatik dizilim</small>
          </button>
          <button className="quick-card" onClick={() => setYeni('gardirop')}>
            <span className="qi">🚪</span>
            <b>Gardırop</b>
            <small>Genişlik ÷ kapak sayısı</small>
          </button>
          <button className="quick-card" onClick={() => setYeni('vestiyer')}>
            <span className="qi">🧥</span>
            <b>Vestiyer / Portmanto</b>
            <small>Ayakkabılık, askılık, puf</small>
          </button>
          <button className="quick-card" onClick={() => setYeni('bos')}>
            <span className="qi">📦</span>
            <b>Boş Proje</b>
            <small>Komidin, şifonyer, banyo, TV…</small>
          </button>
        </div>
      </section>

      <section className="stats">
        <div className="stat">
          <b>{say(['taslak', 'teklif'])}</b>
          <span>Açık teklif</span>
        </div>
        <div className="stat">
          <b>{say(['onay', 'uretim'])}</b>
          <span>Üretimdeki sipariş</span>
        </div>
        <div className="stat">
          <b>{say(['montaj'])}</b>
          <span>Montaj bekleyen</span>
        </div>
        <div className="stat">
          <b>{customers.length}</b>
          <span>Müşteri</span>
        </div>
      </section>

      <section className="card">
        <div className="card-head">
          <h2>Son işler</h2>
          <button className="btn ghost" onClick={() => git('projeler')}>
            Tümü →
          </button>
        </div>
        {projects.length === 0 ? (
          <p className="muted">Henüz iş yok. Yukarıdan bir iş türü seçerek başlayın.</p>
        ) : (
          <div className="list">
            {projects.slice(0, 8).map((p) => (
              <button key={p.id} className="list-row" onClick={() => git('proje', p.id, 'tasarim')}>
                <span>
                  <b>{p.ad}</b>
                  <small>
                    {p.no} · {musteri(p.musteriId)} · {tarih(p.tarih)}
                  </small>
                </span>
                <span className={`badge d-${p.durum}`}>{DURUM_ADI[p.durum]}</span>
              </button>
            ))}
          </div>
        )}
      </section>
      {yeni && <NewProjectModal tur={yeni} onClose={() => setYeni(null)} />}
    </div>
  );
}
