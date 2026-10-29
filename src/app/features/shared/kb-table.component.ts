import { Component, inject } from '@angular/core';
import { KbService } from '../../core/kb.service';
import { StateService } from '../../core/state.service';

const LABEL: Record<string, string> = { form: 'Cerere precompletată', steps: 'Pași', contact: 'Persoană / echipă', info: 'Răspuns', link: 'Link + pași', choice: 'Clarificare (alegere)' };

/** Lista intrărilor din baza de cunoștințe + butonul de adăugare. */
@Component({
  selector: 'app-kb-table',
  standalone: true,
  templateUrl: './kb-table.component.html'
})
export class KbTableComponent {
  kb = inject(KbService);
  state = inject(StateService);
  label = LABEL;
}
