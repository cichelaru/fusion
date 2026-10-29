import { Injectable, computed, inject } from '@angular/core';
import { DataService } from './data.service';
import { StateService } from './state.service';
import { norm } from './util';

const LSTOP: Set<string> = new Set('ce cum care unde cine cand cat cate cati este sunt am ai are avem aveti pentru despre din de la in pe cu si sau un o mai imi mi ma vreau trebuie pot poti poate fac face gasesc gasi caut stiu sa se ne va lui ei acest aceasta asta vrea doresc te rog info informatii unei unui intr ale ala cei cele fost fi fie daca nu da tot toate orice exista ceva aici acolo meu mea mele mei tau ta tale noi voi lor folosesc folosi folosesti utilizez utiliza obtin obtine depun depune completez completeaza cer cere solicit aflu afla vad vede iau trimit trimite scot accesez accesa intru merg ajung functioneaza merge gaseste putea poata vreun vreo nevoie legat legate referitor privind emite emit elibereaza'.split(' '));
const LGRP: string[][] = [['aviz','avize','avizul','avizare'],['nastere','copil','nou nascut','infiere'],['rezerv','rezervare','utilizare'],['cadou','ospitalitate'],['conduita','coduita'],['echipament','echipamente','laptop'],['sport','fitness','gym','sala de forta'],['parcare','parcar','loc de parcare'],['masaj','relaxare'],['birou','office reservation','rezervare birou'],['concediu medical','certificat medical'],['angajare','recrutare','selectie'],['demisie','incetare','offboarding'],['instruire','training'],['salariu','salarizare','fluturas'],['telefon','mobil'],['laptop','calculator','echipament it'],['masina','autoturism','autovehicul'],['semnatura electronica','gosign','docusign'],['date personale','gdpr','protectia datelor'],['avertizor','whistleblowing','integritate'],['cadou','cadouri','protocol'],['ssm','securitate si sanatate']];
const LSYN: [RegExp, string][] = [[/\batr\b|\bavize? (tehnic )?de racordare\b/g,' racordare '],[/\bcibernetic\b/g,' cibernetica securitate '],[/\banticoruptie\b/g,' anti coruptie '],[/\bantimita\b/g,' anti mita '],[/successfactors|\bsuccess factor\b/g,' success factors '],[/\btelemunca\b|munca de acasa|lucru de acasa|lucrez de acasa|\bremote\b|home office/g,' smart working '],[/\bparola\b|\bparole\b/g,' parolelor '],[/\bgdpr\b/g,' protectia datelor personale '],[/\bssm\b/g,' securitate sanatate munca '],[/\bfluturas\b/g,' fluturas salariu '],[/\bdemisie\b|\bplec din firma\b/g,' offboarding incetare '],[/\bangajat nou\b|\bprima zi\b/g,' onboarding ']];
const CO_RE: Record<string, RegExp> = {RER:/ retele electrice | rer | rem red reb /,PPE:/ market | ppe | ppc energie /,PPCRO:/ ppc ro | ppc romania /,PRR:/ renewables | prr /,PTR:/ trading | ptr /,PBR:/ blue | pbr /,PAE:/ advanced | pae /};

/** Căutare în indexul local al documentelor (Biblioteca ta de informații utile), fără backend. */
@Injectable({ providedIn: 'root' })
export class SearchService {
  private data = inject(DataService);
  private state = inject(StateService);

  /** Index normalizat, construit o singură dată după încărcarea datelor. */
  private idx = computed(() => this.data.lib().map(([n, p, s2]: any[]) => ({
    n: ' ' + norm(String(n).replace(/\.[a-z0-9]+$/i, '')) + ' ',
    p: ' ' + norm(p) + ' ',
    s: ' ' + norm(s2) + ' '
  })));

  folders = computed<string[]>(() => {
    const set = new Set<string>();
    this.data.lib().forEach(([, p]: any[]) => {
      if (p) { const parts = String(p).split('/'); for (let k = 1; k <= parts.length; k++) set.add(parts.slice(0, k).join('/')); }
    });
    return [...set].sort();
  });

  search(qIn: string): { toks: string[]; ids: number[] } {
    const LIB = this.data.lib(), LIBN = this.idx();
    let q = ' ' + norm(qIn) + ' ';
    for (const [re, rep] of LSYN) q = q.replace(re, rep);
    const toks = [...new Set(norm(q).split(' ').filter(w => w.length >= 3 && !LSTOP.has(w)))];
    if (!toks.length) return { toks, ids: [] };
    const P1 = (t: string) => ' ' + (t.length < 5 ? t : t.slice(0, Math.max(5, t.length - 3)));
    const pats = toks.map(t => {
      const alts = [t];
      if (t.length >= 4) for (const g of LGRP) { if (g.some(x => !x.includes(' ') && (t.startsWith(x) || x.startsWith(t)))) alts.push(...g); }
      return [...new Set(alts.map(P1))];
    });
    const hasAny = (str: string, arr: string[]) => arr.some(pt => str.includes(pt));
    const N = LIBN.length;
    const w = pats.map(pt => {
      let df = 0;
      for (const x of LIBN) if (hasAny(x.n, pt) || hasAny(x.p, pt) || hasAny(x.s, pt)) df++;
      return Math.log((N + 1) / (df + 1)) + 0.1;
    });
    const W = w.reduce((a, b) => a + b, 0);
    const co = CO_RE[this.state.company()];
    const res: [number, number][] = [];
    LIBN.forEach((x, i) => {
      let cov = 0, np = 0, sc = 0, inName = 0;
      pats.forEach((pt, k) => {
        const inN = hasAny(x.n, pt), inP = hasAny(x.p, pt), inS = hasAny(x.s, pt);
        if (inN || inP || inS) { cov += w[k]; sc += w[k] * ((inN ? 3 : 0) + (inP ? 2 : 0) + (inS ? 1 : 0)); }
        if (inN || inP) np = 1;
        if (inN) inName++;
      });
      const c = cov / W;
      if (np && c >= 0.55) {
        sc = c * 100 + sc;
        if (inName === pats.length) sc += 40;
        if (co && co.test(x.p + x.n)) sc += 12;
        if (/\.mp4$/i.test(LIB[i][0])) sc -= 5;
        res.push([sc, i]);
      }
    });
    res.sort((a, b) => b[0] - a[0] || ((LIB[b[1]][3] || '') > (LIB[a[1]][3] || '') ? 1 : -1));
    const seen = new Set<string>(), ids: number[] = [];
    for (const r of res) {
      const k = norm(LIB[r[1]][0]);
      if (seen.has(k)) continue;
      seen.add(k); ids.push(r[1]);
      if (ids.length === 5) break;
    }
    return { toks, ids };
  }
}
