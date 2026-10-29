import { AfterViewChecked, Component, ElementRef, OnInit, ViewChild, effect, inject, untracked } from '@angular/core';
import { AssistantService } from '../../core/assistant.service';
import { StateService, STATUS } from '../../core/state.service';

/** Ecranul Asistent: chat + „Cererile mele”. Interacțiunile din HTML-ul răspunsurilor sunt tratate prin delegare de evenimente. */
@Component({
  selector: 'app-assistant',
  standalone: true,
  template: `
  <div class="layout" style="grid-template-columns:1fr">
    <div class="panel">
      <h3>Întreabă orice: HR, IT și, în curând, celelalte domenii</h3>
      <div class="chat" #chat (click)="bot.onClick($event)" (change)="bot.onChange($event)" (submit)="bot.onSubmit($event)">
        @for (m of bot.messages(); track m.id) {
          <div [class]="'msg ' + m.cls + (m.bare ? ' bare' : '')" [attr.data-mid]="m.id" [innerHTML]="m.safe"></div>
        }
      </div>
      <form class="composer" (submit)="send($event, q)">
        <input #q autocomplete="off" placeholder="Ex.: Îmi trebuie o adeverință pentru bancă / Ce beneficii am prin CCM?">
        <button class="btn" type="submit">Trimite</button>
      </form>
    </div>
  </div>`
})
export class AssistantComponent implements OnInit, AfterViewChecked {
  bot = inject(AssistantService);
  state = inject(StateService);
  @ViewChild('chat') chat!: ElementRef<HTMLElement>;
  private lastCount = 0;

  constructor() {
    // întrebare venită din Dashboardul meu
    effect(() => {
      const q = this.state.pendingQuestion();
      if (!q) return;
      untracked(() => { this.bot.start(); this.state.pendingQuestion.set(''); this.bot.ask(q); });
    });
  }

  ngOnInit(): void { this.bot.start(); }

  ngAfterViewChecked(): void {
    const n = this.bot.messages().length;
    if (n !== this.lastCount && this.chat) { this.lastCount = n; this.chat.nativeElement.scrollTop = this.chat.nativeElement.scrollHeight; }
  }

  send(ev: Event, input: HTMLInputElement): void {
    ev.preventDefault();
    const v = input.value.trim();
    if (v) { this.bot.ask(v); input.value = ''; }
  }

  list(r: any): string[] { return r.statuses || STATUS; }
  time(r: any): string { return new Date(r.created).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' }); }
}
