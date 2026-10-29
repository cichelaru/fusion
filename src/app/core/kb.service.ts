import { Injectable, computed, inject } from '@angular/core';
import { AuthService } from './auth.service';
import { StateService } from './state.service';
import { createKb } from './kb.data';
import { addDays, destOf, fmt, iso, nextMonday } from './util';

/** Baza de cunoștințe = intrările din cod (kb.data.ts) + cele adăugate de owner. */
@Injectable({ providedIn: 'root' })
export class KbService {
  private auth = inject(AuthService);
  private state = inject(StateService);

  all = computed<any[]>(() => {
    this.auth.user(); // se reconstruiește la schimbarea utilizatorului
    return [...createKb(this.auth.profile, { fmt, iso, addDays, nextMonday, destOf }), ...this.state.kbExtra()];
  });

  find(id: string): any { return this.all().find(e => e.id === id); }
}
