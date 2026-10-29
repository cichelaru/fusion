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
  templateUrl: './personal.component.html'
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
