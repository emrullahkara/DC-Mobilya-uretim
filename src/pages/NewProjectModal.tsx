import { useState } from 'react';
import { bugun, uid, useStore, yeniDuvar } from '../store';
import { git } from '../router';
import { Field, Modal, Num } from '../ui/common';
import { gardiropOner, mutfakOner, vestiyerOner, type IsTuru } from '../data/presets';
import { onerilenKapak } from '../engine/layout';

const TUR_ADI: Record<IsTuru, string> = { mutfak: 'Mutfak', gardirop: 'Gardırop', vestiyer: 'Vestiyer', bos: 'Proje' };

export default function NewProjectModal({ tur: ilkTur, onClose, musteriId }: { tur: IsTuru; onClose: () => void; musteriId?: string }) {
  const customers = useStore((s) => s.customers);
  const upsertCustomer = useStore((s) => s.upsertCustomer);
  const createProject = useStore((s) => s.createProject);
  const kapakMax = useStore((s) => s.settings.uretim.kapakMaxGen);
  const [tur, setTur] = useState<IsTuru>(ilkTur);
  const [mId, setMId] = useState(musteriId ?? '');
  const [mAd, setMAd] = useState('');
  const [mTel, setMTel] = useState('');
  const [ad, setAd] = useState('');
  const [uzunluk, setUzunluk] = useState(tur === 'gardirop' ? 2600 : tur === 'vestiyer' ? 1600 : 3200);
  const [yukseklik, setYukseklik] = useState(2600);
  const [kapak, setKapak] = useState(6);
  const [duzen, setDuzen] = useState<'ikili' | 'tekli'>('ikili');
  const [yukluk, setYukluk] = useState(false);
  const [otomatik, setOtomatik] = useState(true);
  const [lDuvar, setLDuvar] = useState(0);

  const olustur = () => {
    let musteri = mId;
    if (!musteri && mAd.trim()) {
      musteri = uid();
      upsertCustomer({ id: musteri, ad: mAd.trim(), telefon: mTel.trim(), tarih: bugun() });
    }
    const duvar = yeniDuvar(tur === 'mutfak' ? 'Duvar 1' : TUR_ADI[tur]);
    duvar.uzunluk = uzunluk;
    duvar.yukseklik = yukseklik;
    duvar.tezgah = tur === 'mutfak';
    const duvarlar = [duvar];
    if (otomatik) {
      // L mutfakta 1. duvarın sonuna köşe dolap gelir; öneri kalan uzunluğa göre yapılır
      if (tur === 'mutfak') Object.assign(duvar, mutfakOner(lDuvar > 0 ? uzunluk - 1100 : uzunluk));
      if (tur === 'gardirop') Object.assign(duvar, gardiropOner(uzunluk, yukseklik, kapak, duzen, yukluk));
      if (tur === 'vestiyer') Object.assign(duvar, vestiyerOner(uzunluk));
    }
    if (tur === 'mutfak' && lDuvar > 0) {
      // L mutfak: 1. duvarın sonunda kör köşe dolap (kör kısım köşede), 2. duvar köşeden
      // dolap derinliği + kapak + kulp payı (600 mm) sonra başlar.
      if (otomatik) {
        duvar.alt.push({ uid: uid(), templateId: 'alt-kose', w: 1100, h: 820, d: 560, yon: 'sol' });
        duvar.ust.push({ uid: uid(), templateId: 'ust-kose', w: 750, h: 720, d: 320, yon: 'sol' });
      }
      const d2 = yeniDuvar('Duvar 2 (L)');
      d2.uzunluk = lDuvar;
      d2.yukseklik = yukseklik;
      d2.tezgah = true;
      d2.basBosluk = 600;
      d2.ustBasOfset = -260;
      if (otomatik) {
        // 2. duvar: çekmeceli + kapaklı modüllerle doldur
        const kalan = Math.max(300, lDuvar - 600);
        const o = mutfakOner(kalan);
        const ilk = o.alt.findIndex((m) => m.templateId === 'alt-evye');
        if (ilk >= 0) {
          o.alt[ilk] = { ...o.alt[ilk], templateId: 'alt-3-cekmece', w: Math.min(o.alt[ilk].w, 900) };
          o.ust[ilk] = { ...o.ust[ilk], templateId: 'ust-cift-kapak' };
        }
        Object.assign(d2, o);
      }
      duvarlar.push(d2);
    }
    const p = createProject({ ad: ad.trim() || `${TUR_ADI[tur]}${mAd ? ' – ' + mAd : ''}`, musteriId: musteri || undefined, duvarlar });
    onClose();
    git('proje', p.id, 'tasarim');
  };

  return (
    <Modal title="Yeni İş / Teklif" onClose={onClose}>
      <div className="seg">
        {(['mutfak', 'gardirop', 'vestiyer', 'bos'] as IsTuru[]).map((t) => (
          <button key={t} className={tur === t ? 'on' : ''} onClick={() => setTur(t)}>
            {t === 'bos' ? 'Diğer' : TUR_ADI[t]}
          </button>
        ))}
      </div>
      <div className="grid2">
        <Field label="Müşteri">
          <select value={mId} onChange={(e) => setMId(e.target.value)}>
            <option value="">+ Yeni müşteri</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.ad}
              </option>
            ))}
          </select>
        </Field>
        {!mId && (
          <>
            <Field label="Müşteri adı">
              <input value={mAd} onChange={(e) => setMAd(e.target.value)} placeholder="Ad Soyad" />
            </Field>
            <Field label="Telefon">
              <input value={mTel} onChange={(e) => setMTel(e.target.value)} inputMode="tel" placeholder="05xx" />
            </Field>
          </>
        )}
        <Field label="İş adı">
          <input value={ad} onChange={(e) => setAd(e.target.value)} placeholder={`${TUR_ADI[tur]} – ...`} />
        </Field>
        <Field label={tur === 'mutfak' ? 'Duvar ölçüsü (sağdan sola)' : 'Toplam genişlik'} hint="Duvardan duvara ölçü">
          <Num value={uzunluk} onChange={setUzunluk} min={200} max={20000} suffix="mm" />
        </Field>
        <Field label="Tavan yüksekliği">
          <Num value={yukseklik} onChange={setYukseklik} min={1000} max={5000} suffix="mm" />
        </Field>
        {tur === 'mutfak' && (
          <Field label="L köşe – 2. duvar ölçüsü" hint="L mutfak değilse 0 bırakın">
            <Num value={lDuvar} onChange={setLDuvar} min={0} max={20000} suffix="mm" />
          </Field>
        )}
        {tur === 'gardirop' && (
          <>
            <Field label="Kapak sayısı" hint={`Önerilen: ${onerilenKapak(uzunluk, kapakMax)} (her kapak ≤ ${kapakMax} mm)`}>
              <Num value={kapak} onChange={setKapak} min={1} max={16} />
            </Field>
            <Field label="Modül düzeni" hint={`Kapak genişliği ≈ ${Math.round(uzunluk / Math.max(1, kapak))} mm`}>
              <select value={duzen} onChange={(e) => setDuzen(e.target.value as 'ikili' | 'tekli')}>
                <option value="ikili">2 kapaklı modüller ({Math.floor(kapak / 2)} × 2{kapak % 2 ? ' + 1 tek' : ''})</option>
                <option value="tekli">Tek kapaklı modüller ({kapak} × 1)</option>
              </select>
            </Field>
            <Field label="Üstte yüklük">
              <select value={yukluk ? '1' : '0'} onChange={(e) => setYukluk(e.target.value === '1')}>
                <option value="0">Yok – tavana kadar gövde</option>
                <option value="1">Var – ayrı yüklük modülleri</option>
              </select>
            </Field>
          </>
        )}
      </div>
      {tur !== 'bos' && (
        <label className="check">
          <input type="checkbox" checked={otomatik} onChange={(e) => setOtomatik(e.target.checked)} /> Modülleri ölçüye göre otomatik yerleştir (sonra değiştirilebilir)
        </label>
      )}
      <div className="modal-actions">
        <button className="btn" onClick={onClose}>
          Vazgeç
        </button>
        <button className="btn primary" onClick={olustur}>
          Oluştur ve tasarla →
        </button>
      </div>
    </Modal>
  );
}
