import { Injectable, inject } from '@angular/core';
import { DataService } from './data.service';
import { esc, fRON, nf0, nf2, norm } from './util';

export const COST_DIMS = ['nt', 'tip', 'sect', 'tc', 'gp', 'cat', 'cp', 'ta', 'ecl', 'nat', 'anre'];
/** Criterii calculate pe linii de cost (nu au număr de comenzi). */
export const COST_NOCNT = new Set(['ecl', 'nat']);
export const MONTHS: Record<string, string> = { '1': 'ianuarie', '2': 'februarie', '3': 'martie', '4': 'aprilie', '5': 'mai', '6': 'iunie', '7': 'iulie' };
/** Rolul minim care poate vedea costurile: 1 = owner, 2 = admin. Pune 0 ca să răspundă tuturor. */
export const COST_MIN_RANK = 1;

export interface CostRow { e: string; n?: number; v: number; avg?: number; }

/** Datele agregate din dashboardul „Cost mediu / comandă unică” (fișier local cost.json). */
@Injectable({ providedIn: 'root' })
export class CostService {
  private data = inject(DataService);

  get cube(): any { return this.data.cost(); }

  dimLabel(dim: string): string { return this.cube.dimLabels[dim]; }

  rows(dim: string, comp = ''): CostRow[] {
    if (!comp) return this.cube.dim[dim];
    return (this.cube.cross[dim] || []).filter((r: any) => r.c === comp).map((r: any) => ({ e: r.e, n: r.n, v: r.v, avg: r.avg }));
  }

  /** Cost total pe luni, opțional pentru o singură companie. */
  monthly(comp = ''): { luna: string; v: number }[] {
    const by: Record<string, number> = {};
    this.cube.perComp.filter((r: any) => !comp || r.c === comp).forEach((r: any) => by[r.luna] = (by[r.luna] || 0) + r.v);
    return this.cube.per.map((p: any) => ({ luna: p.luna, v: by[p.luna] || 0 }));
  }

  kpis(): { l: string; v: string; s: string }[] {
    const M = this.cube.meta, pc = M.perComp;
    return [
      { l: 'Cost total', v: fRON(M.total), s: 'ian–iul 2026' },
      { l: 'Comenzi unice', v: nf0.format(M.orders), s: nf0.format(M.rows) + ' linii de cost' },
      { l: 'Cost mediu / comandă', v: nf0.format(M.total / M.orders) + ' RON', s: 'toate companiile' },
      ...Object.keys(pc).map(c => ({ l: c, v: nf0.format(pc[c].v / pc[c].n) + ' RON/cmd', s: fRON(pc[c].v) + ' · ' + nf0.format(pc[c].n) + ' cmd' }))
    ];
  }

  // ---------- răspunsuri pentru asistent (HTML) ----------

  isCostQuestion(t: string): boolean {
    return /\b(cost|costuri|costul|costat|costa|opex|cheltuit|cheltuieli|rod ?[123]|mediu pe comanda|medie pe comanda)\b/.test(norm(t));
  }

  private bars(rows: CostRow[], met: 'avg' | 'v' | 'n', lim = 8): string {
    const top = rows.slice(0, lim), mx = Math.max(...top.map(r => (r as any)[met] || 0), 1);
    return top.map(r => `<div class="cbar"><div class="lab" title="${esc(r.e)}">${esc(r.e)}</div><div class="bar"><i style="width:${Math.max(1, ((r as any)[met] || 0) / mx * 100)}%"></i></div><b>${met === 'n' ? nf0.format(r.n || 0) + ' cmd' : met === 'v' ? fRON(r.v) : nf0.format(r.avg || 0) + ' RON'}</b></div>`).join('');
  }

