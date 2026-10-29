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
  templateUrl: './systems.component.html'
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
