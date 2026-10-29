// Funcții utilitare comune (fără dependențe Angular).

export const norm = (s: string): string =>
  (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();

export const esc = (s: any): string =>
  String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' } as any)[c]);

export const today = (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; })();

export const addDays = (d: Date, n: number): Date => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
export const fmt = (d: Date): string => d.toLocaleDateString('ro-RO', { day: '2-digit', month: '2-digit', year: 'numeric' });
export const iso = (d: Date): string => { const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000); return z.toISOString().slice(0, 10); };

export function nextMonday(): Date {
  const d = new Date(today);
  d.setDate(d.getDate() + ((8 - d.getDay()) % 7 || 7));
  return d;
}

export function workDays(a: Date, b: Date): number {
  let n = 0;
  const d = new Date(a);
  while (d <= b) { const w = d.getDay(); if (w && w < 6) n++; d.setDate(d.getDate() + 1); }
  return n;
}

const CITIES: Record<string, string> = {
  bucuresti: 'București', cluj: 'Cluj-Napoca', iasi: 'Iași', timisoara: 'Timișoara', brasov: 'Brașov', craiova: 'Craiova',
  galati: 'Galați', constanta: 'Constanța', sibiu: 'Sibiu', oradea: 'Oradea', ploiesti: 'Ploiești', pitesti: 'Pitești',
  tulcea: 'Tulcea', braila: 'Brăila'
};
export function destOf(q: string): string {
  const m = (q || '').match(/(?:la|spre|in|catre) (bucuresti|cluj|iasi|timisoara|brasov|craiova|galati|constanta|sibiu|oradea|ploiesti|pitesti|tulcea|braila)/);
  return m ? CITIES[m[1]] : '';
}

export const initials = (n: string): string => n.split(' ').map(x => x[0]).slice(0, 2).join('').toUpperCase();

export const nf0 = new Intl.NumberFormat('ro-RO', { maximumFractionDigits: 0 });
export const nf2 = new Intl.NumberFormat('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const fRON = (v: number): string => Math.abs(v) >= 1e6 ? nf2.format(v / 1e6) + ' mil. RON' : nf0.format(v) + ' RON';

/** Citire/scriere sigure în localStorage / sessionStorage (pot lipsi sau arunca erori). */
export const store = {
  get<T>(kind: 'local' | 'session', key: string, fallback: T): T {
    try { const s = kind === 'local' ? localStorage : sessionStorage; const v = s.getItem(key); return v ? JSON.parse(v) as T : fallback; } catch { return fallback; }
  },
  set(kind: 'local' | 'session', key: string, value: any): void {
    try { (kind === 'local' ? localStorage : sessionStorage).setItem(key, JSON.stringify(value)); } catch { /* ignorat */ }
  },
  remove(kind: 'local' | 'session', key: string): void {
    try { (kind === 'local' ? localStorage : sessionStorage).removeItem(key); } catch { /* ignorat */ }
  }
};
