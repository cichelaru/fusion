import { Component } from '@angular/core';

@Component({
  selector: 'app-flow',
  standalone: true,
  template: `
  <div class="sec-title"><h2>Cum funcționează: fluxul complet</h2></div>
  <div class="flow">
    <div class="node"><b>1. Întrebare liberă</b>Colegul scrie ce are nevoie, în cuvintele lui. Nu trebuie să știe sistemul, formularul sau persoana.</div><div class="arrow">→</div>
    <div class="node"><b>2. Înțelegere</b>AI-ul identifică nevoia și domeniul (HR, IT, achiziții…). Dacă nu e sigur, cere o clarificare.</div><div class="arrow">→</div>
    <div class="node"><b>3. Răspuns potrivit</b>Persoana sau echipa responsabilă, pașii unei proceduri sau o cerere <b style="display:inline;color:var(--orange-d)">precompletată</b> cu datele colegului. Dacă nu are un răspuns pregătit, caută în cele 1.312 documente din Biblioteca de informații utile.</div><div class="arrow">→</div>
    <div class="node"><b>4. Rutare</b>Cererea ajunge direct la echipa corectă, pe canalul existent, fără să fie înlocuit vreun sistem.</div><div class="arrow">→</div>
    <div class="node"><b>5. Urmărire</b>Colegul vede statusul: trimisă → preluată → rezolvată.</div><div class="arrow">→</div>
    <div class="node"><b>6. Învățare</b>Întrebările fără răspuns ajung la owner, care completează baza de cunoștințe.</div>
  </div>
  <h3 style="color:var(--black)">Domenii și plan de extindere</h3>
  <div class="domains">
    @for (d of domains; track d.t) {
      <div class="dom"><span [class]="'state ' + d.c">{{ d.s }}</span><h4 style="margin:4px 0">{{ d.t }}</h4><div class="small">{{ d.d }}</div></div>
    }
  </div>
  <div class="box" style="margin-top:20px">
    <h4>Plan de implementare</h4>
    <table><thead><tr><th>Etapă</th><th>Ce</th><th>Unde</th></tr></thead><tbody>
      @for (p of plan; track p[0]) { <tr><td><b>{{ p[0] }}</b></td><td>{{ p[1] }}</td><td>{{ p[2] }}</td></tr> }
    </tbody></table>
  </div>`
})
export class FlowComponent {
  domains = [
    { c: 'live', s: 'FUNCȚIONAL ÎN PROTOTIP', t: 'HR', d: 'Adeverințe, actualizare permis, concediu, date personale, evaluare internă, fluturaș, pontaj, salarizare' },
    { c: 'demo', s: 'DEMONSTRATIV', t: 'IT', d: 'Knox / telefon de serviciu, cont blocat, acces la aplicații' },
    { c: 'demo', s: 'DEMONSTRATIV', t: 'Travel', d: 'Cerere de deplasare: transport, cazare, aprobare (alt sistem decât ServiceNow, același punct de intrare)' },
    { c: 'plan', s: 'PLANIFICAT', t: 'Achiziții & Financiar', d: 'Comenzi, aprobări, deconturi de deplasare' },
    { c: 'demo', s: 'DEMONSTRATIV', t: 'Compliance & documente', d: 'Whistleblowing (confidențial, fără înregistrare), CCM și beneficii din Biblioteca de informații utile' },
    { c: 'plan', s: 'PLANIFICAT', t: 'Facility & Juridic', d: 'Spații și logistică, verificare contracte' }
  ];
  plan = [
    ['1. Pilot', 'HR + IT, bază de cunoștințe întreținută de owner-i', 'O zonă (ex. Zona MT/JT Constanța)'],
    ['2. Extindere', 'Aceleași domenii, conectare la autentificarea companiei (SSO)', 'Toate zonele'],
    ['3. Domenii noi', 'Achiziții, financiar, facility, juridic, compliance (doar conținut nou)', 'Național'],
    ['4. Integrare', 'Cereri create direct prin API în ServiceNow și Travel PPC, statusuri reale, căutare AI în documentele din SharePoint (CCM, beneficii)', 'Național']
  ];
}
