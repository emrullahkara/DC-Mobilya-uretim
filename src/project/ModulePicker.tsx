import { useMemo, useState } from 'react';
import { TEMPLATES, KATEGORI_ADLARI } from '../data/templates';
import { buildModule } from '../engine/builder';
import { useStore } from '../store';
import { Modal } from '../ui/common';
import { ModuleFrontSvg } from '../ui/FrontSvg';
import type { ModuleCategory, ModuleTemplate } from '../engine/types';

export function useOnizleme() {
  const settings = useStore((s) => s.settings);
  const materials = useStore((s) => s.materials);
  return useMemo(() => {
    const map = new Map(materials.map((m) => [m.id, m]));
    const ctx = { u: settings.uretim, secim: settings.varsayilanMalzeme, mat: (id?: string) => (id ? map.get(id) : undefined) };
    const cache = new Map<string, ReturnType<typeof buildModule>>();
    return (t: ModuleTemplate) => {
      let m = cache.get(t.id);
      if (!m) {
        m = buildModule(t, { uid: t.id, templateId: t.id, w: t.w.def, h: t.h.def, d: t.d.def }, ctx);
        cache.set(t.id, m);
      }
      return m;
    };
  }, [settings, materials]);
}

export function TemplateCard({ t, onClick, secili }: { t: ModuleTemplate; onClick: () => void; secili?: boolean }) {
  const onizle = useOnizleme();
  return (
    <button className={`tpl-card${secili ? ' on' : ''}`} onClick={onClick}>
      <ModuleFrontSvg mod={onizle(t)} />
      <b>{t.ad}</b>
      <small>
        {t.esnek ? `${t.w.min}–${t.w.max}` : t.w.def} × {t.h.def} × {t.d.def} mm
      </small>
    </button>
  );
}

/** Modül seçici – hangi sıraya eklenecekse o sıraya uygun kategoriler önce gelir */
export default function ModulePicker({ lane, onPick, onClose }: { lane: 'alt' | 'ust'; onPick: (t: ModuleTemplate) => void; onClose: () => void }) {
  const kategoriler = useMemo(() => {
    const set = new Map<ModuleCategory, ModuleTemplate[]>();
    for (const t of TEMPLATES) {
      const uygun = lane === 'ust' ? t.sira === 'ust' || t.ozel === 'bosluk' : t.sira !== 'ust';
      if (!uygun) continue;
      set.set(t.kategori, [...(set.get(t.kategori) ?? []), t]);
    }
    return [...set.entries()];
  }, [lane]);
  const [kat, setKat] = useState<ModuleCategory | 'hepsi'>(kategoriler[0]?.[0] ?? 'hepsi');
  const [ara, setAra] = useState('');
  const liste = useMemo(() => {
    const q = ara.trim().toLocaleLowerCase('tr');
    const tum = kategoriler.flatMap(([, ts]) => ts);
    const kaynak = q ? tum : kat === 'hepsi' ? tum : kategoriler.find(([k]) => k === kat)?.[1] ?? [];
    if (!q) return kaynak;
    return kaynak.filter((t) => [t.ad, t.aciklama ?? '', ...(t.etiket ?? [])].join(' ').toLocaleLowerCase('tr').includes(q));
  }, [kat, ara, kategoriler]);

  return (
    <Modal title={lane === 'ust' ? 'Üst sıraya modül ekle' : 'Alt sıraya / zemine modül ekle'} onClose={onClose} wide>
      <input className="search" placeholder="Ara: çekmece, evye, askı, ayakkabılık, köşe…" value={ara} onChange={(e) => setAra(e.target.value)} autoFocus />
      <div className="chips">
        {kategoriler.map(([k, ts]) => (
          <button key={k} className={`chip${kat === k && !ara ? ' on' : ''}`} onClick={() => (setKat(k), setAra(''))}>
            {KATEGORI_ADLARI[k]} <small>{ts.length}</small>
          </button>
        ))}
      </div>
      <div className="tpl-grid">
        {liste.map((t) => (
          <TemplateCard key={t.id} t={t} onClick={() => onPick(t)} />
        ))}
      </div>
    </Modal>
  );
}
