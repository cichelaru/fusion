import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MY_HISTORY } from '../../core/my-history';
import { StateService, STATUS } from '../../core/state.service';

/** Pagina „Cererile mele”: cererile trimise din asistent (cu status) și istoricul. */
@Component({
  selector: 'app-requests',
  standalone: true,
  template: `
  <div class="sec-title"><h2>Cererile mele</h2><span class="small">{{ state.requests().length }} din această sesiune · {{ hist.length }} mai vechi</span><button class="btn" type="button" (click)="newRequest()">+ Cerere nouă</button></div>
  <div class="grid2">
    <div class="box"><h4>Trimise din asistent</h4>
      <div class="reqs">
        @for (r of state.requests(); track r.id) {
          <div class="req">
            <div class="top"><div><b>{{ r.title }}</b><div class="id">{{ r.id }} · {{ time(r) }}</div></div></div>
            <div class="timeline">@for (s of list(r); track $index) { <div [class]="'st' + ($index <= r.st ? ' done' : '')">{{ s }}</div> }</div>
            <div class="small">Status: <b>{{ list(r)[r.st] }}</b> · {{ r.team }} · termen {{ r.sla }}</div>
            @if (r.st < list(r).length - 1) {
              <div style="margin-top:8px;text-align:right"><button class="btn sm ghost" type="button" title="Doar pentru demonstrație" (click)="state.advance(r.id)">Avansează status (demo)</button></div>
            } @else {
              <div class="ok-box" style="padding:6px 10px;font-size:12px">✔ {{ r.done || 'Rezolvată. Ai primit documentul pe e-mail.' }}</div>
            }
          </div>
        } @empty {
          <div class="empty">Nicio cerere încă.<br>Cererile trimise din asistent apar aici, cu statusul lor.</div>
        }
      </div>
    </div>
    <div class="box"><h4>Istoric</h4>
      <div class="mylist">
        @for (r of hist; track r.id) {
          <div class="req"><div class="top"><div><b>{{ r.title }}</b><div class="id">{{ r.id }} · {{ r.when }}</div></div><span [class]="'pill ' + (r.st === 'În lucru' ? 'sys-demo' : 'sys-ok')">{{ r.st }}</span></div><div class="small">{{ r.team }}</div></div>
        }
      </div>
    </div>
  </div>`
})
export class RequestsComponent {
  state = inject(StateService);
  private router = inject(Router);
  hist = MY_HISTORY;
  newRequest(): void { this.router.navigate(['/asistent']); }
  list(r: any): string[] { return r.statuses || STATUS; }
  time(r: any): string { return new Date(r.created).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' }); }
}
