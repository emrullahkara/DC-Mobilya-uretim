import { useStore } from '../store';
import { Field, MatSelect, useMatMap } from '../ui/common';
import type { MaterialChoice, MaterialGroup, Project } from '../engine/types';

const SLOTLAR: { k: keyof MaterialChoice; ad: string; gruplar: MaterialGroup[]; ipucu?: string; filtre?: 'plaka' | 'bant' }[] = [
  { k: 'govde', ad: 'Gövde plakası', gruplar: ['govde'], ipucu: 'Yan, alt, üst tabla, raf, dikme' },
  { k: 'govdeBant', ad: 'Gövde kenar bandı', gruplar: ['bant'], ipucu: 'Genelde 0,4 mm – gövde rengine uygun' },
  { k: 'arkalik', ad: 'Arkalık', gruplar: ['arkalik', 'govde'], ipucu: '3 mm / 5 mm çakma, 8 mm kanallı (Ayarlar → Üretim)' },
  { k: 'kapak', ad: 'Kapak malzemesi', gruplar: ['kapak'], ipucu: 'Plaka (fason kesim) veya hazır kapak (m² sipariş)' },
  { k: 'kapakBant', ad: 'Kapak kenar bandı', gruplar: ['bant'], ipucu: 'Kapak malzemesinin kendi bandı varsa o kullanılır' },
  { k: 'cekmeceGovde', ad: 'Çekmece gövdesi', gruplar: ['govde'], ipucu: 'Çekmece yan, ön, arka' },
  { k: 'cekmeceTaban', ad: 'Çekmece tabanı', gruplar: ['arkalik', 'govde'] },
  { k: 'mentese', ad: 'Menteşe', gruplar: ['mentese'], ipucu: 'Düz = tam bindirme, yarım deve boynu = ara dikmede, deve boynu = gömme' },
  { k: 'ray', ad: 'Çekmece rayı / sistemi', gruplar: ['ray'], ipucu: 'Ray boyu dolap derinliğine göre otomatik seçilir' },
  { k: 'kulp', ad: 'Kulp', gruplar: ['kulp', 'profil'], ipucu: 'Profil kulpta cephe genişliği kadar metre hesaplanır' },
  { k: 'ayak', ad: 'Ayak', gruplar: ['ayak'], ipucu: 'Yükseklik: Ayarlar → Üretim → ayak yüksekliği' },
  { k: 'baza', ad: 'Baza', gruplar: ['ayak', 'profil'] },
  { k: 'tezgah', ad: 'Tezgah', gruplar: ['tezgah'] },
  { k: 'cam', ad: 'Cam (camlı kapaklar)', gruplar: ['cam'] },
  { k: 'ayna', ad: 'Ayna (aynalı kapaklar)', gruplar: ['cam'] },
  { k: 'askiBorusu', ad: 'Askı borusu', gruplar: ['aksesuar'] },
];

const PAKETLER: { ad: string; aciklama: string; secim: Partial<MaterialChoice> }[] = [
  {
    ad: 'Ekonomik',
    aciklama: 'Suntalam gövde, MDFlam kapak, normal menteşe ve teleskopik ray',
    secim: { kapak: 'kapak-mdflam-18-beyaz', kapakBant: 'bant-1-beyaz', mentese: 'mentese-duz', ray: 'ray-teleskopik-45' },
  },
  {
    ad: 'Standart',
    aciklama: 'Membran kapak, frenli menteşe, frenli teleskopik ray',
    secim: { kapak: 'kapak-membran-duz', mentese: 'mentese-duz-frenli', ray: 'ray-teleskopik-frenli-45' },
  },
  {
    ad: 'Lüks',
    aciklama: 'Lake kapak, Blum menteşe, gizli frenli ray',
    secim: { kapak: 'kapak-lake-mat', mentese: 'mentese-blum-cliptop', ray: 'ray-gizli-frenli-45' },
  },
];

export default function MaterialChoiceTab({ p }: { p: Project }) {
  const updateProject = useStore((s) => s.updateProject);
  const updateSettings = useStore((s) => s.updateSettings);
  const varsayilan = useStore((s) => s.settings.varsayilanMalzeme);
  const matMap = useMatMap();
  const set = (k: keyof MaterialChoice, v: string) =>
    updateProject(p.id, (x) => {
      x.malzeme[k] = v;
      // Kapak değişince eşleşen bandı otomatik seç
      if (k === 'kapak' && matMap.get(v)?.bantId) x.malzeme.kapakBant = matMap.get(v)!.bantId!;
      if (k === 'govde' && matMap.get(v)?.bantId) x.malzeme.govdeBant = matMap.get(v)!.bantId!;
    });

  return (
    <div className="stack">
      <section className="card">
        <h3>Hızlı kalite paketi</h3>
        <div className="paketler">
          {PAKETLER.map((pk) => (
            <button
              key={pk.ad}
              className="paket"
              onClick={() =>
                updateProject(p.id, (x) => {
                  for (const [k, v] of Object.entries(pk.secim)) if (v && matMap.has(v)) x.malzeme[k as keyof MaterialChoice] = v;
                })
              }
            >
              <b>{pk.ad}</b>
              <small>{pk.aciklama}</small>
            </button>
          ))}
        </div>
      </section>
      <section className="card">
        <div className="card-head">
          <h3>Bu işin malzemeleri</h3>
          <div className="row-actions">
            <button className="btn small" onClick={() => updateProject(p.id, (x) => (x.malzeme = { ...varsayilan }))}>
              Varsayılana dön
            </button>
            <button className="btn small" onClick={() => updateSettings((s) => (s.varsayilanMalzeme = { ...p.malzeme }))}>
              Bunu varsayılan yap
            </button>
          </div>
        </div>
        <div className="grid-mat">
          {SLOTLAR.map((s) => {
            const m = matMap.get(p.malzeme[s.k]);
            return (
              <Field key={s.k} label={s.ad} hint={s.ipucu}>
                <MatSelect value={p.malzeme[s.k]} onChange={(v) => set(s.k, v)} gruplar={s.gruplar} />
                {m && (
                  <span className="mat-info">
                    <i className="swatch" style={{ background: m.renk ?? '#ddd' }} />
                    {m.kod}
                    {m.kalinlik ? ` · ${m.kalinlik} mm` : ''}
                    {m.plakaBoy ? ` · ${m.plakaBoy}×${m.plakaEn}` : ''}
                    {m.temin === 'hazir' ? ' · hazır kapak (m² sipariş)' : ''}
                  </span>
                )}
              </Field>
            );
          })}
        </div>
      </section>
    </div>
  );
}
