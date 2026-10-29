import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = () => {
  const a = inject(AuthService);
  return a.isLoggedIn() ? true : inject(Router).createUrlTree(['/login']);
};

/** Lasă ruta doar rolurilor din `data.roles`; ceilalți ajung în dashboardul personal. */
export const roleGuard: CanActivateFn = route => {
  const a = inject(AuthService);
  if (!a.isLoggedIn()) return inject(Router).createUrlTree(['/login']);
  const roles: string[] = route.data?.['roles'] || [];
  return roles.includes(a.role()) ? true : inject(Router).createUrlTree(['/personal']);
};
