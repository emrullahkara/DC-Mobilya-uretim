# DC Mobilya Üretim – Proje Kitabı

Bu kitapta uygulamanın **kullanım kılavuzu**, **hesap kuralları** ve **geliştirme günlüğü** yer alır.

---

## 1. Uygulama ne yapar?

Usta, müşterinin yanında telefondan, tabletten ya da bilgisayardan duvar ölçüsünü girer ve modülleri seçer. Uygulama da şunları hazırlar:

1. **3D görünüm** ve ölçülü ön görünüş çizimi,
2. **Teklif fiyatı**: malzeme + işçilik + kâr + KDV, yazdırılabilir teklif formu, WhatsApp ile gönderim,
3. Sipariş onaylanınca **malzeme listesi**: plaka sayısı, bant metrajı, menteşe, ray, kulp, vida, ayak, aksesuar,
4. **Fason kesim listesi** (Excel / CSV) ve plaka yerleşim çizimleri,
5. Hazır kapak (membran, lake, akrilik) ve cam için **sipariş listesi**.

İnternet olmadan çalışır; veriler cihazda saklanır.

## 2. Kurulum ve çalıştırma

```bash
npm install
npm run dev        # geliştirme sunucusu (http://localhost:5173)
npm test           # hesap motoru testleri
npm run build      # dist/ klasörüne yayınlanabilir uygulama
```

**Yayınlama:** Depodaki `.github/workflows/deploy.yml`, `main` dalına gelen her birleştirmede testleri çalıştırır ve uygulamayı GitHub Pages'e yayınlar. İlk seferde GitHub'da *Settings → Pages → Build and deployment → Source: GitHub Actions* seçilmelidir. Adres `https://<kullanıcı>.github.io/DC-Mobilya-uretim/` olur. `dist/` klasörü herhangi bir statik barındırmaya (Netlify, kendi sunucunuz) da kopyalanabilir.

**Telefona yükleme:** Adresi Chrome'da açın, ardından ⋮ menüsünden *Uygulamayı yükle* seçin (iPhone'da Safari → Paylaş → *Ana Ekrana Ekle*). Yüklenen uygulama internetsiz de açılır.

## 3. Kullanım kılavuzu

### 3.1 Yeni iş
Panel ekranında iş türünü seçin (Mutfak / Gardırop / Vestiyer / Diğer), sonra şunları girin:
- müşteri adı ve telefonu,
- **duvar ölçüsü** (sağdan sola) ve tavan yüksekliği,
- mutfak için isteğe bağlı **L köşe 2. duvar ölçüsü**,
- gardırop için **kapak sayısı** ve düzen: *2 kapaklı modüller* ya da *tek kapaklı modüller*. Örneğin 2600 mm ve 6 kapak seçilirse 3 × 866 mm'lik iki kapaklı modül ya da 6 × 433 mm'lik tek kapaklı modül çıkar. İsterseniz üste yüklük eklenir.

“Modülleri otomatik yerleştir” işaretliyse uygulama modülleri ölçüye göre dizer.

### 3.2 Ölçü & Tasarım
- **Duvar sekmeleri:** Birden çok duvar eklenebilir. *Tüm duvarlar (L/U)* seçeneği duvarları köşeden 90° döndürerek birleşik gösterir.
- **Baştan / sondan boşluk:** kolon, kapı, pencere payı. **Üst sıra kayması:** üst dolaplar alt sıradan farklı noktada başlıyorsa kullanılır (eksi değer girilebilir).
- **Şeritler:** *Üst sıra* (asma) ve *Alt sıra / zemin* (alt, boy, gardırop, vestiyer). Modülleri sürükleyerek sıralayın, dokunarak seçin, *+ Modül ekle* ile kütüphaneden ekleyin.
- **Akıllı sığdırma:** Kesik çizgili modüller esnektir. Duvar ölçüsüne göre, nominal genişlikleri oranında büyür ya da küçülür; min/maks sınırlarına uyar. Ölçüsünü elle girdiğiniz modül 🔒 kilitlenir. Ankastre fırın, bulaşık makinesi ve köşe gibi sabit modüller ölçüsünü korur.
- **Boy dolaplar** (kiler, buzdolabı, ankastre boy) üst sırayı böler. Üst sırada “↕ Boy dolap” yer tutucusu görünür.
- Duvarda boşluk kalırsa **“Boşluğu dolgu ile kapat”** düğmesi o genişlikte dolgu paneli ekler.
- **Modül ayarları** (seçili modül): tip, genişlik, yükseklik, derinlik, kapak adedi, raf adedi, çekmece adedi, menteşe tarafı, modüle özel kapak malzemesi (örn. tek bir camlı ya da farklı renk kapak), not. Buradan modülü 3D inceleyebilir ve parça listesini görebilirsiniz.
- **Sihirbaz:** mevcut duvarı mutfak, gardırop veya vestiyer olarak yeniden dizer.

