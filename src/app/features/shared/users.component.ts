import { Component, inject } from '@angular/core';
import { RLAB } from '../../core/auth.service';
import { DataService } from '../../core/data.service';
import { StateService } from '../../core/state.service';
import { store } from '../../core/util';

/** Utilizatori și roluri. Schimbările se salvează în localStorage (fără backend). */
@Component({
  selector: 'app-users',
  standalone: true,
  template: `
  <div class="box"><h4>Utilizatori și roluri</h4>
    <p class="small" style="margin-top:-6px">Rolul decide ce tab-uri apar. Schimbarea este simulată, se salvează local și se aplică la următoarea autentificare a utilizatorului.</p>
    <table><thead><tr><th>Utilizator</th><th>E-mail</th><th>Funcția</th><th>Rol</th></tr></thead><tbody>
      @for (u of data.users(); track u.email) {
        <tr><td><b>{{ u.nume }}</b></td><td>{{ u.email }}</td><td>{{ u.functie }}</td>
          <td><select (change)="setRole(u, $any($event.target).value)">
            @for (r of roles; track r) { <option [value]="r" [selected]="u.role === r">{{ lab[r] }}</option> }
          </select></td></tr>
      }
    </tbody></table>
  </div>`
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
