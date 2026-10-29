import { Injectable, inject, signal } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { CostService, COST_MIN_RANK } from './cost.service';
import { DataService } from './data.service';
import { KbService } from './kb.service';
import { SearchService } from './search.service';
import { StateService } from './state.service';
import { esc, fmt, norm, today, workDays } from './util';

export interface Msg {
  id: number;
  cls: 'bot' | 'user';
  html: string;
  safe: SafeHtml;
  /** Fără fundal (bannerul proactiv). */
  bare?: boolean;
  /** Intrarea din baza de cunoștințe care a generat mesajul (pentru butoane / formulare). */
  entry?: any;
  /** Textul întrebării originale. */
  text?: string;
}

const PRO_BTN = '<button class="btn sm" data-act="pro">Da, pregătește cererea</button>';

/** Logica asistentului: potrivește întrebarea, construiește răspunsul (HTML) și tratează interacțiunile din chat. */
@Injectable({ providedIn: 'root' })
export class AssistantService {
  private san = inject(DomSanitizer);
  private router = inject(Router);
  private auth = inject(AuthService);
  private data = inject(DataService);
  private kb = inject(KbService);
  private state = inject(StateService);
  private search = inject(SearchService);
  private cost = inject(CostService);

  messages = signal<Msg[]>([]);
  private seq = 0;
  private started = false;

  // ---------- mesaje ----------
  private mk(cls: 'bot' | 'user', html: string, extra: Partial<Msg> = {}): Msg {
    return { id: ++this.seq, cls, html, safe: this.san.bypassSecurityTrustHtml(html), ...extra };
  }
  add(cls: 'bot' | 'user', html: string, extra: Partial<Msg> = {}): Msg {
    const m = this.mk(cls, html, extra);
    this.messages.update(a => [...a, m]);
    return m;
  }
  remove(id: number): void { this.messages.update(a => a.filter(m => m.id !== id)); }
  replace(id: number, html: string): void {
    this.messages.update(a => a.map(m => m.id === id ? { ...m, html, safe: this.san.bypassSecurityTrustHtml(html) } : m));
  }
  /** Pornește conversația o singură dată (și din nou după deconectare). */
  start(): void {
    if (this.started) return;
    this.started = true;
    this.welcome();
  }
  reset(): void { this.messages.set([]); this.started = false; }

  private tagHtml(e: any): string { return `<span class="tag ${esc(e.domain)}">${esc(e.domain)}</span>`; }

  // ---------- potrivire intenție ----------
  match(text: string): any {
    const q = ' ' + norm(text) + ' ';
    let best: any = null, score = 0;
    for (const e of this.kb.all()) {
      let s = 0;
      for (const [k, w] of e.kw) {
        const nk = norm(k);
        if (k.endsWith(' ') || nk.length <= 4 ? q.includes(' ' + nk + ' ') : q.includes(' ' + nk)) s += w;
      }
      if (s > score) { score = s; best = e; }
    }
    return score >= 3 ? best : null;
  }

  // ---------- mesaj de întâmpinare ----------
  welcome(): void {
    const P = this.auth.profile;
    const groups = [
      { dep: 'HR', chips: ['Îmi trebuie o adeverință de salariat pentru bancă', 'Ce acoperă asigurarea medicală?', 'Cât primesc rambursare pentru ochelari?', 'Unde îmi fac evaluarea internă?', 'Vreau decontul pentru biletul de odihnă', 'Cum scot raportul lunar de pontaj?'] },
      { dep: 'IT', chips: ['Mi s-a blocat contul de Windows', 'Cine se ocupă de Knox?'] },
      { dep: 'Financiar și Travel', chips: ['Plec în delegație la București săptămâna viitoare cu trenul', 'Cum decontez o deplasare?'] },
      { dep: 'Facility', chips: ['Ce facilități sportive am la Day Tower?', 'Rezervă-mi un birou mâine la etajul 7 în Day Tower', 'Vreau un loc la sală mâine la 18', 'Vreau să mă programez la masaj', 'Unde parchez mașina la sediul din Constanța?'] },
      { dep: 'SSM și Operațional', chips: ['Vreau să fac un control SSM la PTA 6063, săpătură, contractor ANDREM', 'Cine se ocupă de avizele de amplasament în Zona Constanța?'] },
      { dep: 'Compliance', chips: ['Cum raportez o neregulă?'] },
    ];
    const chipsHtml = '<div class="fcards">' + groups.map(g => `<div class="fcard" tabindex="0"><div class="fcard-in"><div class="fcard-front"><b>${esc(g.dep)}</b><small>${g.chips.length} ${g.chips.length === 1 ? 'sugestie' : 'sugestii'}</small></div><div class="fcard-back"><div class="chips">${g.chips.map(c => `<span class="chip">${esc(c)}</span>`).join('')}</div></div></div></div>`).join('') + '</div>';
    this.add('bot', `<p class="lead">Bună, ${esc(P.nume.split(' ').slice(-1)[0])}! Scrie-mi ce ai nevoie, în cuvintele tale. Îți spun cine se ocupă, îți dau pașii sau îți pregătesc cererea deja completată.</p>${chipsHtml}`, { bare: true });
  }