### 3.3 Malzeme seçimi
Gövde, bant, arkalık, kapak, çekmece gövdesi ve tabanı, menteşe, ray, kulp, ayak, baza, tezgah, cam, ayna ve askı borusu seçilir. *Ekonomik / Standart / Lüks* paketleri tek dokunuşla uygulanır. *Bunu varsayılan yap* ile yeni işler bu seçimle başlar.

### 3.4 Teklif
- Soldaki maliyet dökümü yalnızca ustaya görünür.
- İşçilik üç şekilde hesaplanabilir: malzemenin yüzdesi, modül başına sabit tutar ya da metretül başına tutar.
- Kâr, iskonto, montaj, nakliye, ek kalemler ve KDV girilir. Pazarlık sonrası net fiyat elle yazılabilir.
- **Tahsilat** bölümünde kapora ve ödemeler kaydedilir, kalan tutar gösterilir.
- *Teklifi yazdır / PDF* düğmesi şu bilgileri içeren bir A4 teklif formu çıkarır: firma logosu, müşteri, duvarların ölçülü ön görünüş çizimi, ürün özellikleri, modül listesi, toplam, şartlar ve imza alanı.
- *WhatsApp ile gönder* düğmesi teklif özetini müşteri numarasına gönderir.
- *Müşteri onayladı* düğmesi işi siparişe çevirir.

### 3.5 Malzeme listesi
Bu sekmede şunlar listelenir:
- plaka ihtiyacı (optimizasyonla plaka adedi ve verim),
- hazır kapak siparişi (m²),
- cam ve ayna siparişi,
- kenar bandı metrajı (fire payı dahil),
- hırdavat: gereken miktar ve **alınacak miktar** (vidalar paket, raylar takım olarak),
- montaj föyü (modül etiketleri).

Excel olarak *Satın alma listesi* ve *Kapak / cam sipariş listesi* indirilebilir.

### 3.6 Kesim listesi (fason)
- Tablo her plaka malzemesi için ayrı verilir: No, parça, boy (damar yönü), en, adet, boy bantları, en bantları, modül, not.
- **Excel (.xlsx):** özet sayfası (plaka ve bant) ile her malzeme için ayrı sayfa. **CSV:** noktalı virgülle ayrılır, Türkçe Excel'de doğrudan açılır.
- Plaka yerleşim çizimleri parça numaralarıyla gösterilir.
- Ölçüler varsayılan olarak **bantlı net ölçüdür**. Ayarlardan “Bant kalınlığını kesimden düş” açılırsa kesim ölçüsü verilir.

### 3.7 Malzeme kütüphanesi
563 kalem malzeme kod, ad, birim ve fiyatla kayıtlıdır. Fiyatlar KDV hariçtir ve **örnek değerlerdir; kendi alış fiyatlarınızla güncelleyin**. Kütüphanede şunları yapabilirsiniz:
- fiyatı doğrudan tabloda değiştirmek,
- toplu % zam veya indirim uygulamak,
- *Excel'e aktar → fiyatları düzenle → Excel/CSV'den yükle* ile toplu güncellemek (Kod ya da id ile eşleşir),
- yeni malzeme eklemek, bir malzemeyi pasife almak.

Otomatik hesapta kullanılan bağlantı elemanları silinemez.

### 3.8 Ayarlar ve yedek
- **Firma bilgileri:** logo, IBAN, teklif şartları.
- **Üretim kuralları:** kesim ölçülerini belirler (bkz. bölüm 4).
- **Yedek al / geri yükle:** JSON dosyası. Telefon ile bilgisayar arasında veri taşımak için de kullanılır. Tarayıcı verisi silinirse kayıtlar gider; düzenli yedek alın.

## 4. Hesap kuralları (kesim listesinin mantığı)

Bütün ölçüler mm'dir. Varsayılan değerler parantez içinde verilmiştir; hepsi Ayarlar'dan değiştirilebilir.

