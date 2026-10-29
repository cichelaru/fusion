import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { store } from './util';

export const LIB_PRE = 'https://deidplr.sharepoint.com/sites/FSRE1030/Enel_pentru_tine/Documents/Biblioteca ta de informatii utile/';

/** Încarcă datele locale (fișiere JSON din /public/data). Nu există backend. */
@Injectable({ providedIn: 'root' })
export class DataService {
  private http = inject(HttpClient);

  /** [nume fișier, folder, fragment text, dată] */
  lib = signal<any[]>([]);
  cost = signal<any>(null);
  systems = signal<any[]>([]);
  users = signal<any[]>([]);
  ready = signal(false);
  error = signal('');

  load(): void {
    forkJoin({
      lib: this.http.get<any[]>('data/lib.json'),
      cost: this.http.get<any>('data/cost.json'),
      systems: this.http.get<any[]>('data/systems.json'),
      users: this.http.get<any[]>('data/users.json')
    }).subscribe({
      next: r => {
        const roles = store.get<Record<string, string>>('local', 'fusion.roles', {});
        r.users.forEach(u => { if (roles[u.email]) u.role = roles[u.email]; });
        this.lib.set(r.lib); this.cost.set(r.cost); this.systems.set(r.systems); this.users.set(r.users);
        this.ready.set(true);
      },
      error: e => this.error.set('Nu am putut încărca datele locale (' + (e?.message || e) + '). Rulează aplicația printr-un server (ng serve).')
    });
  }

  libUrl(i: number): string {
    const [n, p] = this.lib()[i];
    return encodeURI(LIB_PRE + (p ? p + '/' : '') + n);
  }
}
