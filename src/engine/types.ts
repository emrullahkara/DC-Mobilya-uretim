// ============================================================================
// DC Mobilya Üretim – temel veri tipleri
// Bütün ölçüler milimetre (mm), bütün fiyatlar Türk Lirası (TL) cinsindendir.
// ============================================================================

/** Malzeme kütüphanesindeki ana gruplar */
export type MaterialGroup =
  | 'govde' // gövde plakaları (suntalam, mdflam, ham sunta...)
  | 'arkalik' // 3-5-8 mm arkalıklar
  | 'kapak' // kapak malzemeleri (mdflam, membran, akrilik, high gloss, lake...)
  | 'cam' // cam / ayna
  | 'bant' // kenar bantları
  | 'mentese'
  | 'ray' // çekmece rayları ve sistemleri
  | 'mekanizma' // kapak mekanizmaları (amortisör, aventos, sürgü...)
  | 'kulp'
  | 'ayak' // ayaklar ve baza
  | 'vida' // vida, çivi, dübel, bağlantı elemanları
  | 'profil' // alüminyum profiller (gola, cam çerçeve, baza...)
  | 'aksesuar' // gardırop ve mutfak aksesuarları
  | 'tezgah'
  | 'sarf'; // tutkal, silikon, ambalaj...

/** Fiyatın hangi birim üzerinden girildiği */
export type PriceUnit = 'plaka' | 'm2' | 'mt' | 'adet' | 'paket' | 'takim' | 'kg';

export interface Material {
  id: string;
  kod: string;
  ad: string;
  grup: MaterialGroup;
  /** Alt kategori – listelerde gruplamak için (örn. "Frenli menteşe") */
  alt?: string;
  birim: PriceUnit;
  /** Birim fiyat (KDV hariç) */
  fiyat: number;
  /** Plaka malzemeler için */
  kalinlik?: number;
  plakaBoy?: number; // damar yönü
  plakaEn?: number;
  /** Damarlı (ahşap desenli) plaka – parça döndürülemez */
  damarli?: boolean;
  /**
   * Kapak malzemesinin temin şekli:
   *  - 'kesim': plaka olarak alınır, fason kesim listesine girer (mdflam, high gloss plaka)
   *  - 'hazir': hazır kapak olarak m² üzerinden sipariş edilir (membran/balon, lake, akrilik kapak)
   */
  temin?: 'kesim' | 'hazir';
  /** Kenar bandı için eşleşen bant malzemesi id'si */
  bantId?: string;
  /** Bant kalınlığı (mm) – sadece bantlar için */
  bantKalinlik?: number;
  /** Paket içindeki adet (vidalar) */
  paketAdet?: number;
  /** 3D görünüm rengi */
  renk?: string;
  aciklama?: string;
  /** Kullanıcı pasife aldıysa seçim listelerinde görünmez */
  pasif?: boolean;
}

// ---------------------------------------------------------------------------
// Parametrik modül tanımı (modül kütüphanesi)
// ---------------------------------------------------------------------------

export type ModuleRow = 'alt' | 'ust' | 'boy' | 'serbest';

export interface DimRange {
  def: number;
  min: number;
  max: number;
}

/** Yükseklik tanımı: sabit mm veya kalan alandan pay (oran) */
export interface SizeSpec {
  mm?: number;
  /** Kalan alandan alınan pay (varsayılan 1) */
  pay?: number;
}

/** Gövde içindeki bölge (alttan yukarı) */
export interface Zone {
  h?: SizeSpec;
  tip:
    | 'raf' // ayarlı raflı bölge
    | 'bos' // boş
    | 'aski' // askı borulu (gardırop)
    | 'icCekmece' // kapak arkasında iç çekmeceler
    | 'cekmece' // dıştan çekmeceler (her çekmece bir cephe)
    | 'cihaz' // ankastre cihaz boşluğu (fırın, mikrodalga, buzdolabı...)
    | 'ayakkabi' // eğimli / düz ayakkabı rafları
    | 'oturak'; // puf oturak (vestiyer)
  /** Raf / çekmece / ayakkabı rafı sayısı. undefined → yükseklikten otomatik */
  adet?: number;
  /** Çekmece cephe yükseklik oranları (örn. [1,1.5,1.5]) */
  oranlar?: number[];
  /** Bölgenin üstüne sabit ara tabla konur (bölge ayırıcı) */
  ustTabla?: boolean;
  /** Cihaz adı (etiket için) */
  cihaz?: string;
  /** Cihaz bölgesinde arkalık yok vb. */
  arkalikYok?: boolean;
  /**
   * Otomatik cephe üretiminde bu bölgenin cephesi (varsayılan: çekmece → çekmece,
   * cihaz → açık, diğerleri → kapak). Ardışık aynı tip bölgeler tek cephede birleşir.
   */
  cephe?: 'kapak' | 'acik' | 'cekmece' | 'panel';
  /** Önceki bölgeyle birleşmesin, ayrı cephe olsun */
  ayri?: boolean;
  /** Bu bölgenin kapağına ait seçenekler */
  kapak?: { adet?: number; mekanizma?: DoorMech; gizliAski?: boolean; yon?: 'sol' | 'sag' };
}

