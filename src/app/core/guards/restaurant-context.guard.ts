import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { map, catchError, of } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { RestaurantsService } from '../services/restaurants.service';

// Impersonation itself is kept in memory only, so a reload of a
// /restaurant-view/* route drops it. If the restaurant id survived in the
// URL (?restaurantId=...), re-request an impersonation token instead of
// leaving the tab stuck on an empty, non-impersonated view.
export const restaurantContextGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const restaurantsService = inject(RestaurantsService);
  const router = inject(Router);

  if (authService.isImpersonating()) {
    return true;
  }

  const restaurantId = route.queryParamMap.get('restaurantId');
  if (!restaurantId) {
    router.navigate(['/dashboard']);
    return false;
  }

  return restaurantsService.impersonate(restaurantId).pipe(
    map((response) => {
      if (!response.data) {
        router.navigate(['/dashboard']);
        return false;
      }
      authService.startImpersonation(response.data.access_token, response.data.restaurant);
      return true;
    }),
    catchError(() => {
      router.navigate(['/dashboard']);
      return of(false);
    }),
  );
};
