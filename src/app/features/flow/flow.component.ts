import { Component } from '@angular/core';

@Component({
  selector: 'app-flow',
  standalone: true,
  templateUrl: './flow.component.html'
})
export class FlowComponent {
  steps = [
    { t: 'Întrebare liberă', d: 'Colegul scrie ce are nevoie, în cuvintele lui. Nu trebuie să știe sistemul, formularul sau persoana.' },
    { t: 'Înțelegere', d: 'Asistentul recunoaște nevoia și domeniul (HR, IT, achiziții…) după cuvintele-cheie din baza de cunoștințe. Dacă nu e sigur, cere o clarificare.' },
    { t: 'Răspuns potrivit', d: 'Persoana sau echipa responsabilă, pașii unei proceduri sau o cerere ', hl: 'precompletată', d2: ' cu datele colegului. Dacă nu are un răspuns pregătit, caută în cele 1.312 documente din Biblioteca de informații utile.' },
    { t: 'Rutare', d: 'Cererea ajunge direct la echipa corectă, pe canalul existent, fără să fie înlocuit vreun sistem.' },
    { t: 'Urmărire', d: 'Colegul vede statusul: trimisă → preluată → rezolvată.' },
    { t: 'Completare', d: 'Întrebările fără răspuns ajung la owner, care completează baza de cunoștințe.' }
  ] as { t: string; d: string; hl?: string; d2?: string }[];
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
    ['4. Integrare', 'Cereri create direct prin API în ServiceNow și Travel PPC, statusuri reale, căutare în documentele din SharePoint (CCM, beneficii)', 'Național']
  ];
}
