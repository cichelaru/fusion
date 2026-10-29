import { Component, inject } from '@angular/core';
import { StateService } from '../../core/state.service';
import { ActivityComponent } from '../shared/activity.component';
import { KbTableComponent } from '../shared/kb-table.component';
import { SystemsComponent } from '../shared/systems.component';
import { UsersComponent } from '../shared/users.component';

/** Pagini dedicate din Dashboard admin (fiecare are ruta și intrarea ei în sidebar). */

@Component({
  selector: 'app-admin-activity',
  standalone: true,
  imports: [ActivityComponent],
  template: `
  <app-activity title="Dashboard admin · Activitate" />
  <p style="margin-top:24px"><button class="link-reset" type="button" (click)="state.resetLocal()">Resetează datele salvate local (cereri, intrări noi, roluri)</button></p>`
})
export class AdminActivityPage { state = inject(StateService); }

@Component({
  selector: 'app-admin-systems',
  standalone: true,
  imports: [SystemsComponent],
  template: `<div class="sec-title"><h2>Dashboard admin · Conexiuni sisteme</h2><span class="small">Vizibil doar pentru administrator</span></div><app-systems />`
})
export class AdminSystemsPage {}

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [UsersComponent],
  template: `<div class="sec-title"><h2>Dashboard admin · Utilizatori și roluri</h2><span class="small">Vizibil doar pentru administrator</span></div><app-users />`
})
export class AdminUsersPage {}

@Component({
  selector: 'app-admin-kb',
  standalone: true,
  imports: [KbTableComponent],
  template: `<app-kb-table />`
})
export class AdminKbPage {}
