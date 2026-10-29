import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { addDays, store, today } from './util';

export type Role = 'angajat' | 'owner' | 'admin';
export const RLAB: Record<Role, string> = { angajat: 'angajat', owner: 'owner domeniu', admin: 'administrator' };

/** Autentificare simulată (fără backend). În varianta reală se înlocuiește cu MSAL / Microsoft Entra ID. */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private router = inject(Router);

  /** Profilul curent: obiectul este mutat pe loc, ca să îl poată citi intrările din baza de cunoștințe. */
  readonly profile: any = {
    nume: '', marca: '', functie: '', departament: '', zona: '', email: '', telefon: '',
    permis: 'CT 0123456', categorii: 'B', permisExp: addDays(today, 25), zileCO: 14, sef: 'Maria Ionescu (șef serviciu)'
  };

  user = signal<any | null>(store.get<any | null>('session', 'fusion.user', null));
  role = computed<Role>(() => (this.user()?.role as Role) || 'angajat');
  isLoggedIn = computed(() => !!this.user());

  constructor() {
    const u = this.user();
    if (u) Object.assign(this.profile, u);
  }

  login(u: any): void {
    Object.assign(this.profile, u);
    store.set('session', 'fusion.user', u);
    this.user.set({ ...u });
    this.router.navigate(['/asistent']);
  }

  logout(): void {
    store.remove('session', 'fusion.user');
    this.user.set(null);
    this.router.navigate(['/login']);
  }

  rank(): number { return { angajat: 0, owner: 1, admin: 2 }[this.role()]; }
}
