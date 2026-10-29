import { Component, inject } from '@angular/core';
import { KbService } from '../../core/kb.service';
import { StateService } from '../../core/state.service';

const LABEL: Record<string, string> = { form: 'Cerere precompletată', steps: 'Pași', contact: 'Persoană / echipă', info: 'Răspuns', link: 'Link + pași', choice: 'Clarificare (alegere)' };

/** Lista intrărilor din baza de cunoștințe + butonul de adăugare. */
@Component({
  selector: 'app-kb-table',
  standalone: true,
  template: `
  <div class="sec-title"><h2>Baza de cunoștințe</h2><button class="btn" type="button" (click)="state.modal.set({ gap: null, idx: null })">+ Adaugă intrare</button></div>
  <div class="box">
    <p class="small" style="margin-top:0">Fiecare intrare este un rând simplu, întreținut de owner-ul domeniului. Un domeniu nou (achiziții, financiar, juridic…) înseamnă doar rânduri noi, nu o aplicație nouă. Intrările noi se salvează local în browser.</p>
    <table><thead><tr><th>Domeniu</th><th>Nevoie</th><th>Tip răspuns</th><th>Responsabil</th><th>Cum se face azi</th></tr></thead><tbody>
      @for (e of kb.all(); track e.id) {
        <tr><td><span [class]="'tag ' + e.domain">{{ e.domain }}</span></td><td><b>{{ e.title }}</b></td><td>{{ label[e.type] }}</td><td>{{ e.team || '-' }}</td><td class="small">{{ e.today || '-' }}</td></tr>
      }
    </tbody></table>
  </div>`
})
export class KbTableComponent {
  kb = inject(KbService);
  state = inject(StateService);
  label = LABEL;
}
