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
  templateUrl: './admin-activity.page.html'
})
export class AdminActivityPage { state = inject(StateService); }

@Component({
  selector: 'app-admin-systems',
  standalone: true,
  imports: [SystemsComponent],
  templateUrl: './admin-systems.page.html'
})
export class AdminSystemsPage {}

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [UsersComponent],
  templateUrl: './admin-users.page.html'
})
export class AdminUsersPage {}

@Component({
  selector: 'app-admin-kb',
  standalone: true,
  imports: [KbTableComponent],
  templateUrl: './admin-kb.page.html'
})
export class AdminKbPage {}