export type DoorMech =
  | 'normal' // menteşeli kapak
  | 'cam' // alüminyum çerçeveli cam kapak
  | 'ayna' // aynalı kapak
  | 'kalkar' // yukarı kalkar (amortisörlü piston)
  | 'dusen' // aşağı düşen kapak (düşer kapak makası)
  | 'katlanir' // katlanır kapak (iki parça)
  | 'dikey' // dikey kalkar / paralel kalkar (aventos HL/HS)
  | 'surgu'; // sürgülü (kayar) kapak

/** Cephe tanımı (alttan yukarı) */
export interface Front {
  h?: SizeSpec;
  tip: 'kapak' | 'cekmece' | 'acik' | 'panel' | 'cihaz';
  /** Kapak adedi (1 veya 2...) */
  adet?: number;
  mekanizma?: DoorMech;
  /** Tek kapakta menteşe yönü */
  yon?: 'sol' | 'sag';
  /** Kapak içi gizli askı (vestiyer) */
  gizliAski?: boolean;
}

export interface Column {
  /** Sütun genişliği – sabit mm veya pay */
  w?: SizeSpec;
  zones: Zone[];
  /**
   * Cepheler. Verilmezse bölgelerden otomatik: 'cekmece' bölgesi → çekmece cephesi,
   * 'cihaz' → açık, diğerleri tek kapak (genişlik > kapakMaxGen ise 2 kapak).
   */
  fronts?: Front[];
}

export interface CarcassSpec {
  /** Üst: tam tabla / ön-arka kuşak (alt dolap) / yok */
  ust: 'tabla' | 'kusak' | 'yok';
  /** Alt tabla var mı (buzdolabı yeri gibi modüllerde yok) */
  alt?: boolean;
  arkalik?: boolean;
  /** Ayak veya baza ile yerden yükseltme */
  ayak?: boolean;
  /** Yan dikmeler yok (sadece panel/dolgu modülleri için) */
  yanYok?: boolean;
  /** Tek yan (dolgu paneli, görünen yan) */
  sadeceYan?: boolean;
  /** Evye dolabı: arka kuşak yerine alt kuşak, arkalık yok */
  evye?: boolean;
  /** Ayaklı ama bazasız (komidin, şifonyer – ayaklar görünür) */
  bazaYok?: boolean;
}

export type ModuleCategory =
  | 'mutfak-alt'
  | 'mutfak-ust'
  | 'mutfak-boy'
  | 'gardirop'
  | 'vestiyer'
  | 'yatak-odasi'
  | 'banyo'
  | 'salon'
  | 'genel';

export interface ModuleTemplate {
  id: string;
  ad: string;
  kategori: ModuleCategory;
  sira: ModuleRow;
  aciklama?: string;
  w: DimRange;
  h: DimRange;
  d: DimRange;
  /** Genişlik yerleşimde esner mi (akıllı sığdırma) */
  esnek: boolean;
  govde: CarcassSpec;
  columns: Column[];
  /** Özel yapı üreticisi (köşe dolap, sürgülü gardırop vb.) */
  ozel?: 'kose' | 'surgulu' | 'dolgu' | 'yanPanel' | 'bosluk' | 'cihazKapak';
  /** Köşe dolaplarda kapak genişliği */
  koseKapakGen?: number;
  /** Kütüphanede arama için etiketler */
  etiket?: string[];
  /**
   * Modüle özel ek donanım (çöp kovası, kaşıklık...) – malzeme id ve adet.
   * id '*' ile bitiyorsa (örn. 'aks-kasiklik-*') modül genişliğine uyan en büyük ölçü seçilir.
   */
  ekDonanim?: { id: string; adet: number }[];
  /** Kapak adedi yeniden ayarlanabilir mi (gardırop hızlı kurulum) */
  kapakDegisken?: boolean;
}

// ---------------------------------------------------------------------------
// Proje / yerleşim
// ---------------------------------------------------------------------------

