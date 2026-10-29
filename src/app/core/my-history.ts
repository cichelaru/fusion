/** Cereri mai vechi, diferite în funcție de rol (date-exemplu). */
export interface HistItem { title: string; id: string; st: string; team: string; when: string; days: number; stIdx?: number; sla?: string; }

const ANGAJAT: HistItem[] = [
  { title: 'Adeverință de venit (bancă)', id: 'HR-0388', st: 'Rezolvată', team: 'Echipa HR', when: 'acum 12 zile', days: 12 },
  { title: 'Cerere concediu de odihnă', id: 'HR-0402', st: 'Aprobată', team: 'Șef direct', when: 'acum 5 zile', days: 5 },
  { title: 'Ticket IT: acces aplicație', id: 'IT-1177', st: 'În lucru', team: 'IT Suport', when: 'acum 2 zile', days: 2, stIdx: 1, sla: '2 zile lucrătoare' },
  { title: 'Rezervare birou, Day Tower', id: 'FAC-0731', st: 'Rezolvată', team: 'Facility', when: 'acum 20 de zile', days: 20 }
];

const OWNER: HistItem[] = [
  { title: 'Cerere de achiziție: echipamente pentru echipă', id: 'ACH-0214', st: 'În lucru', team: 'Achiziții', when: 'acum 3 zile', days: 3, stIdx: 1, sla: '5 zile lucrătoare' },
  { title: 'Aprobare concediu: Marinescu Elena', id: 'HR-0511', st: 'Aprobată', team: 'Tu (aprobator)', when: 'acum 1 zi', days: 1 },
  { title: 'Deplasare București: training', id: 'TRV-0098', st: 'Rezolvată', team: 'Travel PPC', when: 'acum 9 zile', days: 9 },
  { title: 'Actualizare răspuns în baza de cunoștințe', id: 'KB-0031', st: 'Rezolvată', team: 'Echipa Fusion', when: 'acum 14 zile', days: 14 },
  { title: 'Cerere de ofertă: servicii de mentenanță', id: 'ACH-0188', st: 'Aprobată', team: 'Achiziții', when: 'acum 26 de zile', days: 26 }
];

const ADMIN: HistItem[] = [
  { title: 'Acces administrator: Fusion Gateway', id: 'IT-2041', st: 'În lucru', team: 'IT Securitate', when: 'acum 1 zi', days: 1, stIdx: 1, sla: '1 zi lucrătoare' },
  { title: 'Reînnoire certificat: conexiune ServiceNow', id: 'IT-2010', st: 'În lucru', team: 'IT Infrastructură', when: 'acum 4 zile', days: 4, stIdx: 1, sla: '3 zile lucrătoare' },
  { title: 'Licențe Office pentru 10 utilizatori', id: 'IT-1988', st: 'Rezolvată', team: 'IT Service Desk', when: 'acum 6 zile', days: 6 },
  { title: 'Modificare rol: Popescu Andrei → owner', id: 'IT-1950', st: 'Aprobată', team: 'IT Securitate', when: 'acum 11 zile', days: 11 },
  { title: 'Arhivare date locale (backup)', id: 'IT-1902', st: 'Rezolvată', team: 'IT Infrastructură', when: 'acum 20 de zile', days: 20 }
];

export function historyFor(role: string): HistItem[] {
  return role === 'admin' ? ADMIN : role === 'owner' ? OWNER : ANGAJAT;
}
