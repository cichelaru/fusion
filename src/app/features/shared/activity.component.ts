import { Component, Input, computed, inject } from '@angular/core';
import { KbService } from '../../core/kb.service';
import { StateService, STATUS } from '../../core/state.service';

/** KPI-uri, cele mai frecvente nevoi, goluri în baza de cunoștințe și cereri rutate. */
@Component({
  selector: 'app-activity',
  standalone: true,
  template: `
  <div class="sec-title"><h2>{{ title }}</h2><span class="small">Ultimele 30 de zile (date simulate) + activitatea din această sesiune</span></div>
  <div class="kpis">
    @for (k of kpis(); track k.l) {
      <div class="kpi"><div class="l">{{ k.l }}</div><div class="v">{{ k.v }}</div><div class="s">{{ k.s }}</div></div>
    }
  </div>
  <div class="grid2">
    <div class="box"><h4>Cele mai frecvente nevoi</h4>
      @for (r of topRows(); track r.e.id) {
        <div class="bar-row"><div><span [class]="'tag ' + r.e.domain">{{ r.e.domain }}</span> {{ r.e.title }}</div><div class="bar"><i [style.width.%]="r.pct"></i></div><b>{{ r.n }}</b></div>
      }
    </div>
    <div class="box">
      <h4>Întrebări fără răspuns (goluri în baza de cunoștințe)</h4>
      <p class="small" style="margin-top:-6px">Asistentul învață din ce nu știe. Owner-ul adaugă răspunsul o singură dată și de acum îl primesc toți colegii, fără cod nou.</p>
      <table><thead><tr><th>Întrebare</th><th>Domeniu</th><th>Cereri</th><th></th></tr></thead><tbody>
        @for (g of state.gaps(); track g.q; let i = $index) {
          <tr><td>{{ g.q }}</td><td><span [class]="'tag ' + (g.dom === 'Neclasificat' ? 'Altele' : g.dom)">{{ g.dom }}</span></td><td><span class="cnt">{{ g.n }}</span></td>
            <td><button class="btn sm fill" type="button" (click)="state.modal.set({ gap: g, idx: i })">Adaugă răspuns</button></td></tr>
        } @empty {
          <tr><td colspan="4" class="empty">Nu există goluri. Baza de cunoștințe acoperă toate întrebările.</td></tr>
        }
      </tbody></table>
    </div>
  </div>
  <div class="box" style="margin-top:20px">
    <h4>Cererile rutate către echipe</h4>
    <table><thead><tr><th>ID</th><th>Cerere</th><th>Echipa</th><th>Status</th><th>Termen</th></tr></thead><tbody>
      @for (r of allReqs(); track r.id) {
        <tr><td class="id" style="font-family:Consolas,monospace">{{ r.id }}</td>
          <td>{{ r.title }}@if (r.mine) { <span class="small"> (din sesiunea demo)</span> }</td><td>{{ r.team }}</td>
          <td><b [style.color]="color(r)">{{ label(r) }}</b></td><td>{{ r.sla }}</td></tr>
      }
    </tbody></table>
  </div>`
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
