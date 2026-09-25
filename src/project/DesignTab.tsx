import { lazy, Suspense, useMemo, useState } from 'react';
import { DndContext, KeyboardSensor, PointerSensor, TouchSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, horizontalListSortingStrategy, sortableKeyboardCoordinates, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { uid, useStore, yeniDuvar } from '../store';
import { TEMPLATES, TEMPLATE_MAP } from '../data/templates';
import { fitWall, normalizeUst, YER_TUTUCU, type Placement } from '../engine/layout';
import { gardiropOner, mutfakOner, vestiyerOner } from '../data/presets';
import type { ProjeHesap } from '../engine/calc';
import type { ModuleTemplate, PlacedModule, Project, Wall } from '../engine/types';
import { Field, MatSelect, Modal, Num, Text, Uyarilar, mm, useMatMap } from '../ui/common';
import ModulePicker from './ModulePicker';
import type { SceneOpts } from '../three/Scene3D';

const Scene = lazy(() => import('../three/Scene3D').then((m) => ({ default: m.ProjectScene })));
const Preview = lazy(() => import('../three/Scene3D').then((m) => ({ default: m.ModulePreview })));

type Lane = 'alt' | 'ust';

export default function DesignTab({ p, hesap }: { p: Project; hesap: ProjeHesap }) {
  const updateProject = useStore((s) => s.updateProject);
  const settings = useStore((s) => s.settings);
  const matMap = useMatMap();
  const [wi, setWi] = useState(0);
  const [secili, setSecili] = useState<string | undefined>();
  const [ekle, setEkle] = useState<Lane | null>(null);
  const [opts, setOpts] = useState<SceneOpts>({ kapaklar: 'goster', olculer: true });
  const [hepsi, setHepsi] = useState(false);
  const [sihirbaz, setSihirbaz] = useState(false);
  const [duvarSil, setDuvarSil] = useState(false);
  const [goster3d, setGoster3d] = useState(true);

  const aktif = Math.min(wi, p.duvarlar.length - 1);
  const wall = p.duvarlar[aktif];
  const fit = useMemo(() => fitWall(wall, TEMPLATE_MAP, settings.uretim.ustDolapAltKot), [wall, settings.uretim.ustDolapAltKot]);
  const upWall = (fn: (w: Wall) => void) =>
    updateProject(p.id, (x) => {
      fn(x.duvarlar[aktif]);
      x.duvarlar[aktif].ust = normalizeUst(x.duvarlar[aktif], TEMPLATE_MAP);
    });

  const seciliMod = wall.alt.find((m) => m.uid === secili) ?? wall.ust.find((m) => m.uid === secili);
  const seciliLane: Lane | undefined = wall.alt.some((m) => m.uid === secili) ? 'alt' : wall.ust.some((m) => m.uid === secili) ? 'ust' : undefined;

  const modEkle = (lane: Lane, t: ModuleTemplate) => {
    const pm: PlacedModule = { uid: uid(), templateId: t.id, w: t.w.def, h: t.h.def, d: t.d.def };
    upWall((w) => {
      const arr = w[lane];
      const idx = secili ? arr.findIndex((m) => m.uid === secili) : -1;
      if (idx >= 0 && seciliLane === lane) arr.splice(idx + 1, 0, pm);
      else arr.push(pm);
    });
    setSecili(pm.uid);
    setEkle(null);
  };

  const dolguEkle = (lane: Lane) => {
    const fark = lane === 'alt' ? fit.altFark : fit.ustFark;
    if (fark <= 0) return;
    const son = [...wall[lane]].reverse().find((m) => TEMPLATE_MAP.get(m.templateId)?.ozel === undefined);
    const kat = son ? TEMPLATE_MAP.get(son.templateId)!.kategori : 'mutfak-alt';
    const tid =
      lane === 'ust'
        ? kat === 'gardirop'
          ? 'gard-ust-bosluk'
          : 'ust-dolgu'
        : kat === 'gardirop'
          ? 'gard-dolgu'
          : kat === 'vestiyer'
            ? 'ves-dolgu'
            : kat === 'mutfak-boy'
              ? 'boy-dolgu'
              : 'alt-dolgu';
    const t = TEMPLATE_MAP.get(tid)!;
    const h = son?.h ?? t.h.def;
    upWall((w) => w[lane].push({ uid: uid(), templateId: tid, w: Math.round(fark), h, d: son?.d ?? t.d.def, kilitli: true }));
  };

  return (
    <div className="design">
      {/* Duvar sekmeleri */}
      <div className="wall-tabs">
        {p.duvarlar.map((w, i) => (
          <button key={w.id} className={i === aktif ? 'on' : ''} onClick={() => (setWi(i), setSecili(undefined))}>
            {w.ad} <small>{w.uzunluk} mm</small>
          </button>
        ))}
        <button
          className="add"
          onClick={() => {
            updateProject(p.id, (x) => x.duvarlar.push(yeniDuvar(`Duvar ${x.duvarlar.length + 1}`)));
            setWi(p.duvarlar.length);
          }}
        >
          + Duvar
        </button>
      </div>

      <section className="card wall-card">
        <div className="grid-wall">
          <Field label="Duvar adı">
            <Text value={wall.ad} onChange={(v) => upWall((w) => (w.ad = v))} />
          </Field>
          <Field label="Duvar ölçüsü (sağdan sola)">
            <Num value={wall.uzunluk} onChange={(v) => upWall((w) => (w.uzunluk = v))} min={100} max={30000} suffix="mm" />
          </Field>
          <Field label="Tavan yüksekliği">
            <Num value={wall.yukseklik} onChange={(v) => upWall((w) => (w.yukseklik = v))} min={500} max={6000} suffix="mm" />
          </Field>
          <Field label="Baştan boşluk" hint="Sol baştaki kolon, kapı vb.">
            <Num value={wall.basBosluk ?? 0} onChange={(v) => upWall((w) => (w.basBosluk = v))} min={0} max={10000} suffix="mm" />
          </Field>
          <Field label="Sondan boşluk">
            <Num value={wall.sonBosluk ?? 0} onChange={(v) => upWall((w) => (w.sonBosluk = v))} min={0} max={10000} suffix="mm" />
          </Field>
          <Field label="Üst sıra baş / son kayma" hint="Üst dolaplar alt sıradan farklı başlıyorsa">
            <span className="row2">
              <Num value={wall.ustBasOfset ?? 0} onChange={(v) => upWall((w) => (w.ustBasOfset = v))} min={-2000} max={10000} suffix="mm" />
              <Num value={wall.ustSonOfset ?? 0} onChange={(v) => upWall((w) => (w.ustSonOfset = v))} min={-2000} max={10000} suffix="mm" />
            </span>
          </Field>
          <label className="check">
            <input type="checkbox" checked={!!wall.tezgah} onChange={(e) => upWall((w) => (w.tezgah = e.target.checked))} /> Tezgah (mutfak alt dolapları üzerine)
          </label>
        </div>
        <div className="wall-actions">
          <button className="btn" onClick={() => setSihirbaz(true)}>
            ✨ Otomatik diz / Sihirbaz
          </button>
          {fit.altFark > 0.5 && wall.alt.length > 0 && (
            <button className="btn" onClick={() => dolguEkle('alt')}>
              Alt boşluğu ({Math.round(fit.altFark)} mm) dolgu ile kapat
            </button>
          )}
          {fit.ustFark > 0.5 && wall.ust.some((m) => m.templateId !== YER_TUTUCU) && (
            <button className="btn" onClick={() => dolguEkle('ust')}>
              Üst boşluğu ({Math.round(fit.ustFark)} mm) kapat
            </button>
          )}
          {p.duvarlar.length > 1 && (
            <button className="btn danger ghost" onClick={() => setDuvarSil(true)}>
              Duvarı sil
            </button>
          )}
        </div>
      </section>

      {/* 3D */}
      <section className="card view3d-card">
        <div className="view-tools">
          <div className="seg small">
            {(
              [
                ['goster', 'Kapaklı'],
                ['seffaf', 'Şeffaf'],
                ['gizle', 'İç düzen'],
              ] as const
            ).map(([k, a]) => (
              <button key={k} className={opts.kapaklar === k ? 'on' : ''} onClick={() => setOpts({ ...opts, kapaklar: k })}>
                {a}
              </button>
            ))}
          </div>
          <label className="check">
            <input type="checkbox" checked={opts.olculer} onChange={(e) => setOpts({ ...opts, olculer: e.target.checked })} /> Ölçüler
          </label>
          {p.duvarlar.length > 1 && (
            <label className="check">
              <input type="checkbox" checked={hepsi} onChange={(e) => setHepsi(e.target.checked)} /> Tüm duvarlar (L/U)
            </label>
          )}
          <button className="btn ghost small" onClick={() => setGoster3d(!goster3d)}>
            {goster3d ? '3D gizle' : '3D göster'}
          </button>
        </div>
        {goster3d && (
          <div className="view3d">
            <Suspense fallback={<div className="loading">3D yükleniyor…</div>}>
              <Scene
                yerlesimler={hesap.yerlesimler}
                tezgahlar={hesap.tezgahlar}
                duvarlar={p.duvarlar}
                aktifDuvar={aktif}
                hepsi={hepsi}
                secim={p.malzeme}
                mat={matMap}
                opts={opts}
                seciliUid={secili}
                onSelect={setSecili}
                tezgahRenk={matMap.get(p.malzeme.tezgah)?.renk ?? '#cfc8bb'}
              />
            </Suspense>
          </div>
        )}
      </section>

      {/* Şeritler */}
      <section className="card lanes-card">
        <LaneStrip
          baslik="Üst sıra (asma)"
          lane="ust"
          wall={wall}
          yerlesim={fit.ust}
          fitAlt={fit.alt}
          secili={secili}
          onSelect={setSecili}
          onReorder={(ids) => upWall((w) => (w.ust = ids.map((i) => w.ust.find((m) => m.uid === i)!)))}
          onAdd={() => setEkle('ust')}
        />
        <LaneStrip
          baslik="Alt sıra / zemin (alt, boy, gardırop, vestiyer…)"
          lane="alt"
          wall={wall}
          yerlesim={fit.alt}
          fitAlt={fit.alt}
          secili={secili}
          onSelect={setSecili}
          onReorder={(ids) => upWall((w) => (w.alt = ids.map((i) => w.alt.find((m) => m.uid === i)!)))}
          onAdd={() => setEkle('alt')}
        />
        <p className="muted small">
          Modülleri sürükleyerek sıralayın, dokunarak seçin. Esnek modüller duvar ölçüsüne göre kendini ayarlar; ölçüsünü elle girdiğiniz modül kilitlenir.
        </p>
        <Uyarilar list={fit.uyarilar} />
      </section>

      {seciliMod && seciliLane && (
        <Inspector
          key={seciliMod.uid}
          pm={seciliMod}
          lane={seciliLane}
          p={p}
          hesap={hesap}
          fitW={[...fit.alt, ...fit.ust].find((x) => x.pm.uid === seciliMod.uid)?.w}
          onChange={(fn) =>
            upWall((w) => {
              const m = w[seciliLane].find((x) => x.uid === seciliMod.uid);
              if (m) fn(m);
            })
          }
          onMove={(dir) =>
            upWall((w) => {
              const arr = w[seciliLane];
              const i = arr.findIndex((x) => x.uid === seciliMod.uid);
              const j = i + dir;
              if (i < 0 || j < 0 || j >= arr.length) return;
              w[seciliLane] = arrayMove(arr, i, j);
            })
          }
          onDup={() => {
            const n = { ...seciliMod, uid: uid() };
            upWall((w) => {
              const arr = w[seciliLane];
              arr.splice(arr.findIndex((x) => x.uid === seciliMod.uid) + 1, 0, n);
            });
            setSecili(n.uid);
          }}
          onDelete={() => {
            upWall((w) => (w[seciliLane] = w[seciliLane].filter((x) => x.uid !== seciliMod.uid)));
            setSecili(undefined);
          }}
          onClose={() => setSecili(undefined)}
        />
      )}

      {ekle && <ModulePicker lane={ekle} onPick={(t) => modEkle(ekle, t)} onClose={() => setEkle(null)} />}
      {sihirbaz && (
        <Sihirbaz
          wall={wall}
          onClose={() => setSihirbaz(false)}
          onApply={(lanes) => {
            upWall((w) => {
              w.alt = lanes.alt;
              w.ust = lanes.ust;
            });
            setSecili(undefined);
            setSihirbaz(false);
          }}
        />
      )}
      {duvarSil && (
        <Modal title="Duvarı sil" onClose={() => setDuvarSil(false)}>
          <p>
            <b>{wall.ad}</b> ve üzerindeki bütün modüller silinecek.
          </p>
          <div className="modal-actions">
            <button className="btn" onClick={() => setDuvarSil(false)}>
              Vazgeç
            </button>
            <button
              className="btn danger"
              onClick={() => {
                updateProject(p.id, (x) => x.duvarlar.splice(aktif, 1));
                setWi(0);
                setDuvarSil(false);
              }}
            >
              Sil
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------

function LaneStrip({
  baslik,
  lane,
  wall,
  yerlesim,
  fitAlt,
  secili,
  onSelect,
  onReorder,
  onAdd,
}: {
  baslik: string;
  lane: Lane;
  wall: Wall;
  yerlesim: Placement[];
  fitAlt: Placement[];
  secili?: string;
  onSelect: (uid: string) => void;
  onReorder: (ids: string[]) => void;
  onAdd: () => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const list = lane === 'ust' ? normalizeUst(wall, TEMPLATE_MAP) : wall.alt;
  const genislik = (m: PlacedModule) => {
    if (m.templateId === YER_TUTUCU) return fitAlt.find((a) => a.pm.uid === m.ref)?.w ?? m.w;
    return yerlesim.find((y) => y.pm.uid === m.uid)?.w ?? m.w;
  };
  const L = Math.max(wall.uzunluk, 1);
  const bas = (wall.basBosluk ?? 0) + (lane === 'ust' ? wall.ustBasOfset ?? 0 : 0);
  const onEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    const ids = list.map((m) => m.uid);
    const from = ids.indexOf(String(e.active.id));
    const to = ids.indexOf(String(e.over.id));
    onReorder(arrayMove(ids, from, to));
  };
  return (
    <div className="lane">
      <div className="lane-head">
        <b>{baslik}</b>
        <button className="btn small primary" onClick={onAdd}>
          + Modül ekle
        </button>
      </div>
      <div className="lane-track">
        {bas > 0 && <div className="lane-spacer" style={{ flexBasis: `${(bas / L) * 100}%` }} title={`Boşluk ${bas} mm`} />}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onEnd}>
          <SortableContext items={list.map((m) => m.uid)} strategy={horizontalListSortingStrategy}>
            {list.map((m) => (
              <LaneItem key={m.uid} m={m} w={genislik(m)} L={L} secili={secili === m.uid} onSelect={() => m.templateId !== YER_TUTUCU && onSelect(m.uid)} />
            ))}
          </SortableContext>
        </DndContext>
        {list.length === 0 && (
          <button className="lane-empty" onClick={onAdd}>
            Boş – modül eklemek için dokunun
          </button>
        )}
      </div>
    </div>
  );
}

function LaneItem({ m, w, L, secili, onSelect }: { m: PlacedModule; w: number; L: number; secili: boolean; onSelect: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: m.uid });
  const t = TEMPLATE_MAP.get(m.templateId);
  const tutucu = m.templateId === YER_TUTUCU;
  const style = {
    flexBasis: `${(w / L) * 100}%`,
    transform: CSS.Translate.toString(transform),
    transition,
    zIndex: isDragging ? 5 : undefined,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`lane-item${secili ? ' on' : ''}${tutucu ? ' tutucu' : ''}${t?.ozel === 'bosluk' ? ' bosluk' : ''}${t?.esnek && !m.kilitli ? ' esnek' : ''}`}
      onClick={onSelect}
      {...attributes}
      {...listeners}
      title={tutucu ? 'Boy dolap (alt sıradan)' : `${t?.ad} – ${Math.round(w)} mm`}
    >
      <span className="li-ad">{tutucu ? '↕ Boy dolap' : kisaAd(t?.ad ?? m.templateId)}</span>
      <span className="li-w">
        {m.kilitli ? '🔒' : ''}
        {Math.round(w)}
      </span>
    </div>
  );
}

function kisaAd(ad: string) {
  return ad.replace(/^(Alt Dolap|Üst Dolap|Gardırop|Vestiyer|Boy Dolap)\s*–\s*/, '').replace('Kapaklı', 'Kpk.');
}

// ---------------------------------------------------------------------------

function Inspector({
  pm,
  lane,
  p,
  hesap,
  fitW,
  onChange,
  onMove,
  onDup,
  onDelete,
  onClose,
}: {
  pm: PlacedModule;
  lane: Lane;
  p: Project;
  hesap: ProjeHesap;
  fitW?: number;
  onChange: (fn: (m: PlacedModule) => void) => void;
  onMove: (dir: -1 | 1) => void;
  onDup: () => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const t = TEMPLATE_MAP.get(pm.templateId);
  const matMap = useMatMap();
  const [onizle, setOnizle] = useState(false);
  const [parcalar, setParcalar] = useState(false);
  const y = hesap.yerlesimler.find((x) => x.mod.uid === pm.uid);
  if (!t) return null;
  const benzer = TEMPLATES.filter((x) => (lane === 'ust' ? x.sira === 'ust' : x.sira !== 'ust') && x.kategori === t.kategori);
  const zones = t.columns.flatMap((c) => c.zones);
  const rafVar = zones.some((z) => z.tip === 'raf');
  const cekVar = zones.some((z) => z.tip === 'cekmece' || z.tip === 'icCekmece');
  const kapakVar = t.columns.length <= 1 && zones.some((z) => (z.cephe ?? (z.tip === 'cekmece' ? 'cekmece' : z.tip === 'cihaz' ? 'acik' : 'kapak')) === 'kapak') && !t.ozel;
  const yonVar = t.ozel === 'kose' || (y?.mod.kapakSayisi === 1 && !t.ozel);
  const govdeli = !t.ozel || t.ozel === 'kose' || t.ozel === 'surgulu';

  return (
    <section className="card inspector">
      <div className="card-head">
        <h3>
          {y?.etiket} · {t.ad}
        </h3>
        <button className="btn ghost icon" onClick={onClose} aria-label="Kapat">
          ✕
        </button>
      </div>
      {t.aciklama && <p className="muted small">{t.aciklama}</p>}
      <div className="insp-grid">
        <Field label="Modül tipi">
          <select value={pm.templateId} onChange={(e) => onChange((m) => (m.templateId = e.target.value))}>
            {benzer.map((x) => (
              <option key={x.id} value={x.id}>
                {x.ad}
              </option>
            ))}
          </select>
        </Field>
        <Field label={`Genişlik ${t.esnek && !pm.kilitli ? '(esnek)' : '(sabit)'}`} hint={fitW !== undefined && Math.round(fitW) !== Math.round(pm.w) ? `Yerleşimde: ${mm(fitW)} mm` : `Aralık ${t.w.min}–${t.w.max}`}>
          <span className="row2">
            <Num
              value={pm.kilitli || !t.esnek ? pm.w : Math.round(fitW ?? pm.w)}
              onChange={(v) =>
                onChange((m) => {
                  m.w = v;
                  if (t.esnek) m.kilitli = true;
                })
              }
              min={10}
              max={6000}
              suffix="mm"
            />
            {t.esnek && (
              <button className={`btn small${pm.kilitli ? ' primary' : ''}`} onClick={() => onChange((m) => (m.kilitli = !m.kilitli))} title="Kilitli modül ölçüsünü korur">
                {pm.kilitli ? '🔒 Kilitli' : '🔓 Esnek'}
              </button>
            )}
          </span>
        </Field>
        <Field label="Yükseklik" hint={t.govde.ayak ? 'Ayak dahil toplam' : undefined}>
          <Num value={pm.h} onChange={(v) => onChange((m) => (m.h = v))} min={50} max={3500} suffix="mm" />
        </Field>
        <Field label="Derinlik" hint="Gövde (kapak hariç)">
          <Num value={pm.d} onChange={(v) => onChange((m) => (m.d = v))} min={50} max={1200} suffix="mm" />
        </Field>
        {kapakVar && (
          <Field label="Kapak adedi">
            <select value={pm.kapakAdet ?? ''} onChange={(e) => onChange((m) => (m.kapakAdet = e.target.value ? Number(e.target.value) : undefined))}>
              <option value="">Şablona göre / otomatik</option>
              {[1, 2, 3, 4].map((n) => (
                <option key={n} value={n}>
                  {n} kapak
                </option>
              ))}
            </select>
          </Field>
        )}
        {rafVar && (
          <Field label="Raf adedi">
            <select value={pm.rafAdet ?? ''} onChange={(e) => onChange((m) => (m.rafAdet = e.target.value === '' ? undefined : Number(e.target.value)))}>
              <option value="">Otomatik</option>
              {Array.from({ length: 11 }, (_, n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </Field>
        )}
        {cekVar && (
          <Field label="Çekmece adedi">
            <select value={pm.cekmeceAdet ?? ''} onChange={(e) => onChange((m) => (m.cekmeceAdet = e.target.value ? Number(e.target.value) : undefined))}>
              <option value="">Şablona göre</option>
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </Field>
        )}
        {yonVar && (
          <Field label={t.ozel === 'kose' ? 'Kapak tarafı' : 'Menteşe tarafı'}>
            <select value={pm.yon ?? (t.ozel === 'kose' ? 'sag' : 'sol')} onChange={(e) => onChange((m) => (m.yon = e.target.value as 'sol' | 'sag'))}>
              <option value="sol">Sol</option>
              <option value="sag">Sağ</option>
            </select>
          </Field>
        )}
        {govdeli && (
          <Field label="Bu modülün kapak malzemesi">
            <MatSelect value={pm.kapakMalzemeId ?? ''} onChange={(v) => onChange((m) => (m.kapakMalzemeId = v || undefined))} gruplar={['kapak']} bos={`Projedeki seçim (${matMap.get(p.malzeme.kapak)?.ad ?? '-'})`} />
          </Field>
        )}
        <Field label="Not" wide>
          <Text value={pm.not} onChange={(v) => onChange((m) => (m.not = v))} placeholder="Örn. priz kesimi, tesisat deliği" />
        </Field>
      </div>
      {y && <Uyarilar list={y.mod.uyarilar} />}
      <div className="insp-actions">
        <button className="btn" onClick={() => onMove(-1)}>
          ← Sola
        </button>
        <button className="btn" onClick={() => onMove(1)}>
          Sağa →
        </button>
        <button className="btn" onClick={onDup}>
          Çoğalt
        </button>
        {y && y.mod.parts.length > 0 && (
          <>
            <button className="btn" onClick={() => setOnizle(true)}>
              3D incele
            </button>
            <button className="btn" onClick={() => setParcalar(!parcalar)}>
              {parcalar ? 'Parçaları gizle' : `Parçalar (${y.mod.parts.reduce((s, x) => s + x.adet, 0)})`}
            </button>
          </>
        )}
        <button className="btn danger" onClick={onDelete}>
          Sil
        </button>
      </div>
      {parcalar && y && (
        <div className="table-wrap">
          <table className="tbl small">
            <thead>
              <tr>
                <th>Parça</th>
                <th>Boy</th>
                <th>En</th>
                <th>Kal.</th>
                <th>Adet</th>
                <th>Not</th>
              </tr>
            </thead>
            <tbody>
              {y.mod.parts.map((x, i) => (
                <tr key={i}>
                  <td>{x.ad}</td>
                  <td>{mm(x.boy)}</td>
                  <td>{mm(x.en)}</td>
                  <td>{x.kalinlik}</td>
                  <td>{x.adet}</td>
                  <td className="muted">{x.not}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {onizle && y && (
        <Modal title={`${y.etiket} · ${t.ad} – ${Math.round(y.mod.w)}×${y.mod.h}×${y.mod.d}`} onClose={() => setOnizle(false)} wide>
          <Suspense fallback={<div className="loading">3D yükleniyor…</div>}>
            <Preview mod={y.mod} secim={p.malzeme} mat={matMap} />
          </Suspense>
        </Modal>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------

function Sihirbaz({ wall, onClose, onApply }: { wall: Wall; onClose: () => void; onApply: (l: Pick<Wall, 'alt' | 'ust'>) => void }) {
  const kapakMax = useStore((s) => s.settings.uretim.kapakMaxGen);
  const [tur, setTur] = useState<'mutfak' | 'gardirop' | 'vestiyer'>('mutfak');
  const alan = wall.uzunluk - (wall.basBosluk ?? 0) - (wall.sonBosluk ?? 0);
  const [kapak, setKapak] = useState(Math.max(2, Math.ceil(alan / kapakMax)));
  const [duzen, setDuzen] = useState<'ikili' | 'tekli'>('ikili');
  const [yukluk, setYukluk] = useState(false);
  return (
    <Modal title="Otomatik diz / Sihirbaz" onClose={onClose}>
      <p className="muted">
        Kullanılabilir duvar: <b>{alan} mm</b>. Mevcut modüller silinip yeniden dizilecek.
      </p>
      <div className="seg">
        <button className={tur === 'mutfak' ? 'on' : ''} onClick={() => setTur('mutfak')}>
          Mutfak
        </button>
        <button className={tur === 'gardirop' ? 'on' : ''} onClick={() => setTur('gardirop')}>
          Gardırop
        </button>
        <button className={tur === 'vestiyer' ? 'on' : ''} onClick={() => setTur('vestiyer')}>
          Vestiyer
        </button>
      </div>
      {tur === 'gardirop' && (
        <div className="grid2">
          <Field label="Kapak sayısı" hint={`Kapak genişliği ≈ ${Math.round(alan / Math.max(1, kapak))} mm`}>
            <Num value={kapak} onChange={setKapak} min={1} max={16} />
          </Field>
          <Field label="Düzen">
            <select value={duzen} onChange={(e) => setDuzen(e.target.value as 'ikili' | 'tekli')}>
              <option value="ikili">
                2 kapaklı modüller ({Math.floor(kapak / 2)} × 2{kapak % 2 ? ' + 1 tek' : ''})
              </option>
              <option value="tekli">Tek kapaklı modüller ({kapak} × 1)</option>
            </select>
          </Field>
          <label className="check">
            <input type="checkbox" checked={yukluk} onChange={(e) => setYukluk(e.target.checked)} /> Üstte ayrı yüklük
          </label>
        </div>
      )}
      <div className="modal-actions">
        <button className="btn" onClick={onClose}>
          Vazgeç
        </button>
        <button
          className="btn primary"
          onClick={() =>
            onApply(tur === 'mutfak' ? mutfakOner(alan) : tur === 'gardirop' ? gardiropOner(alan, wall.yukseklik, kapak, duzen, yukluk) : vestiyerOner(alan))
          }
        >
          Diz
        </button>
      </div>
    </Modal>
  );
}