export interface PlacedModule {
  uid: string;
  templateId: string;
  /** Kullanıcının elle girdiği genişlik (kilitli ise yerleşim bunu korur) */
  w: number;
  h: number;
  d: number;
  kilitli?: boolean;
  /** Modüle özel kapak malzemesi (proje seçimini ezer) */
  kapakMalzemeId?: string;
  /** Sütun/bölge override – kullanıcı raf, çekmece sayısı değiştirebilir */
  rafAdet?: number;
  cekmeceAdet?: number;
  kapakAdet?: number;
  yon?: 'sol' | 'sag';
  not?: string;
  /** Üst sırada boy dolap yer tutucusu ise, alt sıradaki boy modülün uid'si */
  ref?: string;
}

export interface Wall {
  id: string;
  ad: string;
  /** Duvar uzunluğu (sağdan sola ölçü) */
  uzunluk: number;
  /** Tavan yüksekliği */
  yukseklik: number;
  alt: PlacedModule[];
  ust: PlacedModule[];
  /** Duvarın baş/son kısmında bırakılacak boşluk (pencere, kolon vb.) */
  basBosluk?: number;
  sonBosluk?: number;
  /** Üst sıranın başlangıç ofseti (boy dolaplar yoksa kullanılır) */
  ustBasOfset?: number;
  ustSonOfset?: number;
  /** Tezgah eklensin mi (mutfak) */
  tezgah?: boolean;
  /** Baza eklensin mi */
  baza?: boolean;
}

export interface MaterialChoice {
  govde: string;
  arkalik: string;
  kapak: string;
  cekmeceGovde: string;
  cekmeceTaban: string;
  govdeBant: string;
  kapakBant: string;
  mentese: string;
  ray: string;
  kulp: string;
  ayak: string;
  baza: string;
  tezgah: string;
  cam: string;
  ayna: string;
  askiBorusu: string;
}

export type ProjectStatus = 'taslak' | 'teklif' | 'onay' | 'uretim' | 'montaj' | 'teslim' | 'iptal';

export interface PriceOptions {
  /** Kâr oranı % */
  kar: number;
  /** İskonto % */
  iskonto: number;
  kdvDahil: boolean;
  kdv: number;
  iscilikTipi: 'yuzde' | 'modul' | 'metretul';
  iscilikDeger: number;
  montaj: number;
  nakliye: number;
  ekKalemler: { ad: string; tutar: number }[];
  /** Elle girilmiş nihai fiyat (varsa hesaplananın yerine geçer) */
  elleFiyat?: number;
}

export interface Project {
  id: string;
  no: string;
  ad: string;
  musteriId?: string;
  tarih: string;
  durum: ProjectStatus;
  duvarlar: Wall[];
  malzeme: MaterialChoice;
  fiyat: PriceOptions;
  not?: string;
  /** Teslim tarihi */
  teslim?: string;
  /** Alınan kapora/ödemeler */
  odemeler?: { tarih: string; tutar: number; not?: string }[];
  guncelleme: string;
}

export interface Customer {
  id: string;
  ad: string;
  telefon?: string;
  adres?: string;
  eposta?: string;
  not?: string;
  tarih: string;
}

// ---------------------------------------------------------------------------
// Atölye ayarları (üretim kuralları)
// ---------------------------------------------------------------------------

