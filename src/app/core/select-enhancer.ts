/**
 * Înlocuiește lista nativă a <select>-urilor cu una desenată în tema aplicației.
 * <select>-ul rămâne în DOM (ascuns), deci valoarea și evenimentele (input/change) merg ca înainte,
 * inclusiv pentru select-urile din răspunsurile asistentului (HTML injectat).
 */
const map = new Map<HTMLSelectElement, HTMLButtonElement>();
let panel: HTMLDivElement | null = null;
let openFor: HTMLSelectElement | null = null;
let active = -1;
let scheduled = false;

const label = (s: HTMLSelectElement) => (s.selectedOptions[0]?.textContent || '').trim();

function build(sel: HTMLSelectElement): HTMLButtonElement {
  const b = document.createElement('button');
  b.type = 'button';
  b.setAttribute('aria-haspopup', 'listbox');
  b.addEventListener('click', () => (openFor === sel ? close() : open(sel)));
  b.addEventListener('keydown', e => {
    if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) { e.preventDefault(); open(sel); }
  });
  sel.setAttribute('data-fx', '');
  sel.tabIndex = -1;
  sel.insertAdjacentElement('afterend', b);
  map.set(sel, b);
  return b;
}

function sync(sel: HTMLSelectElement): void {
  const b = map.get(sel) || build(sel);
  const cls = 'fx-btn ' + sel.className;
  if (b.className !== cls) b.className = cls;
  const t = label(sel) || ' ';
  if (b.textContent !== t) b.textContent = t;
  b.disabled = sel.disabled;
  const w = sel.getAttribute('style'); if (b.getAttribute('style') !== w) { w ? b.setAttribute('style', w) : b.removeAttribute('style'); }
  const aria = sel.getAttribute('aria-label'); if (aria) b.setAttribute('aria-label', aria);
}

function syncAll(): void {
  scheduled = false;
  map.forEach((b, sel) => { if (!sel.isConnected) { b.remove(); map.delete(sel); if (openFor === sel) close(); } });
  document.querySelectorAll<HTMLSelectElement>('select:not([multiple])').forEach(sync);
}

function schedule(): void {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(syncAll);
}

function options(sel: HTMLSelectElement): { value: string; text: string; disabled: boolean; group?: string }[] {
  const out: any[] = [];
  Array.from(sel.children).forEach(c => {
    if (c instanceof HTMLOptGroupElement) {
      Array.from(c.children).forEach((o, i) => out.push({ value: (o as HTMLOptionElement).value, text: (o.textContent || '').trim(), disabled: (o as HTMLOptionElement).disabled, group: i === 0 ? c.label : undefined }));
    } else out.push({ value: (c as HTMLOptionElement).value, text: (c.textContent || '').trim(), disabled: (c as HTMLOptionElement).disabled });
  });
  return out;
}

function open(sel: HTMLSelectElement): void {
  close();
  const b = map.get(sel)!;
  if (!b || sel.disabled) return;
  const opts = options(sel);
  panel = document.createElement('div');
  panel.className = 'fx-panel';
  panel.setAttribute('role', 'listbox');
  if (b.closest('.sidebar')) panel.classList.add('fx-side');
  opts.forEach((o, i) => {
    if (o.group) { const g = document.createElement('div'); g.className = 'fx-group'; g.textContent = o.group; panel!.appendChild(g); }
    const d = document.createElement('div');
    d.className = 'fx-opt' + (o.value === sel.value ? ' sel' : '') + (o.disabled ? ' dis' : '');
    d.setAttribute('role', 'option');
    d.dataset['i'] = String(i);
    d.innerHTML = '<span class="fx-t"></span><svg class="fx-ck" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
    (d.firstChild as HTMLElement).textContent = o.text;
    d.addEventListener('mousemove', () => hl(i));
    d.addEventListener('mousedown', e => e.preventDefault());
    d.addEventListener('click', () => { if (!o.disabled) pick(sel, o.value); });
    panel!.appendChild(d);
  });
  document.body.appendChild(panel);
  openFor = sel;
  b.setAttribute('aria-expanded', 'true');
  const r = b.getBoundingClientRect();
  panel.style.width = r.width + 'px';
  const h = panel.offsetHeight, below = window.innerHeight - r.bottom - 8, above = r.top - 8;
  const up = h > below && above > below;
  panel.style.maxHeight = Math.max(140, Math.min(300, up ? above : below)) + 'px';
  const ph = panel.offsetHeight;
  panel.style.top = (up ? r.top - ph - 6 : r.bottom + 6) + 'px';
  panel.style.left = Math.max(8, Math.min(r.left, window.innerWidth - r.width - 8)) + 'px';
  active = opts.findIndex(o => o.value === sel.value);
  hl(active, true);
  b.focus();
}

function hl(i: number, scroll = false): void {
  if (!panel) return;
  active = i;
  panel.querySelectorAll('.fx-opt').forEach(el => el.classList.toggle('act', (el as HTMLElement).dataset['i'] === String(i)));
  if (scroll) panel.querySelector('.fx-opt.act')?.scrollIntoView({ block: 'nearest' });
}

function pick(sel: HTMLSelectElement, value: string): void {
  if (sel.value !== value) {
    sel.value = value;
    sel.dispatchEvent(new Event('input', { bubbles: true }));
    sel.dispatchEvent(new Event('change', { bubbles: true }));
  }
  const b = map.get(sel);
  close();
  sync(sel);
  b?.focus();
}

function close(): void {
  if (!panel) return;
  if (openFor) map.get(openFor)?.removeAttribute('aria-expanded');
  panel.remove(); panel = null; openFor = null; active = -1;
}

function onKey(e: KeyboardEvent): void {
  if (!panel || !openFor) return;
  const items = Array.from(panel.querySelectorAll<HTMLElement>('.fx-opt'));
  const step = (d: number) => { let i = active; do { i += d; } while (items[i]?.classList.contains('dis')); if (i >= 0 && i < items.length) hl(i, true); };
  if (e.key === 'ArrowDown') { e.preventDefault(); step(1); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); step(-1); }
  else if (e.key === 'Home') { e.preventDefault(); hl(0, true); }
  else if (e.key === 'End') { e.preventDefault(); hl(items.length - 1, true); }
  else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); const o = options(openFor)[active]; if (o && !o.disabled) pick(openFor, o.value); }
  else if (e.key === 'Escape' || e.key === 'Tab') { const s = openFor; close(); if (e.key === 'Escape') map.get(s!)?.focus(); }
  else if (e.key.length === 1) {
    const i = items.findIndex((el, k) => k > active && el.textContent!.trim().toLowerCase().startsWith(e.key.toLowerCase()));
    const j = i >= 0 ? i : items.findIndex(el => el.textContent!.trim().toLowerCase().startsWith(e.key.toLowerCase()));
    if (j >= 0) hl(j, true);
  }
}

export function enhanceSelects(): void {
  if ((window as any).__fxSelects) return;
  (window as any).__fxSelects = true;
  new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
  document.addEventListener('mousedown', e => {
    if (panel && !panel.contains(e.target as Node) && !(e.target as HTMLElement).closest?.('.fx-btn')) close();
  });
  document.addEventListener('keydown', onKey, true);
  window.addEventListener('resize', close);
  window.addEventListener('scroll', e => { if (panel && !panel.contains(e.target as Node)) close(); }, true);
  // valori setate din cod (precompletări) nu declanșează mutații: sincronizăm periodic
  setInterval(syncAll, 400);
  schedule();
}