| Konu | Kural |
|---|---|
| Modül yüksekliği | H = ayak dahil toplam yükseklik. Gövde = H − ayak (100) |
| Gövde birleşimi (yanlar alt tablaya basar) | Alt tabla tam genişlik (W). Yan = gövde − alt tabla − (tam üst tabla varsa) üst tabla. Üst tabla tam genişlik yanların üstüne biner |
| Diğer birleşimler | “Üst tabla arada”: üst = W − 2t. “Yanlar tam boy”: alt ve üst = W − 2t |
| Alt dolap üstü | İki kuşak (100 mm), boy = W − 2t. Evye dolabında arkalık yoktur, arkada dik kuşaklar kullanılır |
| Kanallı arkalık (8 mm) | Kanal arkadan 15 mm, derinlik 8 mm. Genişlik = W − 2t + 2×8 − 2. Yükseklik = iç yükseklik + kanal payları − tolerans |
| Çakma arkalık | W − 2 × gövde − 2. Gövde parçalarının derinliği arkalık kalınlığı kadar azalır |
| Ayarlı raf | Genişlik = iç genişlik − 2, derinlik = iç derinlik − 20. Raf başına 4 pim. 900 mm üstü açıklıkta sehim uyarısı verilir |
| Kapak (bindirme) | Dış kenarlarda 1,5 mm, kapaklar arasında 3 mm boşluk. Ara dikmede kapak dikme ortasına kadar gelir. 600 mm üstü genişlikte otomatik iki kapak yapılır |
| Menteşe sayısı | ≤900 mm: 2 · ≤1400: 3 · ≤1900: 4 · ≤2300: 5 · üstü: 6. Menteşe başına 4 adet 3,5×16 vida |
| Çekmece rayı | İç derinliğe sığan en uzun standart ray (iç derinlik − 20). Ürün kütüphanedeki uygun boya otomatik eşlenir |
| Çekmece kutusu (teleskopik) | Dış genişlik = iç genişlik − 26. Yanlar ray boyunda. Ön ve arka = dış genişlik − 2 × çekmece gövdesi kalınlığı. Kutu yüksekliği = cephe − 50. Taban alttan çakma |
| Gizli ray | Dış genişlik = iç genişlik − 10 |
| Metal kutu sistemi | Yanlar sistemle gelir. Taban = iç genişlik − 75, arka = iç genişlik − 87 (üretici kataloğuyla kontrol edin) |
| İç çekmece | Menteşe payı için iki yana 22 mm takoz konur. İç çekmece önü gövde malzemesinden olur ve 4 kenarı bantlıdır |
| Köşe (kör köşe) dolap | Kör pay: alt 650, üst 370 mm (komşu dolap derinliği + kapak + kulp payı). Kapak = W − kör pay |
| Sürgülü gardırop | Kapaklar 40 mm bindirmeli, ray payı 55 mm |
| Bant | Görünen kenarlar bantlanır: gövdede 0,4 mm, kapakta 4 kenar 1 mm. Her kenara 50 mm fire payı eklenir |
| Plaka optimizasyonu | MaxRects yöntemi: testere 4 mm, kenar tıraşı 10 mm. Damarlı malzemede parça döndürülmez |
| Bağlantı elemanları | Birleşim başına her 150 mm'ye bir 4×50 vida (en az 2). Kuşak için 4×40, arkalık vidası her 150 mm'de bir. Üst dolaba 2 askı aparatı, dübel ve vida. Boy dolaba ve gardıroba duvara sabitleme L parçası |
| Devirme payı | Boy dolabın köşegeni (√(H² + D²)) tavandan büyükse dolap yerinde dikilemez; uyarı verilir ve azami yükseklik önerilir |
| Tezgah | Ardışık mutfak alt modülleri üzerine (boşluklar dahil). Derinlik 620. Uç kapama, köşe birleşim, süpürgelik ve silikon eklenir |
| Fiyat | Malzeme + fire % + işçilik + montaj + nakliye + ek kalemler = ara toplam. Ara toplama kâr % eklenir, iskonto % düşülür, sonra KDV eklenir. Vidalar kullanılan kadar fiyatlanır, satın alma listesinde paket olarak çıkar |

## 5. Kod yapısı

