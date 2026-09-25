// ============================================================================
// Uygulama durumu – cihazda (IndexedDB) kalıcı saklanır, internet gerekmez
// ============================================================================
import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import { del, get, set } from 'idb-keyval';
import { MATERIALS } from './data/materials';
import { VARSAYILAN_AYARLAR } from './data/defaults';
import type { Customer, Material, PlacedModule, Project, Settings, Wall } from './engine/types';

import { bugun, uid } from './uid';
export { bugun, uid };

// indexedDB olmayan ortamlarda (testler, eski tarayıcılar) sessizce bellek içinde çalışır
const idbVar = typeof indexedDB !== 'undefined';
const idbStorage: StateStorage = !idbVar
  ? { getItem: () => null, setItem: () => {}, removeItem: () => {} }
  : {
  getItem: async (name) => (await get(name)) ?? null,
  setItem: async (name, value) => {
    await set(name, value);
  },
  removeItem: async (name) => {
    await del(name);
  },
};

export interface AppState {
  materials: Material[];
  projects: Project[];
  customers: Customer[];
  settings: Settings;
  hydrated: boolean;

  // Malzeme
  upsertMaterial: (m: Material) => void;
  removeMaterial: (id: string) => void;
  setMaterials: (m: Material[]) => void;
  resetMaterials: () => void;

  // Müşteri
  upsertCustomer: (c: Customer) => void;
  removeCustomer: (id: string) => void;

  // Proje
  createProject: (p?: Partial<Project>) => Project;
  updateProject: (id: string, fn: (p: Project) => void) => void;
  removeProject: (id: string) => void;
  duplicateProject: (id: string) => Project | undefined;

  // Ayarlar
  updateSettings: (fn: (s: Settings) => void) => void;
  importAll: (data: Partial<Pick<AppState, 'materials' | 'projects' | 'customers' | 'settings'>>) => void;
}

function yeniDuvar(ad: string): Wall {
  return { id: uid(), ad, uzunluk: 3000, yukseklik: 2600, alt: [], ust: [], tezgah: true, baza: true };
}

const klon = <T,>(x: T): T => JSON.parse(JSON.stringify(x));

export const useStore = create<AppState>()(
  persist(
    (setS, getS) => ({
      materials: MATERIALS,
      projects: [],
      customers: [],
      settings: VARSAYILAN_AYARLAR,
      hydrated: false,

      upsertMaterial: (m) =>
        setS((s) => {
          const i = s.materials.findIndex((x) => x.id === m.id);
          const materials = s.materials.slice();
          if (i >= 0) materials[i] = m;
          else materials.push(m);
          return { materials };
        }),
      removeMaterial: (id) => setS((s) => ({ materials: s.materials.filter((m) => m.id !== id) })),
      setMaterials: (materials) => setS({ materials }),
      resetMaterials: () => setS({ materials: MATERIALS }),

      upsertCustomer: (c) =>
        setS((s) => {
          const i = s.customers.findIndex((x) => x.id === c.id);
          const customers = s.customers.slice();
          if (i >= 0) customers[i] = c;
          else customers.unshift(c);
          return { customers };
        }),
      removeCustomer: (id) => setS((s) => ({ customers: s.customers.filter((c) => c.id !== id) })),

      createProject: (over) => {
        const s = getS();
        const yil = new Date().getFullYear();
        const p: Project = {
          id: uid(),
          no: `${yil}-${String(s.settings.sayac).padStart(4, '0')}`,
          ad: 'Yeni İş',
          tarih: bugun(),
          durum: 'taslak',
          duvarlar: [yeniDuvar('Duvar 1')],
          malzeme: klon(s.settings.varsayilanMalzeme),
          fiyat: klon(s.settings.varsayilanFiyat),
          guncelleme: new Date().toISOString(),
          odemeler: [],
          ...over,
        };
        setS((st) => ({ projects: [p, ...st.projects], settings: { ...st.settings, sayac: st.settings.sayac + 1 } }));
        return p;
      },
      updateProject: (id, fn) =>
        setS((s) => ({
          projects: s.projects.map((p) => {
            if (p.id !== id) return p;
            const c = klon(p);
            fn(c);
            c.guncelleme = new Date().toISOString();
            return c;
          }),
        })),
      removeProject: (id) => setS((s) => ({ projects: s.projects.filter((p) => p.id !== id) })),
      duplicateProject: (id) => {
        const s = getS();
        const src = s.projects.find((p) => p.id === id);
        if (!src) return undefined;
        const c = klon(src);
        c.id = uid();
        c.no = `${new Date().getFullYear()}-${String(s.settings.sayac).padStart(4, '0')}`;
        c.ad = `${src.ad} (kopya)`;
        c.durum = 'taslak';
        c.tarih = bugun();
        c.odemeler = [];
        c.duvarlar.forEach((w) => {
          w.id = uid();
          const map = new Map<string, string>();
          w.alt.forEach((m) => {
            const n = uid();
            map.set(m.uid, n);
            m.uid = n;
          });
          w.ust.forEach((m) => {
            m.uid = uid();
            if (m.ref) m.ref = map.get(m.ref);
          });
        });
        setS((st) => ({ projects: [c, ...st.projects], settings: { ...st.settings, sayac: st.settings.sayac + 1 } }));
        return c;
      },

      updateSettings: (fn) =>
        setS((s) => {
          const c = klon(s.settings);
          fn(c);
          return { settings: c };
        }),
      importAll: (data) =>
        setS((s) => ({
          materials: data.materials ?? s.materials,
          projects: data.projects ?? s.projects,
          customers: data.customers ?? s.customers,
          settings: data.settings ? mergeSettings(data.settings) : s.settings,
        })),
    }),
    {
      name: 'dc-mobilya',
      version: 1,
      storage: createJSONStorage(() => idbStorage),
      partialize: (s) => ({ materials: s.materials, projects: s.projects, customers: s.customers, settings: s.settings }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<AppState>;
        // Yeni sürümde eklenen kütüphane malzemelerini kullanıcının listesine ekle (fiyatlarına dokunmadan)
        const kayitli = p.materials ?? [];
        const ids = new Set(kayitli.map((m) => m.id));
        const materials = kayitli.length ? [...kayitli, ...MATERIALS.filter((m) => !ids.has(m.id))] : MATERIALS;
        return {
          ...current,
          ...p,
          materials,
          settings: mergeSettings(p.settings),
        };
      },
      onRehydrateStorage: () => () => {
        useStore.setState({ hydrated: true });
      },
    },
  ),
);

/** Kayıtlı ayarları varsayılanlarla birleştirir (yeni eklenen ayar alanları için) */
function mergeSettings(s?: Partial<Settings>): Settings {
  const d = VARSAYILAN_AYARLAR;
  if (!s) return d;
  return {
    ...d,
    ...s,
    firma: { ...d.firma, ...s.firma },
    uretim: { ...d.uretim, ...s.uretim, rayBosluk: { ...d.uretim.rayBosluk, ...s.uretim?.rayBosluk } },
    varsayilanMalzeme: { ...d.varsayilanMalzeme, ...s.varsayilanMalzeme },
    varsayilanFiyat: { ...d.varsayilanFiyat, ...s.varsayilanFiyat },
  };
}

export function yeniModul(templateId: string, w: number, h: number, d: number): PlacedModule {
  return { uid: uid(), templateId, w, h, d };
}

export { yeniDuvar };