  private findEntities(n: string): { dim: string; e: string; sc: number; isCode: boolean }[] {
    const CSTOP = new Set('de la cu in pe si sau din cel mai mic mare pentru este sunt care cat cate ce cum unde per'.split(' '));
    const pad = ' ' + n + ' ', out: any[] = [];
    for (const dim of COST_DIMS) {
      let best: any = null;
      for (const r of this.cube.dim[dim]) {
        const lab: string = r.e, nl = norm(lab);
        if (nl.length < 2 || /^fara /.test(nl)) continue;
        const code = norm(lab.split(' · ')[0]);
        let sc = 0, isCode = false;
        if (pad.includes(' ' + nl + ' ')) sc = nl.length + 10;
        else if (lab.includes(' · ') && code.length >= 2 && pad.includes(' ' + code + ' ')) { sc = code.length + 5; isCode = true; }
        else {
          const toks = nl.split(' ').filter(w => w.length >= 4 && !CSTOP.has(w));
          if (toks.length && toks.every(w => pad.includes(' ' + w + ' ') || pad.includes(' ' + w.slice(0, Math.max(4, w.length - 2))))) sc = toks.join('').length;
        }
        if (sc > 0 && (!best || sc > best.sc)) best = { dim, e: lab, sc, isCode };
      }
      if (best) out.push(best);
    }
    const kw: [RegExp, string, string][] = [
      [/manopera|personal/, 'nat', 'Personal (manoperă)'], [/terti/, 'nat', 'Terți'], [/materiale/, 'nat', 'Materiale'],
      [/corectiv/, 'cat', 'Mentenanță corectivă'], [/preventiv|planificat/, 'cat', 'Mentenanță planificată (preventivă)']
    ];
    kw.forEach(([rx, dim, lab]) => {
      if (rx.test(n) && !out.some(o => o.dim === dim && o.e === lab) && this.cube.dim[dim].some((r: any) => r.e === lab)) out.push({ dim, e: lab, sc: 14, isCode: false });
    });
    const noCode = out.some(o => !o.isCode);
    const m: Record<string, any> = {};
    out.filter(o => !(noCode && o.isCode)).forEach(o => { if (!m[o.dim] || o.sc > m[o.dim].sc) m[o.dim] = o; });
    return Object.values(m).sort((a, b) => b.sc - a.sc).slice(0, 3);
  }

  denied(): string {
    return `<p class="lead"><b>Datele de cost OPEX nu sunt disponibile pentru rolul tău.</b></p><div class="card">Costurile pe comenzi sunt vizibile doar pentru owner-ii de domeniu și administratori. Dacă ai nevoie de o cifră, cererea poate fi trimisă către echipa de Control financiar / owner-ul datelor.</div>`;
  }