  // ---------- întrebare ----------
  ask(text: string): void {
    this.add('user', esc(text));
    const costQ = this.cost.isCostQuestion(text);
    const t = this.add('bot', `<span class="typing">${costQ ? 'Caut în datele de cost…' : 'Caut în baza de cunoștințe…'}</span>`);
    if (costQ) {
      setTimeout(() => {
        this.remove(t.id);
        if (this.auth.rank() < COST_MIN_RANK) { this.add('bot', this.cost.denied()); return; }
        this.state.questions.update(n => n + 1);
        this.state.auto.update(n => n + 1);
        this.state.costHits.update(n => n + 1);
        this.add('bot', this.cost.answer(text));
      }, 500);
      return;
    }
    this.state.questions.update(n => n + 1);
    setTimeout(() => {
      this.remove(t.id);
      const e = this.match(text);
      if (e) {
        if (e.private) this.state.questions.update(n => n - 1);
        else {
          this.state.auto.update(n => n + 1);
          this.state.top.update(m => ({ ...m, [e.id]: (m[e.id] || 0) + 1 }));
        }
        this.respond(e, text);
      } else {
        const r = this.search.search(text);
        if (r.ids.length) { this.state.libHits.update(n => n + 1); this.libAnswer(text, r.ids); }
        else this.unknown(text);
      }
    }, 550);
  }

