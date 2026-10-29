import { Component, effect, inject, signal, untracked } from '@angular/core';
import { LIB_PRE } from '../../core/data.service';
import { SearchService } from '../../core/search.service';
import { StateService } from '../../core/state.service';
import { norm } from '../../core/util';

const STOP = new Set(['cine', 'cum', 'unde', 'care', 'este', 'sunt', 'pentru', 'imi', 'trebuie', 'vreau', 'fac', 'face', 'gasesc', 'despre', 'ocupa', 'ceva', 'acest', 'aceasta', 'aproba', 'aprobă', 'poate', 'dupa', 'catre', 'inca']);
const suggestKw = (q: string): string => [...new Set(norm(q).split(' ').filter(w => w.length > 3 && !STOP.has(w)).map(w => w.slice(0, 6)))].join(', ');
const DOMAINS = ['HR', 'IT', 'Financiar', 'Achiziții', 'Travel', 'Facility', 'Juridic', 'Compliance', 'Altele'];

/** Fereastra în care owner-ul adaugă un răspuns (la un gol sau o intrare nouă). Se salvează în localStorage. */
@Component({
  selector: 'app-kb-modal',
  standalone: true,
  template: `
  <div class="modal-bg" [class.open]="!!state.modal()"><div class="modal">
    <h3>{{ title() }}</h3>
    <p class="small" style="margin:0 0 10px">Owner-ul completează o singură dată. Asistentul folosește imediat noul răspuns.</p>
    <div class="form-grid">
      <div class="field full"><label>Nevoia / întrebarea</label><input [value]="q()" (input)="onQ($any($event.target).value)"></div>
      <div class="field"><label>Domeniu</label><select (change)="dom.set($any($event.target).value)">
        @for (d of domains; track d) { <option [selected]="d === dom()">{{ d }}</option> }
      </select></div>
      <div class="field"><label>Cuvinte cheie (separate prin virgulă)</label><input [value]="kw()" (input)="kw.set($any($event.target).value)"></div>
      <div class="field full"><label>Răspuns / pași</label><textarea [value]="a()" (input)="a.set($any($event.target).value)" placeholder="Ex.: Decontul se depune în maximum 3 zile de la întoarcere, cu documentele justificative..."></textarea></div>
      <div class="field"><label>Responsabil (rol / echipă)</label><input [value]="r()" (input)="r.set($any($event.target).value)" placeholder="Ex.: Echipa Financiar – Deconturi"></div>
      <div class="field"><label>Link sau canal</label><input [value]="l()" (input)="l.set($any($event.target).value)" placeholder="Ex.: portal intern › Deconturi"></div>
      <div class="field full"><label>Leagă de un folder sau document din bibliotecă (opțional)</label>
        <input [value]="f()" (input)="f.set($any($event.target).value)" list="libFolders" placeholder="Începe să scrii numele folderului, ex.: Oferte Banci">
        <datalist id="libFolders">@for (x of search.folders(); track x) { <option [value]="x"></option> }</datalist></div>
    </div>
    <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:16px">
      <button class="btn ghost" type="button" (click)="close()">Renunță</button><button class="btn" type="button" (click)="save()">Salvează în baza de cunoștințe</button>
    </div>
  </div></div>`
})
export class KbModalComponent {
  state = inject(StateService);
  search = inject(SearchService);
  domains = DOMAINS;
  title = signal('Adaugă intrare nouă');
  q = signal(''); dom = signal('Financiar'); kw = signal(''); a = signal(''); r = signal(''); l = signal(''); f = signal('');
  private fromGap = false;

  constructor() {
    effect(() => {
      const m = this.state.modal();
      if (!m) return;
      untracked(() => {
        const g = m.gap;
        this.fromGap = m.idx !== null;
        this.title.set(g ? 'Adaugă răspuns la o întrebare fără răspuns' : 'Adaugă intrare nouă');
        this.q.set(g ? g.q : ''); this.dom.set(g && g.dom !== 'Neclasificat' ? g.dom : 'Financiar');
        this.kw.set(g ? suggestKw(g.q) : ''); this.a.set(''); this.r.set(''); this.l.set(''); this.f.set(g && g.f ? g.f : '');
      });
    });
  }

  onQ(v: string): void { this.q.set(v); if (!this.fromGap) this.kw.set(suggestKw(v)); }
  close(): void { this.state.modal.set(null); }

  save(): void {
    const q = this.q().trim(), a = this.a().trim(), kws = this.kw().split(',').map(x => norm(x)).filter(Boolean);
    if (!q || !a || !kws.length) { this.state.toast('Completează întrebarea, cuvintele cheie și răspunsul.'); return; }
    const fpath = this.f().trim().replace(/^\/+|\/+$/g, '');
    const id = 'u' + Date.now();
    if (fpath) {
      const last = fpath.split('/').pop()!;
      this.state.addKb({ id, domain: this.dom(), type: 'link', title: q, answer: a, team: this.r().trim() || 'Owner bază de cunoștințe', kw: kws.map(k => [k, 3]), today: '',
        sources: [{ n: fpath.split('/').join(' › '), u: LIB_PRE + fpath }],
        ext: { sys: /\.[a-z0-9]{2,4}$/i.test(last) ? 'documentul' : 'folderul „' + last + '”', url: LIB_PRE + fpath } });
    } else {
      this.state.addKb({ id, domain: this.dom(), type: 'info', title: q, answer: a, team: this.r().trim(), link: this.l().trim(), kw: kws.map(k => [k, 3]), today: '' });
    }
    if (this.state.modal()?.idx != null) this.state.removeGap(this.state.modal()!.idx!);
    this.close();
    this.state.toast('Salvat. Asistentul răspunde de acum la această întrebare, fără cod nou. Încearc-o în tab-ul Asistent.');
  }
}
