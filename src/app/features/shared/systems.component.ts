import { Component, computed, inject, signal } from '@angular/core';
import { DataService } from '../../core/data.service';
import { StateService } from '../../core/state.service';

const ST_LAB: Record<string, string> = { ok: 'Conectat', demo: 'Demo / simulat', plan: 'Planificat', err: 'Eroare' };
const MATRIX = [
  ['Asistent (HR, IT, documente)', '✓', '✓', '✓'],
  ['Dashboardul meu (personal)', '✓', '✓', '✓'],
  ['Cum funcționează', '✓', '✓', '✓'],
  ['Întrebări de cost OPEX în asistent', '–', '✓', '✓'],
  ['Dashboard owner (activitate, cost OPEX, bază de cunoștințe)', '–', '✓', '–'],
  ['Dashboard admin (activitate, cost OPEX, conexiuni, utilizatori, bază de cunoștințe)', '–', '–', '✓']
];
const hhmm = (s = false) => new Date().toLocaleTimeString('ro-RO', s ? { hour: '2-digit', minute: '2-digit', second: '2-digit' } : { hour: '2-digit', minute: '2-digit' });

/** Harta de integrare cu sistemele companiei (starea este simulată). */
@Component({
  selector: 'app-systems',
  standalone: true,
  template: `
  <div class="kpis">
    @for (k of kpis(); track k.l) { <div class="kpi"><div class="l">{{ k.l }}</div><div class="v">{{ k.v }}</div><div class="s">{{ k.t }}</div></div> }
  </div>
  <div class="box"><h4>Sisteme integrate</h4>
    <table><thead><tr><th>Sistem</th><th>Rol în aplicație</th><th>Integrare</th><th>Stare</th><th>Ultima verificare</th><th></th></tr></thead><tbody>
      @for (x of data.systems(); track x.n; let i = $index) {
        <tr><td><b>{{ x.n }}</b></td><td>{{ x.r }}</td><td>{{ x.i }}</td>
          <td><span [class]="'dot ' + x.st"></span><span [class]="'pill sys-' + x.st">{{ lab(x.st) }}</span></td>
          <td>@if (checking() === i) { <span class="spin"></span>se verifică… } @else { {{ last(i, x) }} }</td>
          <td><button class="btn sm ghost" type="button" [disabled]="x.st === 'plan'" (click)="test(i, x)">Testează</button></td></tr>
      }
    </tbody></table>
  </div>
  <div class="box" style="margin-top:20px"><h4>Cine vede ce</h4>
    <table class="matrix"><thead><tr><th>Secțiune</th><th>Angajat</th><th>Owner domeniu</th><th>Administrator</th></tr></thead><tbody>
      @for (r of matrix; track r[0]) { <tr>@for (c of r; track $index) { <td>{{ c }}</td> }</tr> }
    </tbody></table>
  </div>`
})
export class SystemsComponent {
  data = inject(DataService);
  private state = inject(StateService);
  matrix = MATRIX;
  checking = signal<number | null>(null);
  private checked = signal<Record<number, string>>({});
  private opened = hhmm();

  kpis = computed(() => {
    const S = this.data.systems(), c = (k: string) => S.filter(x => x.st === k).length;
    return [
      { l: 'Sisteme', v: S.length, t: 'în harta de integrare' }, { l: 'Conectate', v: c('ok'), t: 'date reale (index)' },
      { l: 'Demo / simulate', v: c('demo'), t: 'link sau date-exemplu' }, { l: 'Planificate', v: c('plan'), t: 'încă neconfigurate' }
    ];
  });
  lab(s: string): string { return ST_LAB[s]; }
  last(i: number, x: any): string { return this.checked()[i] || (x.st === 'plan' ? '-' : 'azi, ' + this.opened); }

  test(i: number, x: any): void {
    if (x.st === 'plan') return;
    this.checking.set(i);
    setTimeout(() => {
      const ms = 80 + Math.floor(Math.random() * 220);
      this.checked.update(m => ({ ...m, [i]: 'azi, ' + hhmm(true) + ' · ' + ms + ' ms' }));
      this.checking.set(null);
      this.state.toast(x.n + ': răspuns OK (' + ms + ' ms, simulat)');
    }, 800);
  }
}
