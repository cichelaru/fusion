import { Component, inject } from '@angular/core';
import { RLAB } from '../../core/auth.service';
import { DataService } from '../../core/data.service';
import { StateService } from '../../core/state.service';
import { store } from '../../core/util';

/** Utilizatori și roluri. Schimbările se salvează în localStorage (fără backend). */
@Component({
  selector: 'app-users',
  standalone: true,
  templateUrl: './users.component.html'
})
export class UsersComponent {
  data = inject(DataService);
  private state = inject(StateService);
  roles = ['angajat', 'owner', 'admin'];
  lab: Record<string, string> = RLAB;

  setRole(u: any, role: string): void {
    this.data.users.update(a => a.map(x => x.email === u.email ? { ...x, role } : x));
    const saved = store.get<Record<string, string>>('local', 'fusion.roles', {});
    saved[u.email] = role;
    store.set('local', 'fusion.roles', saved);
    this.state.toast(u.nume + ': rol ' + RLAB[role as keyof typeof RLAB] + ' (simulat)');
  }
}
