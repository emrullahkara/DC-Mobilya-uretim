// Motorun otomatik olarak listeye eklediği bağlantı elemanları ve donanımların
// malzeme kütüphanesindeki sabit id'leri. Fiyatları ve adları Malzeme
// Kütüphanesi ekranından değiştirilebilir; id'ler değiştirilmemelidir.
export const HW = {
  // Vidalar / bağlantı
  vidaGovde: 'vida-4x50', // gövde birleşim (yan-alt-üst-dikme)
  vidaKusak: 'vida-4x40', // kuşak ve sabit raf
  vidaMentese: 'vida-3.5x16', // menteşe, ray, ayak, aksesuar
  vidaKulp: 'vida-kulp-m4x25',
  vidaArkalik: 'vida-arkalik-3x20', // çakma arkalık vidası
  civiArkalik: 'civi-arkalik-zimba', // çakma arkalık zımba teli
  vidaCekmece: 'vida-4x30', // çekmece kutusu birleşimi
  civiCekmeceTaban: 'civi-cekmece-taban',
  rafPimi: 'raf-pimi-5mm',
  modulBirlestirme: 'modul-birlestirme-vidasi',
  askiAparati: 'ust-dolap-aski-aparati',
  askiRayi: 'ust-dolap-aski-rayi',
  dubel: 'dubel-8x50',
  vidaDubel: 'vida-5x60',
  bazaKlips: 'baza-klipsi',
  kapakTampon: 'kapak-tamponu',
  duvarBaglanti: 'duvar-baglanti-l',
  tutkal: 'tutkal-pva',
  silikon: 'silikon-seffaf',
  // Kapak mekanizmaları
  pistonKalkar: 'mek-piston-100n',
  dusenMakas: 'mek-dusen-makas',
  katlanirMek: 'mek-katlanir',
  dikeyMek: 'mek-dikey-kalkar',
  surguRay2: 'mek-surgu-2kapak',
  surguRay3: 'mek-surgu-3kapak',
  menteseKose: 'mentese-165-derece',
  menteseCam: 'mentese-cam-kapak',
  camCerceve: 'profil-cam-cerceve',
  aynaYapistirici: 'sarf-ayna-yapistiricisi',
  // Gardırop / vestiyer
  boruTasiyici: 'aks-boru-tasiyici',
  askiKanca: 'aks-aski-kancasi',
  oturakSunger: 'aks-oturak-sunger',
  oturakKumas: 'aks-oturak-kumas',
  ayakkabiRafi: 'aks-ayakkabi-rafi-metal',
  // Tezgah
  tezgahUcKapama: 'tezgah-uc-kapama',
  tezgahBirlesim: 'tezgah-birlesim-profili',
  supurgelik: 'tezgah-supurgelik',
} as const;

export type HwKey = keyof typeof HW;
