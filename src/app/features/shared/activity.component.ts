import { Component, Input, computed, inject } from '@angular/core';
import { KbService } from '../../core/kb.service';
import { StateService, STATUS } from '../../core/state.service';

/** KPI-uri, cele mai frecvente nevoi, goluri în baza de cunoștințe și cereri rutate. */
@Component({
  selector: 'app-activity',
  standalone: true,
  templateUrl: './activity.component.html'
})
export class ActivityComponent {
  state = inject(StateService);
  private kb = inject(KbService);
  @Input() title = 'Activitate platformă';

  kpis = computed(() => {
    const q = this.state.questions(), a = this.state.auto(), lib = this.state.libHits();
    return [
      { l: 'Întrebări primite', v: String(q), s: lib ? lib + ' rezolvate prin căutare în bibliotecă' : 'colegi din toate zonele' },
      { l: 'Rezolvate fără intervenție', v: Math.round(a / q * 100) + '%', s: a + ' răspunse direct de asistent' },
      { l: 'Cereri rutate', v: String(37 + this.state.requests().length), s: 'direct la echipa corectă' },
      { l: 'Goluri de completat', v: String(this.state.gaps().length), s: 'întrebări fără răspuns' }
    ];
  });

  topRows = computed(() => {
    const kb = this.kb.all();
    const rows = Object.entries(this.state.top()).map(([id, n]) => ({ e: kb.find(e => e.id === id), n })).filter(x => x.e).sort((a, b) => b.n - a.n).slice(0, 8);
    const mx = Math.max(...rows.map(r => r.n), 1);
    return rows.map(r => ({ ...r, pct: r.n / mx * 100 }));
  });

  allReqs = computed(() => [...this.state.requests(), ...this.state.seedReq]);
  label(r: any): string { return (r.statuses || STATUS)[r.st]; }
  color(r: any): string { const last = (r.statuses || STATUS).length - 1; return r.st === last ? 'var(--ok)' : r.st > 0 ? 'var(--blue)' : 'var(--orange-d)'; }
}
