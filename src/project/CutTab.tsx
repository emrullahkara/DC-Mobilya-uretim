import { useState } from 'react';
import { useStore } from '../store';
import type { PlakaOzet, ProjeHesap } from '../engine/calc';
import type { Material, Project } from '../engine/types';
import { mm, sayi, useMatMap, yazdir } from '../ui/common';
import { bantKodu, kesimCsv, kesimXlsx } from '../export/excel';

export default function CutTab({ p, hesap }: { p: Project; hesap: ProjeHesap }) {
  const settings = useStore((s) => s.settings);
  const musteri = useStore((s) => s.customers.find((c) => c.id === p.musteriId));
  const mat = useMatMap();
  const [yerlesim, setYerlesim] = useState(true);
  const [hata, setHata] = useState<string>();

  const disa = async (f: () => Promise<void> | void) => {
    try {
      setHata(undefined);
      await f();
    } catch (e) {
      setHata(String(e));
    }
  };

  return (
    <div className="stack print-doc">
      <div className="row-actions no-print">
        <button className="btn primary" onClick={() => disa(() => kesimXlsx(p, hesap, mat, settings, musteri))}>
          ⬇ Fason kesim listesi (Excel)
        </button>
        <button className="btn" onClick={() => disa(() => kesimCsv(p, hesap, mat))}>
          ⬇ CSV
        </button>
        <button className="btn" onClick={yazdir}>
          🖨 Yazdır / PDF
        </button>
        <label className="check">
          <input type="checkbox" checked={yerlesim} onChange={(e) => setYerlesim(e.target.checked)} /> Plaka yerleşim çizimleri
        </label>
      </div>
      {hata && <div className="alert">{hata}</div>}
      <div className="info no-print">
        {settings.uretim.bantDus ? (
          <>Ölçüler <b>kesim ölçüsüdür</b> – bant kalınlıkları düşülmüştür.</>
        ) : (
          <>Ölçüler <b>bantlı net ölçüdür</b>. Fasoncunuz bant payını makinede düşer. (Ayarlar → Üretim → “Bant kalınlığını kesimden düş”)</>
        )}{' '}
        Boy = damar yönü. Testere payı {settings.uretim.testere} mm, kenar tıraşı {settings.uretim.kenarTiras} mm.
      </div>
      <header className="print-only doc-head">
        <div>
          <h2>{settings.firma.ad} – Fason Kesim Listesi</h2>
          <small>
            {p.no} · {p.ad} · {musteri?.ad} · {new Date().toLocaleDateString('tr-TR')} · {settings.uretim.bantDus ? 'Kesim ölçüsü (bant düşülmüş)' : 'Bantlı net ölçü'}
          </small>
        </div>
      </header>
      {hesap.plakalar.map((pl) => (
        <PlakaBolum key={pl.malzeme.id} pl={pl} mat={mat} yerlesim={yerlesim} />
      ))}
      {hesap.plakalar.length === 0 && <div className="empty">Kesilecek parça yok – önce tasarıma modül ekleyin.</div>}
    </div>
  );
}

function PlakaBolum({ pl, mat, yerlesim }: { pl: PlakaOzet; mat: Map<string, Material>; yerlesim: boolean }) {
  const bk = (id?: string) => {
    const s = bantKodu(id, mat);
    return s ? <span title={mat.get(id!)?.ad}>{s.split(' ')[0]}</span> : <span className="muted">–</span>;
  };
  return (
    <section className="card cut-section">
      <div className="card-head">
        <h3>
          {pl.malzeme.ad} <small className="muted">({pl.malzeme.kod})</small>
        </h3>
        <span className="badge">
          {pl.plakaSayisi} plaka · {pl.satirlar.reduce((s, r) => s + r.adet, 0)} parça · %{sayi(pl.nest.verim * 100, 0)} verim
        </span>
      </div>
      {pl.nest.sigmayan.length > 0 && <div className="alert">⚠ {pl.nest.sigmayan.length} parça plakaya sığmıyor (plaka ölçüsünü aşıyor) – ek parçalı yapılmalı.</div>}
      <div className="table-wrap">
        <table className="tbl cut">
          <thead>
            <tr>
              <th>No</th>
              <th>Parça</th>
              <th>Boy</th>
              <th>En</th>
              <th>Adet</th>
              <th title="Boy kenar bantları">Boy bant</th>
              <th title="En kenar bantları">En bant</th>
              <th className="hide-sm">Modül</th>
              <th className="hide-sm">Not</th>
            </tr>
          </thead>
          <tbody>
            {pl.satirlar.map((r) => (
              <tr key={r.no}>
                <td>{r.no}</td>
                <td>{r.ad}</td>
                <td>
                  <b>{mm(r.kesimBoy)}</b>
                </td>
                <td>
                  <b>{mm(r.kesimEn)}</b>
                </td>
                <td>{r.adet}</td>
                <td className="bant">
                  {bk(r.kenar.b1)} {bk(r.kenar.b2)}
                </td>
                <td className="bant">
                  {bk(r.kenar.e1)} {bk(r.kenar.e2)}
                </td>
                <td className="muted hide-sm">{r.moduller}</td>
                <td className="muted hide-sm small">{r.not}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {yerlesim && (
        <div className="sheets">
          {pl.nest.sheets.map((s, i) => (
            <figure key={i} className="sheet">
              <svg viewBox={`0 0 ${pl.nest.plakaBoy} ${pl.nest.plakaEn}`} preserveAspectRatio="xMidYMid meet">
                <rect x={0} y={0} width={pl.nest.plakaBoy} height={pl.nest.plakaEn} className="sheet-bg" />
                {s.yerlesim.map((y, j) => (
                  <g key={j}>
                    <rect x={y.x} y={y.y} width={y.l} height={y.w} className="sheet-part" />
                    <text x={y.x + y.l / 2} y={y.y + y.w / 2} textAnchor="middle" dominantBaseline="middle" className="sheet-txt" style={{ fontSize: Math.max(40, Math.min(y.l, y.w) / 4) }}>
                      {y.part.etiket}
                    </text>
                  </g>
                ))}
              </svg>
              <figcaption>
                Plaka {i + 1} – %{sayi((s.kullanilan / (pl.nest.plakaBoy * pl.nest.plakaEn)) * 100, 0)} dolu
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </section>
  );
}