  answer(text: string): string {
    const n = norm(text), M = this.cube.meta, pad = ' ' + n + ' ';
    const comps: string[] = [];
    ([['ROD1', /rod ?1| rem /], ['ROD2', /rod ?2| reb /], ['ROD3', /rod ?3| red /]] as [string, RegExp][]).forEach(([c, rx]) => { if (rx.test(pad)) comps.push(c); });
    const comp = comps.length === 1 ? comps[0] : '';
    const met: 'avg' | 'v' | 'n' = /cate comenzi|numar|numarul|volum/.test(n) ? 'n' : (/mediu|medie|pe comanda|per comanda|unitar/.test(n) ? 'avg' : (/total|cheltuit|cheltuieli|suma|cat a costat|cat costa|cat au costat|costuri/.test(n) ? 'v' : 'avg'));
    const asc = /cel mai mic|ieftin|minim|cea mai mica/.test(n);
    const ents = this.findEntities(n);
    const SRC = `<div class="small" style="margin-top:8px">Sursa: ${esc(M.sursa)} · generat ${M.generat}. Cost mediu = cost total / comenzi unice.</div>`;
    let h = '<div class="chat-cost">';

    if (/luna|lunar|luni|evolutie|iulie|iunie|mai|aprilie|martie|februarie|ianuarie/.test(n) && !ents.length) {
      const mo = this.monthly(comp);
      const rows: CostRow[] = mo.map(p => ({ e: MONTHS[p.luna] + ' 2026', v: p.v }));
      const sel = Object.keys(MONTHS).find(k => n.includes(MONTHS[k]));
      const sv = sel ? mo.find(p => p.luna === sel)?.v || 0 : 0;
      return h + `<p class="lead"><b>Cost total pe luni${comp ? ' · ' + comp : ''}</b>${sel ? ` · în ${MONTHS[sel]}: <b>${fRON(sv)}</b>` : ''}</p>` + this.bars(rows, 'v', 7) + SRC + '</div>';
    }

    if (ents.length) {
      ents.forEach(en => {
        const rows = this.rows(en.dim, comp), r: any = rows.find(x => x.e === en.e);
        if (!r) return;
        const tot = comp ? M.perComp[comp].v : M.total, ordN = comp ? M.perComp[comp].n : M.orders;
        h += `<p class="lead"><b>${esc(en.e)}</b> <span class="small">· ${esc(this.dimLabel(en.dim))}${comp ? ' · ' + comp : ''}</span></p><div class="mini">`;
        if (!COST_NOCNT.has(en.dim)) {
          const gAvg = tot / ordN;
          h += `<div><div class="l">Cost mediu / comandă</div><div class="v">${nf0.format(r.avg)} RON</div></div><div><div class="l">Comenzi</div><div class="v">${nf0.format(r.n)}</div></div><div><div class="l">Cost total</div><div class="v">${fRON(r.v)}</div></div><div><div class="l">Pondere din total</div><div class="v">${nf2.format(r.v / tot * 100)}%</div></div></div>`;
          h += `<div class="small">Față de media ${comp || 'globală'} (${nf0.format(gAvg)} RON/comandă): <b>${nf2.format(r.avg / gAvg)}×</b>.</div>`;
        } else {
          h += `<div><div class="l">Cost total</div><div class="v">${fRON(r.v)}</div></div><div><div class="l">Pondere din total</div><div class="v">${nf2.format(r.v / tot * 100)}%</div></div></div>`;
        }
        if (!comp) {
          const cr = (this.cube.cross[en.dim] || []).filter((x: any) => x.e === en.e).sort((a: any, b: any) => a.c < b.c ? -1 : 1);
          if (cr.length) h += `<div style="margin-top:6px">` + this.bars(cr.map((x: any) => ({ e: x.c, n: x.n, v: x.v, avg: x.avg })), COST_NOCNT.has(en.dim) && met !== 'v' ? 'v' : met, 3) + `</div>`;
        }
      });
      if (h === '<div class="chat-cost">') h += '<p class="lead">Nu am găsit date pentru combinația cerută.</p>';
      return h + SRC + '</div>';
    }

    const DM: [RegExp, string][] = [[/nivel de tensiune|tensiune/, 'nt'], [/subtip/, 'sect'], [/tip instalat|instalat/, 'tip'], [/tip comanda|comenzi de tip/, 'tc'], [/zona|zone|grup planificare|regiune/, 'gp'], [/centru de profit|centre de profit/, 'cp'], [/categori/, 'cat'], [/natura|natur/, 'nat'], [/element de cost|elemente de cost/, 'ecl'], [/anre/, 'anre'], [/activitate|activitati/, 'ta']];
    const dm = DM.find(([rx]) => rx.test(n));
    if (dm) {
      const dim = dm[1]; let m = met; if (COST_NOCNT.has(dim)) m = 'v';
      const rows = this.rows(dim, comp).slice().sort((a: any, b: any) => asc ? (a[m] - b[m]) : (b[m] - a[m]));
      return h + `<p class="lead"><b>${asc ? 'Cele mai mici' : 'Top'} · ${m === 'avg' ? 'cost mediu / comandă' : m === 'n' ? 'număr de comenzi' : 'cost total'} pe ${esc(this.dimLabel(dim).toLowerCase())}</b>${comp ? ' · ' + comp : ''}</p>` + this.bars(rows, m, 8) + SRC + '</div>';
    }

    const pc = M.perComp;
    const rows: any[] = Object.keys(pc).filter(c => !comp || c === comp).map(c => ({ e: c, n: pc[c].n, v: pc[c].v, avg: pc[c].v / pc[c].n }));
    rows.sort((a, b) => asc ? (a[met] - b[met]) : (b[met] - a[met]));
    const T = comp ? pc[comp].v : M.total, N = comp ? pc[comp].n : M.orders;
    return h + `<p class="lead"><b>${comp || 'Toate companiile (ROD1–ROD3)'}</b>: cost total <b>${fRON(T)}</b>, <b>${nf0.format(N)}</b> comenzi, cost mediu <b>${nf0.format(T / N)} RON</b> / comandă (ian–iul 2026).</p>` + this.bars(rows, met, 3) + '<div class="small" style="margin-top:6px">Poți întreba și pe criterii: nivel de tensiune, tip instalație, zonă, tip comandă, manoperă/materiale/terți, pe luni.</div>' + SRC + '</div>';
  }
}
