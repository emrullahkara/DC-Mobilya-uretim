import { useStore } from '../store';
import type { ProjeHesap } from '../engine/calc';
import type { Project } from '../engine/types';
import { GROUP_LABELS } from '../data/materials';
import { mm, sayi, tl, yazdir } from '../ui/common';
import { kapakSiparisXlsx, satinAlmaXlsx } from '../export/excel';

export default function BomTab({ p, hesap }: { p: Project; hesap: ProjeHesap }) {
  const settings = useStore((s) => s.settings);
  const musteri = useStore((s) => s.customers.find((c) => c.id === p.musteriId));
  const grup = new Map<string, typeof hesap.donanimlar>();
  for (const d of hesap.donanimlar) grup.set(d.malzeme.grup, [...(grup.get(d.malzeme.grup) ?? []), d]);

  return (
    <div className="stack print-doc">
      <div className="row-actions no-print">
        <button className="btn primary" onClick={yazdir}>
          🖨 Yazdır / PDF
        </button>
        <button className="btn" onClick={() => satinAlmaXlsx(p, hesap, settings, musteri)}>
          ⬇ Satın alma listesi (Excel)
        </button>
        {(hesap.hazirKapaklar.length > 0 || hesap.camlar.length > 0) && (
          <button className="btn" onClick={() => kapakSiparisXlsx(p, hesap, settings, musteri)}>
            ⬇ Kapak / cam sipariş listesi (Excel)
          </button>
        )}
      </div>
      <header className="print-only doc-head">
        <div>
          <h2>{settings.firma.ad} – Malzeme Listesi</h2>
          <small>
            {p.no} · {p.ad} · {musteri?.ad}
          </small>
        </div>
      </header>

      <section className="card">
        <h3>Plaka ihtiyacı (fason kesim)</h3>
        <div className="table-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Kod</th>
                <th>Malzeme</th>
                <th>Plaka ölçüsü</th>
                <th>Parça</th>
                <th>Parça alanı</th>
                <th>Plaka</th>
                <th>Verim</th>
                <th>Tutar</th>
              </tr>
            </thead>
            <tbody>
              {hesap.plakalar.map((pl) => (
                <tr key={pl.malzeme.id}>
                  <td>{pl.malzeme.kod}</td>
                  <td>{pl.malzeme.ad}</td>
                  <td>
                    {pl.malzeme.plakaBoy}×{pl.malzeme.plakaEn}
                  </td>
                  <td>{pl.satirlar.reduce((s, r) => s + r.adet, 0)}</td>
                  <td>{sayi(pl.parcaAlan)} m²</td>
                  <td>
                    <b>{pl.plakaSayisi}</b>
                  </td>
                  <td>%{sayi(pl.nest.verim * 100, 0)}</td>
                  <td>{tl(pl.tutar)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {hesap.hazirKapaklar.length > 0 && (
        <section className="card">
          <h3>Hazır kapak siparişi (m²)</h3>
          {hesap.hazirKapaklar.map((g) => (
            <div key={g.malzeme.id}>
              <h4>
                {g.malzeme.ad} – {sayi(g.alan, 3)} m² · {tl(g.tutar)}
              </h4>
              <div className="table-wrap">
                <table className="tbl small">
                  <thead>
                    <tr>
                      <th>No</th>
                      <th>Parça</th>
                      <th>Boy</th>
                      <th>En</th>
                      <th>Adet</th>
                      <th>Modül</th>
                    </tr>
                  </thead>
                  <tbody>
                    {g.satirlar.map((r) => (
                      <tr key={r.no}>
                        <td>{r.no}</td>
                        <td>{r.ad}</td>
                        <td>{mm(r.boy)}</td>
                        <td>{mm(r.en)}</td>
                        <td>{r.adet}</td>
                        <td className="muted">{r.moduller}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </section>
      )}

      {hesap.camlar.length > 0 && (
        <section className="card">
          <h3>Cam / ayna siparişi</h3>
          {hesap.camlar.map((g) => (
            <div key={g.malzeme.id}>
              <h4>
                {g.malzeme.ad} – {sayi(g.alan, 3)} m² · {tl(g.tutar)}
              </h4>
              <table className="tbl small">
                <tbody>
                  {g.satirlar.map((r) => (
                    <tr key={r.no}>
                      <td>{r.ad}</td>
                      <td>
                        {mm(r.boy)} × {mm(r.en)}
                      </td>
                      <td>{r.adet} adet</td>
                      <td className="muted">{r.not}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </section>
      )}

      <section className="card">
        <h3>Kenar bandı</h3>
        <table className="tbl">
          <thead>
            <tr>
              <th>Kod</th>
              <th>Bant</th>
              <th>Metre (fire dahil)</th>
              <th>Tutar</th>
            </tr>
          </thead>
          <tbody>
            {hesap.bantlar.map((b) => (
              <tr key={b.malzeme.id}>
                <td>{b.malzeme.kod}</td>
                <td>{b.malzeme.ad}</td>
                <td>{sayi(b.metre, 1)} mt</td>
                <td>{tl(b.tutar)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="card">
        <h3>Hırdavat, aksesuar, bağlantı elemanları</h3>
        {[...grup.entries()].map(([g, list]) => (
          <div key={g}>
            <h4>{GROUP_LABELS[g as keyof typeof GROUP_LABELS] ?? g}</h4>
            <div className="table-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Kod</th>
                    <th>Malzeme</th>
                    <th>Gereken</th>
                    <th>Alınacak</th>
                    <th>Tutar</th>
                    <th className="hide-sm">Not</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((d) => (
                    <tr key={d.malzeme.id}>
                      <td>{d.malzeme.kod}</td>
                      <td>{d.malzeme.ad}</td>
                      <td>
                        {sayi(d.miktar, 2)} {d.malzeme.birim === 'paket' ? 'adet' : d.malzeme.birim === 'm2' ? 'm²' : d.malzeme.birim}
                      </td>
                      <td>
                        <b>
                          {sayi(d.alim, 2)} {d.alimBirim}
                        </b>
                      </td>
                      <td>{tl(d.tutar)}</td>
                      <td className="muted hide-sm">{d.notlar.join(', ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </section>

      <section className="card">
        <h3>Modül listesi (montaj föyü)</h3>
        <div className="table-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Etiket</th>
                <th>Modül</th>
                <th>G × Y × D</th>
                <th>Kapak</th>
                <th>Çekmece</th>
                <th>Parça</th>
                <th>Not</th>
              </tr>
            </thead>
            <tbody>
              {hesap.yerlesimler
                .filter((y) => y.mod.parts.length > 0)
                .map((y) => {
                  const pm = p.duvarlar[y.wallIndex][y.lane].find((m) => m.uid === y.mod.uid);
                  return (
                    <tr key={y.mod.uid}>
                      <td>
                        <b>{y.etiket}</b>
                      </td>
                      <td>{y.mod.ad}</td>
                      <td>
                        {Math.round(y.mod.w)} × {y.mod.h} × {y.mod.d}
                      </td>
                      <td>{y.mod.kapakSayisi}</td>
                      <td>{y.mod.cekmeceSayisi}</td>
                      <td>{y.mod.parts.reduce((s, x) => s + x.adet, 0)}</td>
                      <td className="muted">{pm?.not}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
        <p className="muted small">Etiket: D = duvar, A = alt sıra, U = üst sıra (soldan sağa). Kesim listesindeki “Modül” sütunu bu etiketleri kullanır.</p>
      </section>
    </div>
  );
}