```
src/engine/   types.ts · builder.ts (parametrik modül) · layout.ts (sığdırma) · nesting.ts (optimizasyon) · calc.ts (proje hesabı) · engine.test.ts
src/data/     materials.ts (563 malzeme) · templates.ts (124 modül) · hw.ts · defaults.ts · presets.ts (otomatik dizilim)
src/project/  ProjectEditor · DesignTab · MaterialChoiceTab · QuoteTab · BomTab · CutTab · ModulePicker
src/pages/    Home · Projects · Customers · MaterialsPage · Library · SettingsPage · NewProjectModal
src/three/    Scene3D.tsx (3D sahne, modül önizleme)
src/export/   excel.ts (xlsx / csv)
src/ui/       common.tsx · FrontSvg.tsx (2D ön görünüş)
```

**Yeni modül eklemek:** `src/data/templates.ts` dosyasında ilgili gruba bir satır ekleyin. Bir modül sütunlardan (`col`), sütun da alttan yukarı bölgelerden oluşur: `raf`, `cekmece`, `icCekmece`, `aski`, `ayakkabi`, `cihaz`, `oturak`, `bos`. Cepheler bölgelerden otomatik üretilir.

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
- `templates.ts`: 124 parametrik modül (mutfak alt/üst/boy, gardırop, yüklük, vestiyer/portmanto, komidin/şifonyer, banyo, salon, boşluk).
- `hw.ts`: motorun otomatik eklediği bağlantı elemanlarının sabit id'leri.
- `defaults.ts`: varsayılan atölye kuralları, malzeme seçimi ve fiyat ayarları.

### Adım 5 – Arayüz
- Panel, İşler, Müşteriler, Modül Kütüphanesi, Malzemeler, Ayarlar sayfaları; masaüstünde üst menü, telefonda alt menü.
- Proje ekranı: 5 sekme (Ölçü & Tasarım, Malzeme Seçimi, Teklif, Malzeme Listesi, Kesim Listesi).
- 3D sahne (react-three-fiber): kapaklı / şeffaf / iç düzen görünümü, ölçü etiketleri, L/U birleşik görünüm, 3D'de tıklayarak seçim.
- Sürükle-bırak modül şeritleri (@dnd-kit, dokunmatik destekli), modül ayarları paneli, otomatik diz sihirbazı, dolgu ile kapatma.
- 2D ön görünüş çizimleri: kütüphane kartları ve teklif formu.
- Yazdırma: teklif formu, malzeme listesi ve kesim listesi A4 çıktı / PDF.
- Excel/CSV dışa aktarım, Excel/CSV'den fiyat yükleme, toplu zam, JSON yedek.

### Adım 6 – Test ve düzeltmeler
- Playwright ile masaüstü (1400 px) ve telefon (390 px) ekranlarında uçtan uca gezinti yapıldı: yeni L mutfak, modül seçme ve ekleme, bütün sekmeler, kütüphane, malzemeler, ayarlar. Konsolda hata yok.
- Düzeltilenler: L mutfakta köşe dolap duvardan düşülmüyordu. 3D etiketler sekme değişiminde DOM hatası veriyordu (portal katmanına taşındı). Kesim listesi numaraları malzeme sırasına göre ardışık hale getirildi. Birleşen satırların notları korunuyor. Üst sıra önerisinde boşluk kalması giderildi (600 mm ve üzeri genişlikte çift kapaklı üst dolap kullanılıyor).
- 15 birim testinin hepsi geçiyor. Eklenen test: hazır dizilimler 1,2–5 m duvarlarda boşluk ya da taşma bırakmıyor.
- GitHub Actions: her PR'da test ve derleme çalışır; `main` dalına birleştirmede GitHub Pages'e yayınlanır.

### Notlar / bilinen sınırlar
- Malzeme fiyatları 2026 sonu için tahmini örnek değerlerdir. İlk iş olarak kendi fiyatlarınızı girin.
- Metal kutu çekmece sistemlerinin (Tandembox, Alfa) taban ve arka ölçüleri genel formülle hesaplanır; markanın kataloğuyla kontrol edin.
- Veriler cihazdadır; birden fazla usta aynı verileri ancak yedek dosyasıyla paylaşabilir (anlık ortak veritabanı yoktur).
- Ustanın “kork” ve “alüminyum kurt” ifadeleri kulp çeşitleri ve alüminyum profil kulplar olarak yorumlandı. Farklı bir ürün kastedildiyse Malzemeler ekranından eklenebilir.
