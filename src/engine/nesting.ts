// ============================================================================
// Plaka yerleşim optimizasyonu (MaxRects – en kısa kenar uyumu)
// Testere payı her parçaya eklenir, plaka kenar tıraşı kullanılabilir alandan düşülür.
// Damarlı parçalar döndürülmez (boy, plakanın boy/damar yönünde kalır).
// ============================================================================

export interface NestPart {
  id: string;
  /** Plaka boyu (damar) yönündeki ölçü */
  boy: number;
  en: number;
  damar: boolean;
  etiket: string;
}

export interface NestPlaced {
  part: NestPart;
  x: number; // plaka boyu yönünde
  y: number; // plaka eni yönünde
  l: number; // x yönündeki ölçü
  w: number; // y yönündeki ölçü
  dondu: boolean;
}

export interface NestSheet {
  yerlesim: NestPlaced[];
  kullanilan: number; // mm²
}

export interface NestResult {
  sheets: NestSheet[];
  sigmayan: NestPart[];
  /** Toplam parça alanı / toplam plaka alanı */
  verim: number;
  plakaBoy: number;
  plakaEn: number;
}

interface Rect {
  x: number;
  y: number;
  l: number;
  w: number;
}

class MaxRects {
  free: Rect[];
  constructor(
    public L: number,
    public W: number,
  ) {
    this.free = [{ x: 0, y: 0, l: L, w: W }];
  }

  bul(l: number, w: number, dondur: boolean): { r: Rect; dondu: boolean; skor: number } | null {
    let best: { r: Rect; dondu: boolean; skor: number; skor2: number } | null = null;
    const dene = (pl: number, pw: number, dondu: boolean) => {
      for (const f of this.free) {
        if (pl <= f.l + 1e-6 && pw <= f.w + 1e-6) {
          const kisa = Math.min(f.l - pl, f.w - pw);
          const uzun = Math.max(f.l - pl, f.w - pw);
          if (!best || kisa < best.skor || (kisa === best.skor && uzun < best.skor2))
            best = { r: { x: f.x, y: f.y, l: pl, w: pw }, dondu, skor: kisa, skor2: uzun };
        }
      }
    };
    dene(l, w, false);
    if (dondur) dene(w, l, true);
    return best;
  }

  yerlestir(r: Rect) {
    const yeni: Rect[] = [];
    for (const f of this.free) {
      if (r.x >= f.x + f.l || r.x + r.l <= f.x || r.y >= f.y + f.w || r.y + r.w <= f.y) {
        yeni.push(f);
        continue;
      }
      if (r.x > f.x) yeni.push({ x: f.x, y: f.y, l: r.x - f.x, w: f.w });
      if (r.x + r.l < f.x + f.l) yeni.push({ x: r.x + r.l, y: f.y, l: f.x + f.l - (r.x + r.l), w: f.w });
      if (r.y > f.y) yeni.push({ x: f.x, y: f.y, l: f.l, w: r.y - f.y });
      if (r.y + r.w < f.y + f.w) yeni.push({ x: f.x, y: r.y + r.w, l: f.l, w: f.y + f.w - (r.y + r.w) });
    }
    // İç içe kalan serbest alanları temizle
    this.free = yeni.filter(
      (a, i) =>
        !yeni.some(
          (b, j) => i !== j && a.x >= b.x && a.y >= b.y && a.x + a.l <= b.x + b.l && a.y + a.w <= b.y + b.w && (i > j || a.l !== b.l || a.w !== b.w || a.x !== b.x || a.y !== b.y),
        ),
    );
  }
}

export function nest(parts: NestPart[], plakaBoy: number, plakaEn: number, testere: number, tiras: number): NestResult {
  const L = plakaBoy - 2 * tiras + testere;
  const W = plakaEn - 2 * tiras + testere;
  const sirali = [...parts].sort((a, b) => Math.max(b.boy, b.en) - Math.max(a.boy, a.en) || b.boy * b.en - a.boy * a.en);
  const sheets: { mr: MaxRects; s: NestSheet }[] = [];
  const sigmayan: NestPart[] = [];
  for (const p of sirali) {
    const pl = p.boy + testere;
    const pw = p.en + testere;
    const dondur = !p.damar;
    if (!(pl <= L && pw <= W) && !(dondur && pw <= L && pl <= W)) {
      sigmayan.push(p);
      continue;
    }
    let yerlesti = false;
    for (const sh of sheets) {
      const b = sh.mr.bul(pl, pw, dondur);
      if (b) {
        sh.mr.yerlestir(b.r);
        sh.s.yerlesim.push({ part: p, x: b.r.x + tiras, y: b.r.y + tiras, l: b.r.l - testere, w: b.r.w - testere, dondu: b.dondu });
        sh.s.kullanilan += p.boy * p.en;
        yerlesti = true;
        break;
      }
    }
    if (!yerlesti) {
      const mr = new MaxRects(L, W);
      const b = mr.bul(pl, pw, dondur)!;
      mr.yerlestir(b.r);
      sheets.push({
        mr,
        s: { yerlesim: [{ part: p, x: b.r.x + tiras, y: b.r.y + tiras, l: b.r.l - testere, w: b.r.w - testere, dondu: b.dondu }], kullanilan: p.boy * p.en },
      });
    }
  }
  const toplamPlaka = sheets.length * plakaBoy * plakaEn;
  const kullanilan = sheets.reduce((s, x) => s + x.s.kullanilan, 0);
  return {
    sheets: sheets.map((s) => s.s),
    sigmayan,
    verim: toplamPlaka ? kullanilan / toplamPlaka : 0,
    plakaBoy,
    plakaEn,
  };
}
