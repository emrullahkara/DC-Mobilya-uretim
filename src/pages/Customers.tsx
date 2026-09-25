import { useState } from 'react';
import { bugun, uid, useStore } from '../store';
import { git } from '../router';
import { DURUM_ADI, Empty, Field, Modal, tarih } from '../ui/common';
import NewProjectModal from './NewProjectModal';
import type { Customer } from '../engine/types';

export default function Customers() {
  const customers = useStore((s) => s.customers);
  const projects = useStore((s) => s.projects);
  const upsert = useStore((s) => s.upsertCustomer);
  const remove = useStore((s) => s.removeCustomer);
  const [ara, setAra] = useState('');
  const [duzen, setDuzen] = useState<Customer | null>(null);
  const [isAc, setIsAc] = useState<string | null>(null);
  const q = ara.toLocaleLowerCase('tr');
  const liste = customers.filter((c) => !q || [c.ad, c.telefon, c.adres].join(' ').toLocaleLowerCase('tr').includes(q));

  return (
    <div className="page">
      <div className="page-head">
        <h1>Müşteriler</h1>
        <button className="btn primary" onClick={() => setDuzen({ id: uid(), ad: '', tarih: bugun() })}>
          + Yeni müşteri
        </button>
      </div>
      <input className="search" placeholder="Ara: ad, telefon, adres" value={ara} onChange={(e) => setAra(e.target.value)} />
      {liste.length === 0 ? (
        <Empty>Müşteri yok.</Empty>
      ) : (
        <div className="cards">
          {liste.map((c) => {
            const isler = projects.filter((p) => p.musteriId === c.id);
            return (
              <div key={c.id} className="card cust">
                <div className="card-head">
                  <h3>{c.ad}</h3>
                  <button className="btn small" onClick={() => setDuzen(c)}>
                    Düzenle
                  </button>
                </div>
                {c.telefon && (
                  <p>
                    <a href={`tel:${c.telefon}`}>📞 {c.telefon}</a>
                  </p>
                )}
                {c.adres && <p className="muted small">{c.adres}</p>}
                {isler.map((p) => (
                  <button key={p.id} className="list-row small" onClick={() => git('proje', p.id, 'tasarim')}>
                    <span>
                      {p.ad} <small>{tarih(p.tarih)}</small>
                    </span>
                    <span className={`badge d-${p.durum}`}>{DURUM_ADI[p.durum]}</span>
                  </button>
                ))}
                <button className="btn small ghost" onClick={() => setIsAc(c.id)}>
                  + Bu müşteriye yeni iş
                </button>
              </div>
            );
          })}
        </div>
      )}
      {duzen && (
        <Modal title={customers.some((c) => c.id === duzen.id) ? 'Müşteri düzenle' : 'Yeni müşteri'} onClose={() => setDuzen(null)}>
          <div className="grid2">
            <Field label="Ad Soyad / Firma">
              <input value={duzen.ad} onChange={(e) => setDuzen({ ...duzen, ad: e.target.value })} autoFocus />
            </Field>
            <Field label="Telefon">
              <input value={duzen.telefon ?? ''} inputMode="tel" onChange={(e) => setDuzen({ ...duzen, telefon: e.target.value })} />
            </Field>
            <Field label="E-posta">
              <input value={duzen.eposta ?? ''} inputMode="email" onChange={(e) => setDuzen({ ...duzen, eposta: e.target.value })} />
            </Field>
            <Field label="Adres" wide>
              <textarea rows={2} value={duzen.adres ?? ''} onChange={(e) => setDuzen({ ...duzen, adres: e.target.value })} />
            </Field>
            <Field label="Not" wide>
              <textarea rows={2} value={duzen.not ?? ''} onChange={(e) => setDuzen({ ...duzen, not: e.target.value })} />
            </Field>
          </div>
          <div className="modal-actions">
            {customers.some((c) => c.id === duzen.id) && (
              <button
                className="btn danger ghost"
                onClick={() => {
                  remove(duzen.id);
                  setDuzen(null);
                }}
              >
                Sil
              </button>
            )}
            <button className="btn" onClick={() => setDuzen(null)}>
              Vazgeç
            </button>
            <button
              className="btn primary"
              disabled={!duzen.ad.trim()}
              onClick={() => {
                upsert({ ...duzen, ad: duzen.ad.trim() });
                setDuzen(null);
              }}
            >
              Kaydet
            </button>
          </div>
        </Modal>
      )}
      {isAc && <NewProjectModal tur="mutfak" musteriId={isAc} onClose={() => setIsAc(null)} />}
    </div>
  );
}
