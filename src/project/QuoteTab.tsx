import { useStore, bugun } from '../store';
import type { ProjeHesap } from '../engine/calc';
import type { PriceOptions, Project } from '../engine/types';
import { Field, Num, Text, sayi, tarih, tl, useMatMap, yazdir } from '../ui/common';
import { WallElevation } from '../ui/FrontSvg';

export default function QuoteTab({ p, hesap }: { p: Project; hesap: ProjeHesap }) {
  const updateProject = useStore((s) => s.updateProject);
  const updateSettings = useStore((s) => s.updateSettings);
  const firma = useStore((s) => s.settings.firma);
  const musteri = useStore((s) => s.customers.find((c) => c.id === p.musteriId));
  const matMap = useMatMap();
  const f = hesap.fiyat;
  const o = p.fiyat;
  const setF = (fn: (x: PriceOptions) => void) => updateProject(p.id, (x) => fn(x.fiyat));
  const odenen = (p.odemeler ?? []).reduce((s, x) => s + x.tutar, 0);
  const matAd = (id: string) => matMap.get(id)?.ad ?? '-';
  const gecerlilik = new Date(new Date(p.tarih).getTime() + firma.teklifGecerlilik * 86400000).toISOString();

  const whatsapp = () => {
    const satirlar = [
      `*${firma.ad} – Fiyat Teklifi*`,
      `Teklif No: ${p.no} (${tarih(p.tarih)})`,
      musteri ? `Sayın ${musteri.ad},` : '',
      `${p.ad}: ${hesap.modulSayisi} modül, ${sayi(f.metretul)} metretül`,
      `Kapak: ${matAd(p.malzeme.kapak)} · Gövde: ${matAd(p.malzeme.govde)}`,
      o.kdvDahil ? `Toplam: *${tl(f.genelToplam)}* (KDV dahil)` : `Toplam: *${tl(f.netFiyat)}* + KDV`,
      `Teklif geçerlilik: ${tarih(gecerlilik)}`,
      firma.telefon ? `Tel: ${firma.telefon}` : '',
    ].filter(Boolean);
    const tel = (musteri?.telefon ?? '').replace(/\D/g, '').replace(/^0/, '90');
    window.open(`https://wa.me/${tel}?text=${encodeURIComponent(satirlar.join('\n'))}`, '_blank');
  };

  return (
    <div className="stack">
      <div className="quote-layout no-print">
        <section className="card">
          <h3>Maliyet dökümü (usta görür)</h3>
          <table className="tbl cost">
            <tbody>
              <tr>
                <td>Plaka (gövde, arkalık, kapak kesim)</td>
                <td>{tl(f.plaka)}</td>
              </tr>
              <tr>
                <td>Hazır kapak (membran, lake, akrilik…)</td>
                <td>{tl(f.hazirKapak)}</td>
              </tr>
              <tr>
                <td>Cam / ayna</td>
                <td>{tl(f.cam)}</td>
              </tr>
              <tr>
                <td>Kenar bandı</td>
                <td>{tl(f.bant)}</td>
              </tr>
              <tr>
                <td>Hırdavat, aksesuar, bağlantı</td>
                <td>{tl(f.donanim)}</td>
              </tr>
              <tr>
                <td>Tezgah</td>
                <td>{tl(f.tezgah)}</td>
              </tr>
              <tr className="sub">
                <td>Malzeme toplamı</td>
                <td>{tl(f.malzemeToplam)}</td>
              </tr>
              <tr>
                <td>Fire / sarf payı</td>
                <td>{tl(f.fire)}</td>
              </tr>
              <tr>
                <td>İşçilik</td>
                <td>{tl(f.iscilik)}</td>
              </tr>
              <tr>
                <td>Montaj + nakliye + ek kalemler</td>
                <td>{tl(f.montaj + f.nakliye + f.ekler)}</td>
              </tr>
              <tr className="sub">
                <td>Ara toplam (maliyet)</td>
                <td>{tl(f.araToplam)}</td>
              </tr>
              <tr>
                <td>Kâr (%{o.kar})</td>
                <td>{tl(f.kar)}</td>
              </tr>
              {f.iskonto > 0 && (
                <tr>
                  <td>İskonto (%{o.iskonto})</td>
                  <td>−{tl(f.iskonto)}</td>
                </tr>
              )}
              <tr className="sub">
                <td>Net teklif (KDV hariç){o.elleFiyat ? ' – elle girildi' : ''}</td>
                <td>{tl(f.netFiyat)}</td>
              </tr>
              {o.kdvDahil && (
                <tr>
                  <td>KDV (%{o.kdv})</td>
                  <td>{tl(f.kdv)}</td>
                </tr>
              )}
              <tr className="total">
                <td>Genel toplam</td>
                <td>{tl(f.genelToplam)}</td>
              </tr>
              <tr>
                <td className="muted">Metretül ({sayi(f.metretul)} m) başına net</td>
                <td className="muted">{tl(f.metretulFiyat)}</td>
              </tr>
              <tr>
                <td className="muted">Kâr marjı (net fiyata göre)</td>
                <td className="muted">%{sayi(f.netFiyat > 0 ? ((f.netFiyat - f.araToplam) / f.netFiyat) * 100 : 0, 1)}</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section className="card">
          <h3>Fiyat ayarları</h3>
          <div className="grid2">
            <Field label="İşçilik hesabı">
              <select value={o.iscilikTipi} onChange={(e) => setF((x) => (x.iscilikTipi = e.target.value as PriceOptions['iscilikTipi']))}>
                <option value="yuzde">Malzemenin yüzdesi</option>
                <option value="modul">Modül başına sabit</option>
                <option value="metretul">Metretül başına</option>
              </select>
            </Field>
            <Field label={o.iscilikTipi === 'yuzde' ? 'İşçilik %' : o.iscilikTipi === 'modul' ? 'Modül başı işçilik' : 'Metretül başı işçilik'}>
              <Num value={o.iscilikDeger} onChange={(v) => setF((x) => (x.iscilikDeger = v))} min={0} suffix={o.iscilikTipi === 'yuzde' ? '%' : '₺'} />
            </Field>
            <Field label="Kâr oranı">
              <Num value={o.kar} onChange={(v) => setF((x) => (x.kar = v))} min={0} max={500} suffix="%" />
            </Field>
            <Field label="İskonto">
              <Num value={o.iskonto} onChange={(v) => setF((x) => (x.iskonto = v))} min={0} max={100} suffix="%" />
            </Field>
            <Field label="Montaj">
              <Num value={o.montaj} onChange={(v) => setF((x) => (x.montaj = v))} min={0} suffix="₺" />
            </Field>
            <Field label="Nakliye">
              <Num value={o.nakliye} onChange={(v) => setF((x) => (x.nakliye = v))} min={0} suffix="₺" />
            </Field>
            <Field label="KDV">
              <span className="row2">
                <select value={o.kdvDahil ? '1' : '0'} onChange={(e) => setF((x) => (x.kdvDahil = e.target.value === '1'))}>
                  <option value="1">KDV ekle</option>
                  <option value="0">KDV yok / hariç</option>
                </select>
                <Num value={o.kdv} onChange={(v) => setF((x) => (x.kdv = v))} min={0} max={100} suffix="%" />
              </span>
            </Field>
            <Field label="Pazarlık sonrası net fiyat" hint="Boş bırakılırsa hesaplanan fiyat kullanılır (KDV hariç)">
              <Num value={o.elleFiyat} onChange={(v) => setF((x) => (x.elleFiyat = v > 0 ? v : undefined))} min={0} suffix="₺" placeholder={String(Math.round(f.teklifNet - f.iskonto))} />
            </Field>
          </div>
          <h4>Ek kalemler</h4>
          {o.ekKalemler.map((e, i) => (
            <div key={i} className="row2 ek">
              <Text value={e.ad} onChange={(v) => setF((x) => (x.ekKalemler[i].ad = v))} placeholder="Örn. LED aydınlatma işçiliği" />
              <Num value={e.tutar} onChange={(v) => setF((x) => (x.ekKalemler[i].tutar = v))} suffix="₺" />
              <button className="btn ghost icon" onClick={() => setF((x) => x.ekKalemler.splice(i, 1))} aria-label="Sil">
                ✕
              </button>
            </div>
          ))}
          <button className="btn small" onClick={() => setF((x) => x.ekKalemler.push({ ad: '', tutar: 0 }))}>
            + Ek kalem
          </button>
          <div className="row-actions top">
            <button className="btn small" onClick={() => updateSettings((s) => (s.varsayilanFiyat = { ...p.fiyat, elleFiyat: undefined }))}>
              Bu ayarları varsayılan yap
            </button>
          </div>
        </section>
      </div>

      <section className="card no-print">
        <div className="card-head">
          <h3>Tahsilat</h3>
          <span>
            Ödenen <b>{tl(odenen)}</b> · Kalan <b>{tl(f.genelToplam - odenen)}</b>
          </span>
        </div>
        {(p.odemeler ?? []).map((od, i) => (
          <div key={i} className="row2 ek">
            <input type="date" value={od.tarih} onChange={(e) => updateProject(p.id, (x) => (x.odemeler![i].tarih = e.target.value))} />
            <Num value={od.tutar} onChange={(v) => updateProject(p.id, (x) => (x.odemeler![i].tutar = v))} suffix="₺" />
            <Text value={od.not} onChange={(v) => updateProject(p.id, (x) => (x.odemeler![i].not = v))} placeholder="Kapora, nakit, havale…" />
            <button className="btn ghost icon" onClick={() => updateProject(p.id, (x) => x.odemeler!.splice(i, 1))} aria-label="Sil">
              ✕
            </button>
          </div>
        ))}
        <button className="btn small" onClick={() => updateProject(p.id, (x) => (x.odemeler = [...(x.odemeler ?? []), { tarih: bugun(), tutar: 0, not: 'Kapora' }]))}>
          + Ödeme ekle
        </button>
      </section>

      <div className="row-actions no-print">
        <button className="btn primary" onClick={yazdir}>
          🖨 Teklifi yazdır / PDF
        </button>
        <button className="btn" onClick={whatsapp}>
          WhatsApp ile gönder
        </button>
        {p.durum === 'taslak' && (
          <button className="btn" onClick={() => updateProject(p.id, (x) => (x.durum = 'teklif'))}>
            Teklif verildi olarak işaretle
          </button>
        )}
        {(p.durum === 'taslak' || p.durum === 'teklif') && (
          <button className="btn success" onClick={() => updateProject(p.id, (x) => (x.durum = 'onay'))}>
            ✔ Müşteri onayladı – siparişe çevir
          </button>
        )}
      </div>

      {/* Müşteri teklif formu – ekranda önizleme, yazdırmada tek başına */}
      <section className="card print-doc quote-doc">
        <header className="doc-head">
          <div>
            {firma.logo && <img src={firma.logo} alt="" className="logo" />}
            <h2>{firma.ad}</h2>
            <small>
              {firma.adres}
              {firma.telefon && <> · {firma.telefon}</>}
              {firma.eposta && <> · {firma.eposta}</>}
            </small>
          </div>
          <div className="doc-no">
            <b>FİYAT TEKLİFİ</b>
            <span>No: {p.no}</span>
            <span>Tarih: {tarih(p.tarih)}</span>
            <span>Geçerlilik: {tarih(gecerlilik)}</span>
          </div>
        </header>
        <div className="doc-customer">
          <div>
            <small>Sayın</small>
            <b>{musteri?.ad ?? '—'}</b>
            <span>{musteri?.telefon}</span>
            <span>{musteri?.adres}</span>
          </div>
          <div>
            <small>İş</small>
            <b>{p.ad}</b>
            <span>
              {hesap.modulSayisi} modül · {hesap.kapakSayisi} kapak · {hesap.cekmeceSayisi} çekmece · {sayi(f.metretul)} metretül
            </span>
          </div>
        </div>
        {p.duvarlar.map((w, i) => (
          <div key={w.id} className="doc-wall">
            <h4>
              {w.ad} – {w.uzunluk} mm
            </h4>
            <WallElevation yerlesimler={hesap.yerlesimler.filter((y) => y.wallIndex === i)} tezgahlar={hesap.tezgahlar.filter((t) => t.wallIndex === i)} uzunluk={w.uzunluk} yukseklik={w.yukseklik} />
          </div>
        ))}
        <h4>Ürün özellikleri</h4>
        <table className="tbl small">
          <tbody>
            <tr>
              <td>Gövde</td>
              <td>{matAd(p.malzeme.govde)}</td>
            </tr>
            <tr>
              <td>Kapak</td>
              <td>{matAd(p.malzeme.kapak)}</td>
            </tr>
            <tr>
              <td>Arkalık</td>
              <td>{matAd(p.malzeme.arkalik)}</td>
            </tr>
            <tr>
              <td>Menteşe</td>
              <td>{matAd(p.malzeme.mentese)}</td>
            </tr>
            <tr>
              <td>Çekmece rayı</td>
              <td>{matAd(p.malzeme.ray)}</td>
            </tr>
            <tr>
              <td>Kulp</td>
              <td>{matAd(p.malzeme.kulp)}</td>
            </tr>
            {hesap.tezgahlar.length > 0 && (
              <tr>
                <td>Tezgah</td>
                <td>{matAd(p.malzeme.tezgah)}</td>
              </tr>
            )}
          </tbody>
        </table>
        <h4>Modüller</h4>
        <table className="tbl small">
          <thead>
            <tr>
              <th>#</th>
              <th>Modül</th>
              <th>Ölçü (G×Y×D)</th>
            </tr>
          </thead>
          <tbody>
            {hesap.yerlesimler
              .filter((y) => y.mod.parts.length > 0)
              .map((y) => (
                <tr key={y.mod.uid}>
                  <td>{y.etiket}</td>
                  <td>{y.mod.ad}</td>
                  <td>
                    {Math.round(y.mod.w)} × {y.mod.h} × {y.mod.d}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
        <div className="doc-total">
          {f.iskonto > 0 && !o.elleFiyat && (
            <div>
              <span>Liste fiyatı</span>
              <span>{tl(f.teklifNet)}</span>
            </div>
          )}
          {f.iskonto > 0 && !o.elleFiyat && (
            <div>
              <span>İskonto (%{o.iskonto})</span>
              <span>−{tl(f.iskonto)}</span>
            </div>
          )}
          <div>
            <span>Toplam (KDV hariç)</span>
            <span>{tl(f.netFiyat)}</span>
          </div>
          {o.kdvDahil && (
            <div>
              <span>KDV %{o.kdv}</span>
              <span>{tl(f.kdv)}</span>
            </div>
          )}
          <div className="grand">
            <span>GENEL TOPLAM</span>
            <span>{tl(f.genelToplam)}</span>
          </div>
        </div>
        {firma.teklifSartlari && (
          <div className="doc-terms">
            <h4>Şartlar</h4>
            <ul>
              {firma.teklifSartlari
                .split('\n')
                .filter((s) => s.trim())
                .map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
            </ul>
          </div>
        )}
        {firma.iban && <p className="small">IBAN: {firma.iban}</p>}
        <div className="doc-sign">
          <div>Firma onayı</div>
          <div>Müşteri onayı</div>
        </div>
      </section>
    </div>
  );
}
