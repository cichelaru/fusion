import { Component, effect, inject, signal, untracked } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AssistantService } from './core/assistant.service';
import { AuthService, RLAB } from './core/auth.service';
import { enhanceSelects } from './core/select-enhancer';
import { DataService } from './core/data.service';
import { StateService } from './core/state.service';
import { fmt, initials, store, today } from './core/util';
import { KbModalComponent } from './features/shared/kb-modal.component';

const COMPANIES: [string, string][] = [
  ['RER', 'Rețele Electrice (distribuție)'], ['PPE', 'PPC Energie (furnizare)'], ['PPCRO', 'PPC România'],
  ['PRR', 'PPC Renewables'], ['PTR', 'PPC Trading'], ['PBR', 'PPC Blue'], ['PAE', 'PPC Advanced Energy']
];

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, KbModalComponent],
  templateUrl: './app.component.html'
})
export class AppComponent {
  data = inject(DataService);
  auth = inject(AuthService);
  state = inject(StateService);
  private assistant = inject(AssistantService);
  companies = COMPANIES;
  rlab = RLAB;
  ini = initials;
  private router = inject(Router);
  notifOpen = signal(false);
  permisDays(): number { return Math.round((this.auth.profile.permisExp.getTime() - today.getTime()) / 864e5); }
  permisDate(): string { return fmt(this.auth.profile.permisExp); }
  prepPermis(): void {
    this.notifOpen.set(false);
    this.state.pendingQuestion.set('Vreau să actualizez permisul de conducere');
    this.router.navigate(['/asistent']);
  }
  theme = signal<'light' | 'dark'>(this.initialTheme());
  private initialTheme(): 'light' | 'dark' {
    const saved = store.get<string>('local', 'fusion.theme', '');
    const t = saved === 'dark' || saved === 'light' ? saved : (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', t);
    return t;
  }

  setTheme(t: 'light' | 'dark'): void {
    this.theme.set(t);
    document.documentElement.setAttribute('data-theme', t);
    store.set('local', 'fusion.theme', t);
  }

  constructor() {
    this.data.load();
    enhanceSelects();
    // la schimbarea utilizatorului conversația pornește de la zero
    effect(() => { this.auth.user(); untracked(() => this.assistant.reset()); });
  }

  onCompany(e: Event): void {
    const s = e.target as HTMLSelectElement;
    this.state.company.set(s.value);
    this.state.toast('Documentele pentru ' + s.selectedOptions[0].text + ' apar primele în căutare.');
  }
}
