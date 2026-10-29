import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MY_HISTORY } from '../../core/my-history';
import { StateService, STATUS } from '../../core/state.service';

/** Pagina „Cererile mele”: cererile trimise din asistent (cu status) și istoricul. */
@Component({
  selector: 'app-requests',
  standalone: true,
  templateUrl: './requests.component.html'
})
export class RequestsComponent {
  state = inject(StateService);
  private router = inject(Router);
  private day = 86400000;

  /** Toate cererile, într-o formă comună. */
  private all(): any[] {
    const now = Date.now();
    const live = this.state.requests().map((r: any) => {
      const L = this.list(r);
      return { id: r.id, title: r.title, team: r.team, live: r, rank: r.st, closed: r.st >= L.length - 1,
        ts: new Date(r.created).getTime(), when: 'azi, ' + this.time(r), status: L[r.st], old: false };
    });
    const old = MY_HISTORY.map((h: any) => {
      const open = h.st === 'În lucru';
      const st = h.stIdx ?? 1;
      return { id: h.id, title: h.title, team: h.team, old: true,
        live: open ? { st, sla: h.sla || '-', statuses: undefined } : null,
        rank: open ? st : 99, closed: !open, ts: now - h.days * this.day, when: h.when, status: open ? STATUS[st] : h.st };
    });
    return [...live, ...old];
  }
  /** În lucru: cele mai avansate primele (se reordonează la schimbarea statusului). */
  open(): any[] { return this.all().filter(r => !r.closed).sort((a, b) => b.rank - a.rank || b.ts - a.ts); }
  /** Istoric: doar cele închise, de la cea mai nouă la cea mai veche. */
  closed(): any[] { return this.all().filter(r => r.closed).sort((a, b) => b.ts - a.ts); }
  newRequest(): void { this.router.navigate(['/asistent']); }
  list(r: any): string[] { return r.statuses || STATUS; }
  time(r: any): string { return new Date(r.created).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' }); }
}
