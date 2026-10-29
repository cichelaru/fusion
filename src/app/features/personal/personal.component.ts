import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { StateService, STATUS } from '../../core/state.service';
import { fmt, today } from '../../core/util';
import { MY_HISTORY as HIST } from '../../core/my-history';

const QUICK = ['Am nevoie de o adeverință pentru bancă', 'Vreau să cer concediu de odihnă', 'Ce beneficii am prin CCM?', 'Am o problemă cu telefonul de serviciu (Knox)', 'Cerere de deplasare'];

/** Dashboardul personal: vizibil pentru toți utilizatorii. */
@Component({
  selector: 'app-personal',
  standalone: true,
  template: `
  <div class="sec-title"><h2>Bună, {{ first() }}. Dashboardul tău</h2><span class="small">Datele tale personale (simulate)</span></div>
  <div class="kpis">
    @for (k of kpis(); track k.l) { <div class="kpi"><div class="l">{{ k.l }}</div><div class="v">{{ k.v }}</div><div class="s">{{ k.s }}</div></div> }
  </div>
  <div class="grid2">
    <div class="box"><h4>Cererile mele</h4>
      <div class="mylist">
        @for (r of state.requests(); track r.id) {
          <div class="req"><div class="top"><div><b>{{ r.title }}</b><div class="id">{{ r.id }} · acum</div></div><span class="pill sys-demo">{{ lab(r) }}</span></div><div class="small">{{ r.team }} · termen {{ r.sla }}</div></div>
        }
        @for (r of hist; track r.id) {
          <div class="req"><div class="top"><div><b>{{ r.title }}</b><div class="id">{{ r.id }} · {{ r.when }}</div></div><span [class]="'pill ' + (r.st === 'În lucru' ? 'sys-demo' : 'sys-ok')">{{ r.st }}</span></div><div class="small">{{ r.team }}</div></div>
        }
      </div>
    </div>
    <div class="box"><h4>Ce poți face rapid</h4>
      <p class="small" style="margin-top:-6px">Un clic și asistentul pornește cererea, precompletată cu datele tale.</p>
      <div class="quick">
        @for (q of quick(); track q) { <button class="chip" type="button" (click)="go(q)">{{ q }}</button> }
      </div>
      <h4 style="margin-top:20px">Profilul meu</h4>
      <table><tbody>
        @for (p of prof(); track p[0]) { <tr><td class="small" style="width:35%">{{ p[0] }}</td><td>{{ p[1] }}</td></tr> }
      </tbody></table>
    </div>
  </div>`
})
export class PersonalComponent {
  state = inject(StateService);
  private auth = inject(AuthService);
  private router = inject(Router);
  hist = HIST;

  private P = this.auth.profile;
  first = computed(() => (this.auth.user()?.nume || '').split(' ')[1] || this.P.nume);
  lab(r: any): string { return (r.statuses || STATUS)[r.st]; }

  kpis = computed(() => {
    this.auth.user();
    const days = Math.round((this.P.permisExp.getTime() - today.getTime()) / 864e5);
    const open = this.state.requests().length + HIST.filter(x => x.st === 'În lucru').length;
    return [
      { l: 'Zile de concediu rămase', v: String(this.P.zileCO ?? 0), s: 'din dreptul anual' },
      { l: 'Cereri deschise', v: String(open), s: 'urmărite într-un singur loc' },
      { l: 'Permis de conducere', v: 'în ' + days + ' zile', s: 'expiră ' + fmt(this.P.permisExp) },
      { l: 'Timp economisit', v: '≈ 2,4 h', s: 'luna aceasta, față de metoda veche' }
    ];
  });
  quick = computed(() => this.auth.rank() >= 1 ? [...QUICK, 'Care este costul mediu pe comandă la ROD2?', 'Cât a costat manopera în total?'] : QUICK);
  prof = computed<string[][]>(() => {
    this.auth.user();
    const P = this.P;
    return [['Marca', P.marca], ['Funcția', P.functie], ['Departament', P.departament], ['Zona', P.zona], ['E-mail', P.email], ['Telefon', P.telefon || '-'], ['Șef direct', P.sef || '-']];
  });

  /** Trimite întrebarea către asistent (se consumă la deschiderea ecranului Asistent). */
  go(q: string): void { this.state.pendingQuestion.set(q); this.router.navigate(['/asistent']); }
}