export interface Settings {
  firma: {
    ad: string;
    telefon: string;
    adres: string;
    eposta: string;
    vergi: string;
    iban: string;
    logo?: string;
    teklifGecerlilik: number;
    teklifSartlari: string;
  };
  uretim: {
    /**
     * Gövde birleşimi:
     *  - 'yanAltaBasar': alt tabla tam genişlik, yanlar alt tablanın üstüne basar; üst tabla yanların üstüne biner
     *  - 'yanAltaBasarUstArada': yanlar alta basar, üst tabla yanların arasında
     *  - 'yanTamBoy': yanlar tam boy, alt ve üst tabla yanların arasında
     */
    govdeBirlesim: 'yanAltaBasar' | 'yanAltaBasarUstArada' | 'yanTamBoy';
    arkalikTipi: 'kanal' | 'cakma';
    /** Kanal derinliği (mm) */
    kanalDerinlik: number;
    /** Kanalın arka kenardan mesafesi */
    kanalMesafe: number;
    /** Kapak kenar boşluğu (gövde dış kenarından içeri, her kenar) */
    kapakKenarBosluk: number;
    /** İki kapak / çekmece cephesi arası boşluk */
    kapakAraBosluk: number;
    /** Tek kapak için azami genişlik – geçerse 2 kapak */
    kapakMaxGen: number;
    /** Ayarlı raf – yanlardan toplam boşluk */
    rafYanBosluk: number;
    /** Ayarlı raf – önden geri çekme */
    rafOnGeri: number;
    /** Raflar arası hedef aralık (otomatik raf sayısı için) */
    rafAralik: number;
    /** Kuşak genişliği (alt dolap üst kuşakları) */
    kusakGen: number;
    /** Ayak / baza yüksekliği */
    ayakYukseklik: number;
    /** Çekmece: ray tipine göre kutu dış genişliği = iç genişlik - bu değer */
    rayBosluk: { teleskopik: number; gizli: number; metal: number };
    /** Çekmece kutusu cephe yüksekliğinden ne kadar kısa */
    cekmeceYukseklikFark: number;
    /** Çekmece arkası – arkalıktan boşluk */
    cekmeceArkaBosluk: number;
    /** Çekmece taban tipi */
    cekmeceTaban: 'cakma' | 'kanal';
    /** Kesim ölçüsünden bant kalınlığı düşülsün mü */
    bantDus: boolean;
    /** Testere kalınlığı (optimizasyon) */
    testere: number;
    /** Plaka kenar tıraşı (her kenar) */
    kenarTiras: number;
    /** Bant fire payı (her kenar için eklenen mm) */
    bantFirePay: number;
    /** Malzeme fire ve sarf payı % (maliyete eklenir) */
    plakaFireYuzde: number;
    /** Tezgah derinliği */
    tezgahDerinlik: number;
    tezgahKalinlik: number;
    /** Üst dolapların yerden alt kotu */
    ustDolapAltKot: number;
    /** Modül birleştirme vidası kullan */
    modulBirlestirme: boolean;
  };
  varsayilanMalzeme: MaterialChoice;
  varsayilanFiyat: PriceOptions;
  /** Sonraki proje numarası */
  sayac: number;
}

// ---------------------------------------------------------------------------
// Motor çıktıları
// ---------------------------------------------------------------------------

export type PartRole =
  | 'yan'
  | 'alt'
  | 'ust'
  | 'kusak'
  | 'dikme'
  | 'sabitRaf'
  | 'raf'
  | 'arkalik'
  | 'kapak'
  | 'cekmeceOn' // çekmece cephesi (kapak malzemesi)
  | 'cekmeceYan'
  | 'cekmeceArka'
  | 'cekmeceIcOn'
  | 'cekmeceTaban'
  | 'baza'
  | 'tezgah'
  | 'dolgu'
  | 'gorunenYan'
  | 'oturak'
  | 'cam'
  | 'takoz';

export type MaterialSlot = 'govde' | 'arkalik' | 'kapak' | 'cekmeceGovde' | 'cekmeceTaban' | 'tezgah' | 'cam' | 'ayna' | 'baza';

/** Kenar bandı durumu: undefined = bantsız */
export interface Edges {
  /** Boy kenarları (uzun kenarlar, boy yönünde) */
  b1?: string;
  b2?: string;
  /** En kenarları */
  e1?: string;
  e2?: string;
}

export interface Box3 {
  x: number;
  y: number;
  z: number;
  w: number;
  h: number;
  d: number;
}

export interface Part {
  ad: string;
  rol: PartRole;
  slot: MaterialSlot;
  /** Özel malzeme (modül kapak override) – yoksa slot'tan çözülür */
  malzemeId?: string;
  /** Kesim ölçüleri – boy damar yönünde */
  boy: number;
  en: number;
  kalinlik: number;
  adet: number;
  kenar: Edges;
  /** Damar yönü önemli mi */
  damar: boolean;
  /** 3D kutu (modül yerel koordinatı) – adet > 1 ise ilk parçanın konumu, diğerleri kutular dizisinde */
  kutular: Box3[];
  not?: string;
}

export interface HardwareLine {
  malzemeId: string;
  adet: number;
  not?: string;
}

/** 3D'de parça olmayan donanım görselleri (kulp, ayak, askı borusu...) */
export interface Visual {
  tip: 'kulp' | 'ayak' | 'boru' | 'cihaz' | 'etiket';
  kutu: Box3;
  etiket?: string;
}

export interface BuiltModule {
  uid: string;
  templateId: string;
  ad: string;
  w: number;
  h: number;
  d: number;
  parts: Part[];
  hardware: HardwareLine[];
  visuals: Visual[];
  uyarilar: string[];
  /** Özet bilgiler */
  kapakSayisi: number;
  cekmeceSayisi: number;
}
