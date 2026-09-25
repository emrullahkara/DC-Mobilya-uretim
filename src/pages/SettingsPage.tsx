import { useRef, useState } from 'react';
import { useStore } from '../store';
import { Field, Modal, Num, Text, indir } from '../ui/common';
import { VARSAYILAN_AYARLAR } from '../data/defaults';
import type { Settings } from '../engine/types';

type U = Settings['uretim'];

export default function SettingsPage() {
  const settings = useStore((s) => s.settings);
  const updateSettings = useStore((s) => s.updateSettings);
  const importAll = useStore((s) => s.importAll);
  const [mesaj, setMesaj] = useState<string>();
  const [yukleOnay, setYukleOnay] = useState<null | Record<string, unknown>>(null);
  const logoRef = useRef<HTMLInputElement>(null);
  const yedekRef = useRef<HTMLInputElement>(null);
  const u = settings.uretim;
  const setU = <K extends keyof U>(k: K, v: U[K]) => updateSettings((s) => (s.uretim[k] = v));
  const setFirma = <K extends keyof Settings['firma']>(k: K, v: Settings['firma'][K]) => updateSettings((s) => (s.firma[k] = v));

  const logoYukle = (f: File) => {
    const img = new Image();
    const url = URL.createObjectURL(f);
    img.onload = () => {
      const oran = Math.min(1, 400 / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * oran);
      c.height = Math.round(img.height * oran);
      c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
      setFirma('logo', c.toDataURL('image/png'));
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const yedekAl = () => {
    const s = useStore.getState();
    const data = { uygulama: 'dc-mobilya-uretim', surum: 1, tarih: new Date().toISOString(), materials: s.materials, projects: s.projects, customers: s.customers, settings: s.settings };
    indir(new Blob([JSON.stringify(data)], { type: 'application/json' }), `DC_Mobilya_Yedek_${new Date().toISOString().slice(0, 10)}.json`);
  };
  const yedekOku = async (f: File) => {
    try {
      const d = JSON.parse(await f.text());
      if (d.uygulama !== 'dc-mobilya-uretim') throw new Error('Bu dosya DC Mobilya yedeği değil.');
      setYukleOnay(d);
    } catch (e) {
      setMesaj(`Yedek okunamadı: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  return (
    <div className="page">
      <div className="page-head">
        <h1>Ayarlar</h1>
      </div>
      {mesaj && (
        <div className="info" onClick={() => setMesaj(undefined)}>
          {mesaj}
        </div>
      )}

      <section className="card">
        <h3>Firma bilgileri (teklif formunda görünür)</h3>
        <div className="grid2">
          <Field label="Firma adı">
            <Text value={settings.firma.ad} onChange={(v) => setFirma('ad', v)} />
          </Field>
          <Field label="Telefon">
            <Text value={settings.firma.telefon} onChange={(v) => setFirma('telefon', v)} />
          </Field>
          <Field label="E-posta">
            <Text value={settings.firma.eposta} onChange={(v) => setFirma('eposta', v)} />
          </Field>
          <Field label="Vergi dairesi / no">
            <Text value={settings.firma.vergi} onChange={(v) => setFirma('vergi', v)} />
          </Field>
          <Field label="Adres" wide>
            <Text value={settings.firma.adres} onChange={(v) => setFirma('adres', v)} />
          </Field>
          <Field label="IBAN">
            <Text value={settings.firma.iban} onChange={(v) => setFirma('iban', v)} />
          </Field>
          <Field label="Teklif geçerlilik süresi">
            <Num value={settings.firma.teklifGecerlilik} onChange={(v) => setFirma('teklifGecerlilik', v)} min={1} max={365} suffix="gün" />
          </Field>
          <Field label="Logo">
            <span className="row2">
              {settings.firma.logo && <img src={settings.firma.logo} alt="logo" className="logo-prev" />}
              <button className="btn small" onClick={() => logoRef.current?.click()}>
                Logo seç
              </button>
              {settings.firma.logo && (
                <button className="btn small ghost" onClick={() => setFirma('logo', undefined)}>
                  Kaldır
                </button>
              )}
              <input ref={logoRef} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && logoYukle(e.target.files[0])} />
            </span>
          </Field>
          <Field label="Teklif şartları (her satır bir madde)" wide>
            <Text value={settings.firma.teklifSartlari} onChange={(v) => setFirma('teklifSartlari', v)} multiline />
          </Field>
        </div>
      </section>

      <section className="card">
        <div className="card-head">
          <h3>Üretim kuralları (kesim listesi bu kurallarla hesaplanır)</h3>
          <button className="btn small" onClick={() => updateSettings((s) => (s.uretim = { ...VARSAYILAN_AYARLAR.uretim }))}>
            Varsayılanlara dön
          </button>
        </div>
        <h4>Gövde</h4>
        <div className="grid3">
          <Field label="Gövde birleşimi" hint="Yanların alt/üst tablaya göre durumu">
            <select value={u.govdeBirlesim} onChange={(e) => setU('govdeBirlesim', e.target.value as U['govdeBirlesim'])}>
              <option value="yanAltaBasar">Yanlar alt tablaya basar, üst tabla yanlara biner</option>
              <option value="yanAltaBasarUstArada">Yanlar alt tablaya basar, üst tabla yanların arasında</option>
              <option value="yanTamBoy">Yanlar tam boy, alt ve üst tabla arada</option>
            </select>
          </Field>
          <Field label="Arkalık montajı">
            <select value={u.arkalikTipi} onChange={(e) => setU('arkalikTipi', e.target.value as U['arkalikTipi'])}>
              <option value="kanal">Kanallı (arkalık kanala geçer)</option>
              <option value="cakma">Çakma (arkadan vida / zımba)</option>
            </select>
          </Field>
          {u.arkalikTipi === 'kanal' && (
            <>
              <Field label="Kanal derinliği">
                <Num value={u.kanalDerinlik} onChange={(v) => setU('kanalDerinlik', v)} min={0} max={20} suffix="mm" />
              </Field>
              <Field label="Kanalın arka kenara mesafesi">
                <Num value={u.kanalMesafe} onChange={(v) => setU('kanalMesafe', v)} min={0} max={50} suffix="mm" />
              </Field>
            </>
          )}
          <Field label="Alt dolap kuşak genişliği">
            <Num value={u.kusakGen} onChange={(v) => setU('kusakGen', v)} min={50} max={200} suffix="mm" />
          </Field>
          <Field label="Ayak / baza yüksekliği" hint="8, 10, 12, 14 cm ayak">
            <Num value={u.ayakYukseklik} onChange={(v) => setU('ayakYukseklik', v)} min={0} max={250} suffix="mm" />
          </Field>
        </div>
        <h4>Kapak ve raf</h4>
        <div className="grid3">
          <Field label="Kapak dış kenar boşluğu" hint="Gövde kenarından içeri (her kenar)">
            <Num value={u.kapakKenarBosluk} onChange={(v) => setU('kapakKenarBosluk', v)} min={0} max={10} step={0.5} suffix="mm" />
          </Field>
          <Field label="Kapaklar arası boşluk">
            <Num value={u.kapakAraBosluk} onChange={(v) => setU('kapakAraBosluk', v)} min={0} max={10} step={0.5} suffix="mm" />
          </Field>
          <Field label="Tek kapak azami genişlik" hint="Aşarsa otomatik 2 kapak">
            <Num value={u.kapakMaxGen} onChange={(v) => setU('kapakMaxGen', v)} min={300} max={1200} suffix="mm" />
          </Field>
          <Field label="Ayarlı raf yan boşluğu (toplam)">
            <Num value={u.rafYanBosluk} onChange={(v) => setU('rafYanBosluk', v)} min={0} max={10} suffix="mm" />
          </Field>
          <Field label="Raf önden geri çekme">
            <Num value={u.rafOnGeri} onChange={(v) => setU('rafOnGeri', v)} min={0} max={100} suffix="mm" />
          </Field>
          <Field label="Raflar arası hedef aralık" hint="Otomatik raf sayısı için">
            <Num value={u.rafAralik} onChange={(v) => setU('rafAralik', v)} min={150} max={800} suffix="mm" />
          </Field>
        </div>
        <h4>Çekmece</h4>
        <div className="grid3">
          <Field label="Teleskopik ray – toplam yan boşluk" hint="Kutu dış genişliği = iç genişlik − bu değer (12,5+12,5 ≈ 26)">
            <Num value={u.rayBosluk.teleskopik} onChange={(v) => updateSettings((s) => (s.uretim.rayBosluk.teleskopik = v))} min={0} max={60} suffix="mm" />
          </Field>
          <Field label="Gizli ray – toplam yan boşluk">
            <Num value={u.rayBosluk.gizli} onChange={(v) => updateSettings((s) => (s.uretim.rayBosluk.gizli = v))} min={0} max={60} suffix="mm" />
          </Field>
          <Field label="Kutu yüksekliği (cepheden kısa)">
            <Num value={u.cekmeceYukseklikFark} onChange={(v) => setU('cekmeceYukseklikFark', v)} min={10} max={200} suffix="mm" />
          </Field>
          <Field label="Ray arkası boşluk">
            <Num value={u.cekmeceArkaBosluk} onChange={(v) => setU('cekmeceArkaBosluk', v)} min={0} max={100} suffix="mm" />
          </Field>
          <Field label="Çekmece tabanı">
            <select value={u.cekmeceTaban} onChange={(e) => setU('cekmeceTaban', e.target.value as U['cekmeceTaban'])}>
              <option value="cakma">Alttan çakma</option>
              <option value="kanal">Kanallı</option>
            </select>
          </Field>
        </div>
        <h4>Kesim ve optimizasyon</h4>
        <div className="grid3">
          <label className="check">
            <input type="checkbox" checked={u.bantDus} onChange={(e) => setU('bantDus', e.target.checked)} /> Bant kalınlığını kesim ölçüsünden düş
          </label>
          <Field label="Testere kalınlığı">
            <Num value={u.testere} onChange={(v) => setU('testere', v)} min={0} max={10} step={0.5} suffix="mm" />
          </Field>
          <Field label="Plaka kenar tıraşı (her kenar)">
            <Num value={u.kenarTiras} onChange={(v) => setU('kenarTiras', v)} min={0} max={50} suffix="mm" />
          </Field>
          <Field label="Bant fire payı (her kenara)">
            <Num value={u.bantFirePay} onChange={(v) => setU('bantFirePay', v)} min={0} max={200} suffix="mm" />
          </Field>
          <Field label="Genel fire / sarf payı" hint="Malzeme maliyetine eklenir">
            <Num value={u.plakaFireYuzde} onChange={(v) => setU('plakaFireYuzde', v)} min={0} max={50} suffix="%" />
          </Field>
          <label className="check">
            <input type="checkbox" checked={u.modulBirlestirme} onChange={(e) => setU('modulBirlestirme', e.target.checked)} /> Modül birleştirme vidası ekle
          </label>
        </div>
        <h4>Mutfak</h4>
        <div className="grid3">
          <Field label="Tezgah derinliği">
            <Num value={u.tezgahDerinlik} onChange={(v) => setU('tezgahDerinlik', v)} min={300} max={1200} suffix="mm" />
          </Field>
          <Field label="Tezgah kalınlığı">
            <Num value={u.tezgahKalinlik} onChange={(v) => setU('tezgahKalinlik', v)} min={4} max={100} suffix="mm" />
          </Field>
          <Field label="Üst dolap alt kotu (yerden)" hint="Tezgah üstü ile arası ≈ 55–65 cm">
            <Num value={u.ustDolapAltKot} onChange={(v) => setU('ustDolapAltKot', v)} min={900} max={2500} suffix="mm" />
          </Field>
        </div>
      </section>

      <section className="card">
        <h3>Yedekleme ve cihaz değişimi</h3>
        <p className="muted small">
          Verileriniz bu cihazın tarayıcısında saklanır; internet olmadan çalışır. Telefon ↔ bilgisayar arasında aktarmak veya yedeklemek için yedek dosyasını kullanın. Tarayıcı verilerini silmek kayıtları siler – düzenli yedek alın.
        </p>
        <div className="row-actions">
          <button className="btn primary" onClick={yedekAl}>
            ⬇ Yedek al (JSON)
          </button>
          <button className="btn" onClick={() => yedekRef.current?.click()}>
            ⬆ Yedekten geri yükle
          </button>
          <input ref={yedekRef} type="file" accept=".json,application/json" hidden onChange={(e) => e.target.files?.[0] && yedekOku(e.target.files[0])} />
        </div>
      </section>

      <section className="card">
        <h3>Uygulamayı yükle</h3>
        <p className="small">
          <b>Android (Chrome):</b> menü ⋮ → “Ana ekrana ekle / Uygulamayı yükle”. <b>iPhone (Safari):</b> Paylaş → “Ana Ekrana Ekle”. <b>Bilgisayar (Chrome/Edge):</b> adres çubuğundaki yükle simgesi. Yüklendikten sonra internetsiz açılır.
        </p>
      </section>

      {yukleOnay && (
        <Modal title="Yedekten geri yükle" onClose={() => setYukleOnay(null)}>
          <p>
            Yedek tarihi: <b>{new Date(String(yukleOnay.tarih)).toLocaleString('tr-TR')}</b> – {(yukleOnay.projects as unknown[])?.length ?? 0} iş, {(yukleOnay.customers as unknown[])?.length ?? 0} müşteri.
          </p>
          <p>Bu cihazdaki mevcut veriler yedekteki verilerle DEĞİŞTİRİLECEK.</p>
          <div className="modal-actions">
            <button className="btn" onClick={() => setYukleOnay(null)}>
              Vazgeç
            </button>
            <button
              className="btn danger"
              onClick={() => {
                importAll(yukleOnay as never);
                setYukleOnay(null);
                setMesaj('Yedek yüklendi.');
              }}
            >
              Yükle
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
