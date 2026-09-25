# DC Mobilya Üretim – Proje Kitabı

Bu kitap uygulamanın **kullanım kılavuzunu**, **hesap kurallarını** ve **geliştirme günlüğünü** içerir.
Her geliştirme adımı en alttaki *Geliştirme Günlüğü* bölümüne işlenir.

---

## Geliştirme Günlüğü

### Adım 1 – Kararlar (usta ile netleştirildi)
- Veriler cihazda tutulur, internetsiz çalışır (PWA). Yedek JSON dosyası ile cihazlar arası taşınır.
- Fason kesim listesi: Excel (.xlsx) + CSV.
- Teklif: malzeme maliyeti + işçilik + kâr (+ KDV).
- Dokümantasyon: bu dosya (KITAP.md).

### Adım 2 – Altyapı
- Vite + React + TypeScript, Three.js (react-three-fiber) 3D, Zustand + IndexedDB kalıcı depolama, vite-plugin-pwa.
- Uygulama ikonu `public/icon.svg`, PNG'ler `node scripts/icons.mjs` ile üretilir.

### Adım 3 – Hesap motoru (`src/engine`)
- `types.ts`: malzeme, modül şablonu, proje, ayarlar, parça tipleri.
- `builder.ts`: parametrik modül üretici – gövde birleşimi, arkalık (kanal/çakma), sütun/bölge/cephe düzeni,
  kapak boşlukları, menteşe sayısı, çekmece kutuları (teleskopik / gizli / metal kutu), özel modüller
  (köşe, sürgülü, dolgu, yan panel, entegre cihaz kapağı, boşluk).
- `layout.ts`: duvar ölçüsüne akıllı sığdırma, boy dolapların üst sırayı bölmesi, gardırop kapak bölme sihirbazı.
- `nesting.ts`: MaxRects plaka yerleşim optimizasyonu (testere payı, kenar tıraşı, damar yönü).
- `calc.ts`: proje hesabı – kesim listesi, plaka sayısı, bant metrajı, hırdavat, hazır kapak/cam siparişi, tezgah, fiyat.
- `engine.test.ts`: 14 birim testi (ölçü doğrulamaları, yerleşim, optimizasyon, örnek mutfak).

### Adım 4 – Kütüphaneler (`src/data`)
- `materials.ts`: 563 kalem malzeme (gövde, arkalık, kapak, cam, bant, menteşe, ray, mekanizma, kulp, ayak/baza,
  vida/bağlantı, profil, aksesuar, tezgah, sarf) – kod, ad, birim, fiyat ile.
- `templates.ts`: 95 parametrik modül (mutfak alt/üst/boy, gardırop, yüklük, vestiyer/portmanto, komidin/şifonyer, banyo, salon, boşluk).
- `hw.ts`: motorun otomatik eklediği bağlantı elemanlarının sabit id'leri.
- `defaults.ts`: varsayılan atölye kuralları, malzeme seçimi ve fiyat ayarları.
