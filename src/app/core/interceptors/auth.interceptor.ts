import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { catchError, switchMap, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getAccessToken();

  // Add Authorization header if token exists and not login/refresh endpoints
  if (token && !req.url.includes('/auth/login') && !req.url.includes('/auth/refresh')) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req).pipe(
    catchError(error => {
      // Handle 401 Unauthorized errors by attempting token refresh
      if (error.status === 401 && !req.url.includes('/auth/refresh') && !req.url.includes('/auth/login')) {
        // Attempt to refresh the token using AuthService
        return authService.refreshToken().pipe(
          switchMap(() => {
            // Get the new token after refresh
            const newToken = authService.getAccessToken();
            if (newToken) {
              // Clone the original request with the new token
              const clonedReq = req.clone({
                setHeaders: {
                  Authorization: `Bearer ${newToken}`
                }
              });
              // Retry the original request with new token
              return next(clonedReq);
            }
            // If no new token, logout and throw error
            authService.logout();
            return throwError(() => new Error('Token refresh failed'));
          }),
          catchError(refreshError => {
            // If refresh fails, logout user and redirect to login
            authService.logout();
            return throwError(() => refreshError);
          })
        );
      }
      // For other errors, just pass them through
      return throwError(() => error);
    })
  );
};
