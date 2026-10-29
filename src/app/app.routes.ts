import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './core/guards';

/** Rutele aplicației. Rolul decide ce dashboard este accesibil (owner / admin); dashboardul personal este pentru toți. */
export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./features/login/login.component').then(m => m.LoginComponent) },
  { path: 'asistent', canActivate: [authGuard], loadComponent: () => import('./features/assistant/assistant.component').then(m => m.AssistantComponent) },
  { path: 'cereri', canActivate: [authGuard], loadComponent: () => import('./features/requests/requests.component').then(m => m.RequestsComponent) },
  { path: 'personal', canActivate: [authGuard], loadComponent: () => import('./features/personal/personal.component').then(m => m.PersonalComponent) },
  { path: 'owner', canActivate: [roleGuard], data: { roles: ['owner'] }, loadComponent: () => import('./features/dashboards/owner.component').then(m => m.OwnerComponent) },
  { path: 'admin', canActivate: [roleGuard], data: { roles: ['admin'] }, children: [
    { path: '', pathMatch: 'full', redirectTo: 'activitate' },
    { path: 'activitate', loadComponent: () => import('./features/dashboards/admin-pages').then(m => m.AdminActivityPage) },
    { path: 'sisteme', loadComponent: () => import('./features/dashboards/admin-pages').then(m => m.AdminSystemsPage) },
    { path: 'utilizatori', loadComponent: () => import('./features/dashboards/admin-pages').then(m => m.AdminUsersPage) },
    { path: 'kb', loadComponent: () => import('./features/dashboards/admin-pages').then(m => m.AdminKbPage) }
  ] },
  { path: 'flux', canActivate: [authGuard], loadComponent: () => import('./features/flow/flow.component').then(m => m.FlowComponent) },
  { path: '', pathMatch: 'full', redirectTo: 'asistent' },
  { path: '**', redirectTo: 'asistent' }
];
