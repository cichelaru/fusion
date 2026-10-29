import { Component, computed, inject, signal } from '@angular/core';
import { COST_DIMS, COST_NOCNT, CostService, MONTHS } from '../../core/cost.service';
import { fRON, nf0 } from '../../core/util';

/** Explorator de cost OPEX (date din cost.json, agregate din dashboardul „Cost mediu / comandă unică”). */
@Component({
  selector: 'app-cost-explorer',
  standalone: true,
  template: `
  <div class="box">
    <div class="row-head"><h4 style="margin:0">Cost mediu / comandă · Activitate operativă OPEX</h4><span class="small">{{ src() }}</span></div>
    <div class="kpis" style="margin:14px 0">
      @for (k of cost.kpis(); track k.l) {
        <div class="kpi"><div class="l">{{ k.l }}</div><div class="v" style="font-size:22px">{{ k.v }}</div><div class="s">{{ k.s }}</div></div>
      }
    </div>
    <div class="ctrl">
      <label>Criteriu <select (change)="dim.set(val($event))">
        @for (d of dims; track d) { <option [value]="d" [selected]="d === dim()">{{ cost.dimLabel(d) }}</option> }
      </select></label>
      <label>Indicator <select (change)="met.set(val($event))">
        <option value="avg" [selected]="met() === 'avg'">Cost mediu / comandă</option>
        <option value="v" [selected]="met() === 'v'">Cost total</option>
        <option value="n" [selected]="met() === 'n'">Număr comenzi</option>
      </select></label>
      <label>Companie <select (change)="comp.set(val($event))">
        <option value="">Toate (ROD1–ROD3)</option><option>ROD1</option><option>ROD2</option><option>ROD3</option>
      </select></label>
    </div>
    @for (r of top(); track r.e) {
      <div class="cbar"><div class="lab" [title]="r.e">{{ r.e }}</div><div class="bar"><i [style.width.%]="r.pct"></i></div><b>{{ r.txt }}</b></div>
    }
    @if (more() > 0) { <div class="small">…și încă {{ more() }} valori</div> }
    <h4 style="margin:18px 0 6px">Evoluția lunară (cost total, 2026)</h4>
    <div class="months">
      @for (m of months(); track m.luna) {
        <div [title]="m.name + ': ' + m.full"><span>{{ m.short }}</span><i [style.height.%]="m.h"></i>{{ m.name.slice(0, 3) }}.</div>
      }
    </div>
    <p class="small">{{ foot() }}</p>
  </div>`
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
