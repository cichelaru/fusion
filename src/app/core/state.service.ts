import { Injectable, computed, inject, signal } from '@angular/core';
import { AuthService } from './auth.service';
import { historyFor } from './my-history';
import { store } from './util';

export const STATUS = ['Trimisă', 'Preluată', 'Rezolvată'];

/** Starea aplicației (în memorie, cu persistență în localStorage pentru ce adaugă utilizatorii). */
@Injectable({ providedIn: 'root' })
export class StateService {
  questions = signal(128);
  auto = signal(104);
  libHits = signal(0);
  costHits = signal(0);
  reqSeq = 41;

  private auth = inject(AuthService);
  requests = signal<any[]>([]);
  /** Cererile utilizatorului curent (fiecare utilizator le vede doar pe ale lui). */
  myRequests = computed(() => { const e = this.auth.user()?.email; return this.requests().filter(r => r.by === e); });
  /** Progresul cererilor mai vechi (date-exemplu) avansate cu butonul demo: id → index status. */
  histProgress = signal<Record<string, number>>(store.get<Record<string, number>>('local', 'fusion.histProgress', {}));
  histStatus(h: any): number { return this.histProgress()[h.id] ?? h.stIdx ?? 1; }
  advanceHist(id: string, from: number): void {
    const st = Math.min(STATUS.length - 1, from + 1);
    this.histProgress.update(m => ({ ...m, [id]: st }));
    store.set('local', 'fusion.histProgress', this.histProgress());
    this.toast(id + ': ' + STATUS[st]);
  }
  /** Câte cereri sunt încă în lucru (create acum + cele mai vechi, în funcție de rol). */
  openCount = computed(() => {
    const live = this.myRequests().filter(r => r.st < (r.statuses || STATUS).length - 1).length;
    return live + historyFor(this.auth.role()).filter(h => h.st === 'În lucru' && this.histStatus(h) < STATUS.length - 1).length;
  });
  top = signal<Record<string, number>>({
    medical: 16, zileco: 12, banci: 6, bot: 15, biblioteca: 18, ochelari: 10, evaluare: 7, adeverinta: 31, concediu: 24,
    itacces: 19, knox: 14, pontaj: 12, fluturas: 11, permis: 9, travel: 9, date: 8, salarizare: 6
  });
  gaps = signal<any[]>([
    { q: 'Unde parchez mașina la sediul din Constanța?', n: 7, dom: 'Facility' },
    { q: 'Cine aprobă o comandă de materiale?', n: 4, dom: 'Achiziții' },
    { q: 'Unde găsesc procedura pentru lucrul la înălțime?', n: 3, dom: 'Compliance' }
  ]);
  seedReq: any[] = [
    { id: 'REQ-2026-0039', title: 'Adeverință de salariat', team: 'Echipa HR – Administrare Personal', st: 2, sla: '2 zile lucrătoare', mine: false },
    { id: 'REQ-2026-0040', title: 'Tichet IT: cont blocat', team: 'IT – Service Desk', st: 1, sla: '4 ore lucrătoare', mine: false }
  ];
  /** Intrări adăugate de owner (se păstrează în localStorage). */
  kbExtra = signal<any[]>(store.get<any[]>('local', 'fusion.kbExtra', []));

  company = signal('RER');
  /** Fereastra „Adaugă răspuns”: null = închisă. */
  modal = signal<{ gap: any | null; idx: number | null } | null>(null);
  toastMsg = signal('');
  /** O întrebare trimisă din alt ecran (ex. dashboardul personal) către asistent. */
  pendingQuestion = signal('');
  private toastTimer: any;

  constructor() {
    const saved = store.get<any[]>('local', 'fusion.requests', []);
    if (saved.length) {
      this.requests.set(saved.map(r => ({ ...r, created: new Date(r.created) })));
      this.reqSeq = Math.max(this.reqSeq, ...saved.map(r => parseInt(String(r.id).slice(-4), 10) || 0));
    }
  }

  toast(msg: string): void {
    this.toastMsg.set(msg);
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toastMsg.set(''), 3200);
  }

  addRequest(e: any): any {
    this.reqSeq++;
    const id = 'REQ-2026-' + String(this.reqSeq).padStart(4, '0');
    const r = { id, title: e.title, team: e.team, sla: e.sla, st: e.startSt ?? (e.statuses ? 1 : 0), mine: true, by: this.auth.user()?.email, created: new Date(), statuses: e.statuses, done: e.done };
    this.requests.update(a => [r, ...a]);
    this.persistRequests();
    return r;
  }

  advance(id: string): void {
    this.requests.update(a => a.map(r => {
      if (r.id !== id) return r;
      const L = r.statuses || STATUS;
      return { ...r, st: Math.min(L.length - 1, r.st + 1) };
    }));
    this.persistRequests();
    const r = this.requests().find(x => x.id === id);
    if (r) this.toast(r.id + ': ' + (r.statuses || STATUS)[r.st]);
  }

  addKb(entry: any): void {
    this.kbExtra.update(a => [...a, entry]);
    store.set('local', 'fusion.kbExtra', this.kbExtra());
  }

  removeGap(i: number): void { this.gaps.update(a => a.filter((_, k) => k !== i)); }

  private persistRequests(): void { store.set('local', 'fusion.requests', this.requests()); }

  /** Resetează datele salvate local (pentru demo curat). */
  resetLocal(): void {
    ['fusion.requests', 'fusion.kbExtra', 'fusion.roles', 'fusion.histProgress'].forEach(k => store.remove('local', k));
    location.reload();
  }
}