  // ---------- răspuns din baza de cunoștințe ----------
  respond(e: any, text: string, preset?: any): void {
    const q = norm(text);
    let h = this.tagHtml(e);
    const extra: Partial<Msg> = { entry: e, text };

    if (e.type === 'contact') {
      const c = e.contact;
      h += `<p class="lead"><b>${esc(e.title)}</b> – persoana de contact:</p>
<div class="card contact"><div class="ic">${esc(c.who.split(' ').filter((w: string) => w.length > 2).slice(0, 2).map((w: string) => w[0]).join('').toUpperCase())}</div>
<div><b>${esc(c.who)}</b><br><span class="small">${esc(c.role)}</span><br>✉ ${c.mail.split(' · ').map((m: string) => `<a href="mailto:${esc(m)}">${esc(m)}</a>`).join(', ')}${c.tel ? ' · ☎ ' + esc(c.tel) : ''}${c.prog ? ' · ' + esc(c.prog) : ''}${c.people ? `<br><span class="small">${esc(c.people)}</span>` : ''}</div></div>${c.src ? `<div class="small" style="margin-top:4px">Sursa: ${esc(c.src)}</div>` : ''}`;
      if (e.steps) h += `<div class="card"><b>Înainte să scrii, încearcă:</b><ol class="steps">${e.steps.map((s: string) => `<li>${esc(s)}</li>`).join('')}</ol></div>`;
    } else if (e.type === 'steps') {
      h += `<p class="lead"><b>${esc(e.title)}</b></p><div class="card"><ol class="steps">${e.steps.map((s: string) => `<li>${esc(s)}</li>`).join('')}</ol>${e.note ? `<div class="small" style="margin-top:6px">${esc(e.note)}</div>` : ''}</div>
<div class="route">Responsabil proces: <b>${esc(e.team)}</b></div>`;
    } else if (e.type === 'choice') {
      h += `<p class="lead">${esc(e.lead)}</p><div class="chips">${e.choices.map((c: any, i: number) => `<button class="btn sm blue ch" data-act="choice" data-i="${i}" style="margin:2px 6px 2px 0">${esc(c.label)}</button>`).join('')}</div>`;
      this.add('bot', h, extra);
      return;
    } else if (e.type === 'link') {
      h += `<p class="lead"><b>${esc(e.title)}</b></p>${e.highlight ? `<div class="card" style="border-left:5px solid var(--orange);font-size:16.5px"><b>${esc(e.highlight)}</b></div>` : ''}<div class="card">${esc(e.answer)}${e.steps ? `<ol class="steps">${e.steps.map((x: string) => `<li>${esc(x)}</li>`).join('')}</ol>` : ''}</div>
<div style="margin-top:10px"><a class="btn sm blue" href="${esc(encodeURI(e.ext.url).replace(/%25/g, '%'))}" target="_blank" rel="noopener">Deschide ${esc(e.ext.sys)} ↗</a></div>
<div class="route">Responsabil: <b>${esc(e.team)}</b></div>${e.sources ? `<div class="small" style="margin-top:6px">📄 Sursa (Biblioteca ta de informații utile): ${e.sources.map((x: any) => `<a href="${esc(encodeURI(x.u))}" target="_blank" rel="noopener">${esc(x.n)}</a>`).join(' · ')}</div>` : ''}`;
    } else if (e.type === 'info') {
      h += `<p class="lead"><b>${esc(e.title)}</b></p><div class="card">${esc(e.answer).replace(/\n/g, '<br>')}</div>
<div class="route">Responsabil: <b>${esc(e.team || '-')}</b>${e.link ? ` · Canal: <b>${esc(e.link)}</b>` : ''}</div>
<div class="small" style="margin-top:4px">Răspuns adăugat de owner-ul domeniului din dashboard.</div>`;
    } else if (e.type === 'form') {
      const svcF = e.fields.find((f: any) => f.t === 'services');
      const on: Set<string> | null = svcF ? new Set<string>(svcF.v(q)) : null;
      h += `<p class="lead">Am pregătit cererea <b>${esc(e.title)}</b>. Câmpurile marcate cu portocaliu sunt deja completate din profilul tău. Verifică și trimite.</p>
<form class="card" data-form="1"><div class="form-grid">${e.fields.map((f: any) => this.fieldHtml(f, q, preset, on)).join('')}</div>
<div class="legend">Precompletat automat din profil sau din ce ai scris.</div>
<div class="route">Se trimite la: <b>${esc(e.team)}</b> · Termen estimat: <b>${esc(e.sla)}</b></div>
<div class="compare"><div class="before"><b>Azi:</b> ${esc(e.today)}. ${esc(e.before || '')}</div><div class="after"><b>Cu Fusion:</b> ${esc(e.after || '')}</div></div>
${e.ext ? `<div class="ext"><div><b>Sistemul real:</b> ${esc(e.ext.sys)} · <span class="small">${esc(e.ext.hint)}</span></div>${e.docs ? `<div class="small" style="margin-top:4px">📄 ${e.docs.map((d: any) => `<a href="${esc(encodeURI(d.u))}" target="_blank" rel="noopener">${esc(d.n)}</a>`).join(' · ')}</div>` : ''}<div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap"><button type="button" class="btn sm ghost copy" data-act="copy">Copiază instrucțiunea pentru Claude în Chrome</button>${e.ext.url ? `<a class="btn sm blue" href="${esc(e.ext.url)}" target="_blank" rel="noopener">Deschide în ${esc(e.ext.sys)} ↗</a>` : '<span class="small">(link-ul aplicației se adaugă)</span>'}</div></div>` : ''}
<div style="margin-top:12px;display:flex;justify-content:flex-end"><button class="btn" type="submit">${esc(e.submitLabel || 'Trimite cererea (simulat)')}</button></div></form>`;
      this.add('bot', h, extra);
      return;
    }
    if (e.type !== 'form' && e.today) h += `<div class="small" style="margin-top:6px">Azi: ${esc(e.today)}.</div>`;
    if (e.action) h += `<div style="margin-top:10px"><button class="btn sm blue act" data-act="action">${esc(e.action.label)}</button></div>`;
    this.add('bot', h, extra);
  }

  private fieldHtml(f: any, q: string, preset: any, on: Set<string> | null): string {
    const hid = !!(f.svc && on && !on.has(f.svc));
    const sv = f.svc ? ` data-svc="${f.svc}"${hid ? ' style="display:none" data-hidden="1"' : ''}` : '';
    const dis = hid ? ' disabled' : '';
    if (f.t === 'section') return `<div class="full sec"${sv}><div class="sec-h">${esc(f.l)}</div>${f.note ? `<div class="small" style="font-style:italic">${esc(f.note)}</div>` : ''}</div>`;
    if (f.t === 'services') {
      const sel: string[] = f.v(q);
      return `<div class="full sec"><div class="sec-h">${esc(f.l)}</div><div class="svcs">${f.o.map(([k, l]: string[]) => `<label class="svc"><input type="checkbox" data-service="${k}"${sel.includes(k) ? ' checked' : ''}> ${esc(l)}</label>`).join('')}</div><div class="small">Preselectate din ce ai scris. Bifează sau debifează după nevoie.</div></div>`;
    }
    if (f.t === 'check') {
      const c = typeof f.v === 'function' ? f.v(q) : f.v;
      return `<div class="field"${sv}><label>&nbsp;</label><label class="svc" style="display:inline-flex"><input type="checkbox" name="${f.k}" data-lbl="${esc(f.l)}"${c ? ' checked' : ''}${dis}> ${esc(f.l)}</label></div>`;
    }
    if (f.t === 'q') {
      return `<div class="full qrow"${sv}><div class="qtxt"><b>${esc(f.k.split('_')[1])}.</b> ${esc(f.l)}</div><select name="${f.k}" data-lbl="${esc(f.k.split('_')[1] + '. ' + f.l)}" required${dis}><option value="">—</option><option>DA</option><option>NU</option><option>N/A</option></select><input name="${f.k}_obs" placeholder="Observații"${dis}></div>`;
    }
    if (f.t === 'fillbtn') return `<div class="full"><button type="button" class="btn sm ghost" data-act="fill">${esc(f.l)}</button> <span class="small nccount"></span></div>`;
    const v = preset && preset[f.k] !== undefined ? preset[f.k] : (typeof f.v === 'function' ? f.v(q) : (f.v ?? ''));
    const pre = (f.pre || (preset && preset[f.k] !== undefined) || (v !== '' && f.v && !['number', 'date'].includes(f.t) && f.k !== 'livr')) ? ' prefilled' : '';
    const cls = 'field' + (f.full ? ' full' : '');
    const req = f.req ? ' required' : '';
    const ro = f.ro ? ' readonly' : '';
    let inp: string;
    if (f.t === 'select') inp = `<select name="${f.k}" class="${pre}"${dis}>${f.o.map((o: string) => `<option${o === v ? ' selected' : ''}>${esc(o)}</option>`).join('')}</select>`;
    else if (f.t === 'textarea') inp = `<textarea name="${f.k}"${req}${dis} placeholder="${esc(f.ph || '')}">${esc(v)}</textarea>`;
    else if (f.t === 'file') inp = `<div style="display:flex;gap:8px;align-items:center"><button type="button" class="btn sm ghost attach" data-act="attach">Atașează fișier</button><span class="small fname">niciun fișier (simulat)</span></div>`;
    else inp = `<input name="${f.k}" type="${f.t || 'text'}" value="${esc(v)}" class="${pre}"${req}${ro}${dis} placeholder="${esc(f.ph || '')}">`;
    return `<div class="${cls}"${sv}><label>${esc(f.l)}${f.req ? ' ' : ''}</label>${inp}</div>`;
  }

  // ---------- Biblioteca de documente ----------
  libAnswer(text: string, ids: number[]): void {
    const LIB = this.data.lib();
    const items = ids.map(i => {
      const [n, p, sn, d] = LIB[i];
      return `<div class="libitem"><a href="${esc(this.data.libUrl(i))}" target="_blank" rel="noopener"><b>${esc(n)}</b></a>
<div class="small">📁 ${esc(p ? p.split('/').join(' › ') : 'Biblioteca')}${d ? ' · actualizat ' + esc(d.split('-').reverse().join('.')) : ''}</div>
${sn ? `<div class="small" style="color:#445">${esc(sn)}…</div>` : ''}
${this.auth.rank() >= 1 ? `<button class="btn sm ghost linkq" data-act="linkq" data-i="${i}" title="Pentru owner: răspunsul la această întrebare va duce direct aici">Leagă întrebarea de acest document</button>` : ''}</div>`;
    }).join('');
    this.add('bot', `<span class="tag Altele">Bibliotecă</span><p class="lead">Am găsit în <b>Biblioteca ta de informații utile</b> documentele care răspund la întrebarea ta (din ${LIB.length.toLocaleString('ro-RO')} documente):</p>
<div class="card">${items}</div>
<div class="small" style="margin-top:6px">Căutare după numele, folderul și primele rânduri ale documentelor (instantaneu din 28.10.2026). Documentele scanate se găsesc doar după nume.</div>`, { text });
  }

  unknown(text: string): void {
    const n = norm(text);
    this.state.gaps.update(a => {
      const g = a.find(x => norm(x.q) === n);
      if (g) return a.map(x => x === g ? { ...x, n: x.n + 1 } : x);
      return [{ q: text, n: 1, dom: 'Neclasificat' }, ...a];
    });
    this.add('bot', `<p class="lead">Nu am încă un răspuns sigur pentru „${esc(text)}”.</p>
<div class="card">Am trimis întrebarea către owner-ii bazei de cunoștințe. Când adaugă răspunsul, îl primești aici. Între timp, poți încerca altă formulare sau poți alege una de mai jos.</div>
<div class="small" style="margin-top:6px">Întrebarea apare în <b>Dashboard owner → Întrebări fără răspuns</b>.</div>
<div class="chips">${['Îmi trebuie o adeverință', 'Ce beneficii am prin CCM?', 'Mi s-a blocat contul'].map(c => `<span class="chip">${c}</span>`).join('')}</div>`);
  }

  // ---------- interacțiuni (delegate din chat) ----------
  private msgOf(el: Element): Msg | undefined {
    const id = Number((el.closest('.msg') as HTMLElement | null)?.dataset['mid']);
    return this.messages().find(m => m.id === id);
  }

  onClick(ev: Event): void {
    const t = ev.target as HTMLElement;
    const chip = t.closest('.chip') as HTMLElement | null;
    if (chip) { this.ask(chip.textContent || ''); return; }
    const b = t.closest('[data-act]') as HTMLElement | null;
    if (!b) return;
    const act = b.dataset['act'];
    const m = this.msgOf(b);
    if (act === 'pro') { this.add('user', 'Da, pregătește cererea de actualizare a permisului'); this.respond(this.kb.find('permis'), 'permis'); return; }
    if (!m) return;
    if (act === 'choice') {
      const c = m.entry.choices[+(b.dataset['i'] || 0)];
      this.add('user', esc(c.label));
      this.respond(this.kb.find(c.id), m.text || '');
    } else if (act === 'action') {
      this.add('user', esc(m.entry.action.label));
      this.respond(this.kb.find(m.entry.action.id), m.text || '', m.entry.action.preset);
    } else if (act === 'linkq') {
      const i = +(b.dataset['i'] || 0), L = this.data.lib()[i];
      this.state.modal.set({ gap: { q: m.text, dom: 'HR', f: (L[1] ? L[1] + '/' : '') + L[0] }, idx: null });
    } else if (act === 'attach') {
      (b.nextElementSibling as HTMLElement).textContent = 'copie_document.pdf (simulat)';
      b.textContent = 'Schimbă';
    } else if (act === 'fill') {
      const form = b.closest('form') as HTMLFormElement;
      form.querySelectorAll<HTMLSelectElement>('.qrow select').forEach(x => { if (!x.disabled && !x.value) x.value = 'DA'; });
      this.updateNc(form);
    } else if (act === 'copy') {
      const form = b.closest('form') as HTMLFormElement;
      this.copyInstruction(form, m.entry);
    }
  }

  onChange(ev: Event): void {
    const t = ev.target as HTMLInputElement;
    const form = t.closest('form') as HTMLFormElement | null;
    if (!form) return;
    if (t.dataset['service'] !== undefined) {
      const on = new Set([...form.querySelectorAll<HTMLInputElement>('[data-service]')].filter(b => b.checked).map(b => b.dataset['service']!));
      form.querySelectorAll<HTMLElement>('[data-svc]').forEach(el => {
        const vis = on.has(el.dataset['svc']!);
        el.style.display = vis ? '' : 'none';
        el.dataset['hidden'] = vis ? '' : '1';
        el.querySelectorAll<HTMLInputElement>('input,select,textarea').forEach(i => i.disabled = !vis);
      });
    }
    if ((t as any).closest('.qrow') && t.tagName === 'SELECT') this.updateNc(form);
    if (t.name === 'start' || t.name === 'end') {
      const s = form.querySelector<HTMLInputElement>('[name=start]'), en = form.querySelector<HTMLInputElement>('[name=end]'), z = form.querySelector<HTMLInputElement>('[name=zile]');
      if (s && en && z && s.value && en.value) { const n = workDays(new Date(s.value), new Date(en.value)); z.value = n > 0 ? String(n) : '-'; }
    }
  }

  private updateNc(form: HTMLFormElement): void {
    const sels = [...form.querySelectorAll<HTMLSelectElement>('.qrow select')];
    const n = sels.filter(x => !x.disabled && x.value === 'NU').length;
    form.querySelectorAll('.nccount').forEach(c => c.textContent = n ? n + ' neconformități marcate' : '');
    sels.forEach(x => x.classList.toggle('nu', x.value === 'NU'));
  }

  onSubmit(ev: Event): void {
    const form = ev.target as HTMLFormElement;
    if (!form.dataset['form']) return;
    ev.preventDefault();
    if (!form.reportValidity()) return;
    const m = this.msgOf(form);
    if (!m) return;
    const e = m.entry;
    if (e.validate) { const err = e.validate(form); if (err) { this.state.toast(err); return; } }
    const r = this.state.addRequest(e);
    // formularul din mesaj este înlocuit cu confirmarea (mesajul își schimbă HTML-ul)
    const ok = `<div class="ok-box">✔ Cererea <b>${r.id}</b> (${esc(e.title)}) a fost trimisă către <b>${esc(e.team)}</b>. Termen estimat: ${esc(e.sla)}. O urmărești în „Cererile mele”.${e.ext && e.ext.url ? ` <br><a href="${esc(e.ext.url)}" target="_blank" rel="noopener">Varianta reală: deschide în ${esc(e.ext.sys)} ↗</a>` : ''}</div>`;
    this.replace(m.id, this.tagHtml(e) + ok);
    this.state.toast('Cerere trimisă: ' + r.id);
    this.router.navigate(['/cereri']);
  }

  private copyInstruction(form: HTMLFormElement, e: any): void {
    const lines: string[] = [];
    form.querySelectorAll<HTMLElement>('.form-grid > div').forEach(d => {
      if (d.dataset['hidden'] === '1') return;
      if (d.classList.contains('sec')) {
        const h = d.querySelector('.sec-h')!.textContent || '';
        const sb = [...d.querySelectorAll<HTMLInputElement>('[data-service]')];
        if (sb.length) lines.push('\n' + h.toUpperCase() + ': ' + sb.filter(b => b.checked).map(b => (b.parentElement!.textContent || '').trim()).join(', '));
        else lines.push('\n' + h.toUpperCase());
        return;
      }
      if (d.classList.contains('qrow')) {
        const sl = d.querySelector('select')!, ob = d.querySelector('input')!;
        lines.push(sl.dataset['lbl'] + ': ' + (sl.value || '—') + (ob.value ? ' (obs: ' + ob.value + ')' : ''));
        return;
      }
      if (!d.querySelector('label')) return;
      const cb = d.querySelector<HTMLInputElement>('input[type=checkbox]');
      if (cb) { lines.push(cb.dataset['lbl'] + ': ' + (cb.checked ? 'Da' : 'Nu')); return; }
      const l = (d.querySelector('label')!.textContent || '').replace(' ', '');
      const i = d.querySelector<HTMLInputElement>('input,select,textarea');
      if (i && i.value !== '') lines.push(l + ': ' + (i.type === 'date' ? i.value.split('-').reverse().join('.') : i.value));
    });
    const t = 'Completează formularul deschis în această pagină (' + (e.ext ? e.ext.sys : '') + ' – ' + e.title + ') cu datele de mai jos. Potrivește fiecare valoare cu câmpul cel mai apropiat ca sens.' + (e.ext && e.ext.flow ? '\n' + e.ext.flow : ' Nu apăsa butonul de trimitere; mă opresc eu să verific.') + '\n' + lines.join('\n');
    const ok = () => this.state.toast('Copiat. Deschide formularul real și lipește textul în Claude în Chrome.');
    const fb = () => {
      const a = document.createElement('textarea');
      a.value = t; document.body.appendChild(a); a.select();
      try { document.execCommand('copy'); ok(); } catch { this.state.toast('Copierea nu a mers.'); }
      a.remove();
    };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(ok, fb); else fb();
  }
}
