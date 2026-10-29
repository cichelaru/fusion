import { Component, effect, inject, signal, untracked } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AssistantService } from './core/assistant.service';
import { AuthService, RLAB } from './core/auth.service';
import { DataService } from './core/data.service';
import { StateService } from './core/state.service';
import { initials, store } from './core/util';
import { KbModalComponent } from './features/shared/kb-modal.component';

const COMPANIES: [string, string][] = [
  ['RER', 'Rețele Electrice (distribuție)'], ['PPE', 'PPC Energie (furnizare)'], ['PPCRO', 'PPC România'],
  ['PRR', 'PPC Renewables'], ['PTR', 'PPC Trading'], ['PBR', 'PPC Blue'], ['PAE', 'PPC Advanced Energy']
];

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, KbModalComponent],
  template: `
  @if (data.error()) {
    <div class="loading err">{{ data.error() }}</div>
  } @else if (!data.ready()) {
    <div class="loading">Se încarcă datele locale…</div>
  } @else {
    <div [class.shell]="auth.isLoggedIn()">
      @if (auth.isLoggedIn()) {
        <aside class="sidebar">
          <div class="brand"><img class="flogo" alt="Fusion" src="logo.jpg"><b>Fusion</b></div>
          <select title="Compania pentru care se prioritizează documentele" class="co-select" (change)="onCompany($event)">
            @for (c of companies; track c[0]) { <option [value]="c[0]" [selected]="c[0] === state.company()">{{ c[1] }}</option> }
          </select>
          <nav>
            <a routerLink="/asistent" routerLinkActive="active">Asistent</a>
            <a routerLink="/cereri" routerLinkActive="active">Cererile mele@if (state.requests().length) { <span class="nav-badge">{{ state.requests().length }}</span> }</a>
            <a routerLink="/personal" routerLinkActive="active">Dashboardul meu</a>
            @if (auth.role() === 'owner') { <a routerLink="/owner" routerLinkActive="active">Dashboard owner</a> }
            @if (auth.role() === 'admin') {
              <div class="nav-group">Dashboard admin</div>
              <a class="sub" routerLink="/admin/activitate" routerLinkActive="active">Activitate</a>
              <a class="sub" routerLink="/admin/sisteme" routerLinkActive="active">Conexiuni sisteme</a>
              <a class="sub" routerLink="/admin/utilizatori" routerLinkActive="active">Utilizatori și roluri</a>
              <a class="sub" routerLink="/admin/kb" routerLinkActive="active">Bază de cunoștințe</a>
            }
            <a routerLink="/flux" routerLinkActive="active">Cum funcționează</a>
          </nav>
        </aside>
      }
      <div class="content">
        @if (auth.isLoggedIn()) {
          <header>
            <div class="user">
              <div class="avatar">{{ ini(auth.user().nume) }}</div>
              <div><b>{{ auth.user().nume }}</b><br><span id="uRole" style="opacity:.8">{{ auth.user().zona }} · <span [class]="'pill role-' + auth.role()">{{ rlab[auth.role()] }}</span></span></div>
              <button class="btn ghost sm" type="button" (click)="auth.logout()">Deconectare</button>
            </div>
            <select class="style-select" aria-label="Stil aplicație" title="Stil aplicație" [value]="style()" (change)="setStyle($any($event.target).value)">
              @for (st of styles; track st.id) { <option [value]="st.id">{{ st.label }}</option> }
            </select>
            <div class="theme-toggle" role="group" aria-label="Tema aplicației">
              <button type="button" [class.on]="theme() === 'light'" title="Mod luminos" aria-label="Mod luminos" (click)="setTheme('light')">
                <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
              </button>
              <button type="button" [class.on]="theme() === 'dark'" title="Mod întunecat" aria-label="Mod întunecat" (click)="setTheme('dark')">
                <svg viewBox="0 0 24 24"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>
              </button>
            </div>
          </header>
          <div class="demo-strip">Prototip pentru concurs: profilul, contactele, termenele și cifrele sunt <b>date-exemplu</b>. Autentificarea, trimiterea și statusul cererilor sunt simulate. Datele rămân local, în browser (fără backend).</div>
        }
        <main><router-outlet /></main>
      </div>
    </div>
    <app-kb-modal />
  }
  <div class="toast" [class.show]="!!state.toastMsg()">{{ state.toastMsg() }}</div>`
})
export class AppComponent {
  data = inject(DataService);
  auth = inject(AuthService);
  state = inject(StateService);
  private assistant = inject(AssistantService);
  companies = COMPANIES;
  rlab = RLAB;
  ini = initials;
  theme = signal<'light' | 'dark'>(this.initialTheme());
  styles = [
    { id: 'classic', label: 'Clasic', files: [] as string[] },
    { id: 'futuristic', label: 'Futurist', files: ['futuristic'] },
    { id: 'emerald', label: 'Smarald', files: ['emerald'] },
    { id: 'ocean', label: 'Ocean', files: ['ocean'] },
    { id: 'sunset', label: 'Apus', files: ['sunset'] },
    { id: 'desert', label: 'Deșert', files: ['desert'] },
    { id: 'cires', label: 'Floare de cireș', files: ['cires'] },
    { id: 'navy', label: 'PPC Navy', files: ['navy'] },
  ];
  style = signal<string>(this.initialStyle());

  private initialStyle(): string {
    const saved = store.get<string>('local', 'fusion.style', 'futuristic');
    const id = this.styles.some(x => x.id === saved) ? saved : 'futuristic';
    this.applyStyle(id);
    return id;
  }

  private applyStyle(id: string): void {
    document.querySelectorAll('link[data-fusion-style]').forEach(l => l.remove());
    document.documentElement.setAttribute('data-style', id);
    for (const f of this.styles.find(x => x.id === id)!.files) {
      const l = document.createElement('link');
      l.rel = 'stylesheet'; l.href = `themes/${f}.css`; l.setAttribute('data-fusion-style', f);
      document.head.appendChild(l);
    }
  }

  setStyle(id: string): void {
    this.style.set(id);
    this.applyStyle(id);
    store.set('local', 'fusion.style', id);
  }

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
    // la schimbarea utilizatorului conversația pornește de la zero
    effect(() => { this.auth.user(); untracked(() => this.assistant.reset()); });
  }

  onCompany(e: Event): void {
    const s = e.target as HTMLSelectElement;
    this.state.company.set(s.value);
    this.state.toast('Documentele pentru ' + s.selectedOptions[0].text + ' apar primele în căutare.');
  }
}
