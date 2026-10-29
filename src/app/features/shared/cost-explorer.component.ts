import { Component, computed, inject, signal } from '@angular/core';
import { COST_DIMS, COST_NOCNT, CostService, MONTHS } from '../../core/cost.service';
import { fRON, nf0 } from '../../core/util';

/** Explorator de cost OPEX (date din cost.json, agregate din dashboardul „Cost mediu / comandă unică”). */
@Component({
  selector: 'app-cost-explorer',
  standalone: true,
  templateUrl: './cost-explorer.component.html'
})
export class CostExplorerComponent {
  cost = inject(CostService);
  dims = COST_DIMS;
  dim = signal('nt');
  met = signal('avg');
  comp = signal('');

  val(e: Event): string { return (e.target as HTMLSelectElement).value; }
  src(): string { const M = this.cost.cube.meta; return M.sursa + ' · generat ' + M.generat; }

  /** Pentru criteriile calculate pe linii nu există număr de comenzi: se afișează doar costul total. */
  private metric = computed(() => COST_NOCNT.has(this.dim()) && this.met() !== 'v' ? 'v' : this.met());
  private rows = computed(() => {
    const m = this.metric();
    return this.cost.rows(this.dim(), this.comp()).slice().sort((a: any, b: any) => (b[m] ?? 0) - (a[m] ?? 0));
  });
  more = computed(() => Math.max(0, this.rows().length - 12));
  top = computed(() => {
    const m = this.metric(), top = this.rows().slice(0, 12) as any[];
    const mx = Math.max(...top.map(r => r[m] || 0), 1);
    return top.map(r => ({ e: r.e, pct: Math.max(1, (r[m] || 0) / mx * 100), txt: m === 'n' ? nf0.format(r.n) + ' cmd' : m === 'v' ? fRON(r.v) : nf0.format(r.avg) + ' RON' }));
  });
  months = computed(() => {
    const mo = this.cost.monthly(this.comp()), mm = Math.max(...mo.map(x => x.v), 1);
    return mo.map(x => ({ luna: x.luna, name: MONTHS[x.luna], full: fRON(x.v), short: fRON(x.v).replace(' mil. RON', 'M'), h: x.v / mm * 85 }));
  });
  foot = computed(() => {
    const M = this.cost.cube.meta;
    return 'Cost mediu = cost total / număr de comenzi unice. ' + (COST_NOCNT.has(this.dim()) ? 'Pentru acest criteriu se afișează doar costul total (se calculează pe linii de cost). ' : '') + 'Valorile negative (storno) sunt incluse: ' + M.negLines + ' linii, ' + M.negOrders + ' comenzi.';
  });
}
