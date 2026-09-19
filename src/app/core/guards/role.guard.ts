import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { USER_ROLES } from '@app/shared/enums';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const requiredRoles = route.data['roles'] as USER_ROLES[] | undefined;

  if (!requiredRoles || requiredRoles.length === 0) {
    return true;
  }

  const userRole = authService.currentUser()?.role;

  if (userRole && requiredRoles.includes(userRole)) {
    return true;
  }

  router.navigate(['/dashboard']);
  return false;
};
