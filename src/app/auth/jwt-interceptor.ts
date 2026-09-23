import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core'; // 👈 IMPORTAMOS PLATFORM_ID
import { isPlatformBrowser } from '@angular/common'; // 👈 IMPORTAMOS isPlatformBrowser
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { NotificacionService } from '../services/notificacion';
import { AuthService } from '../services/auth.service';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const notificacionService = inject(NotificacionService);
  const authService = inject(AuthService);
  const platformId = inject(PLATFORM_ID);

  let token = null;
  if (isPlatformBrowser(platformId)) {
    token = localStorage.getItem('access_token');
  }

  let requestToForward = req;
  if (token) {
    requestToForward = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }

  // 👇 El login/register NUNCA deben disparar el "logout automático":
  // un 401 ahí significa credenciales inválidas, no sesión vencida.
  const esAuthPublico = req.url.includes('/auth/login') || req.url.includes('/auth/register');

  return next(requestToForward).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !esAuthPublico) {
        authService.logout();
        notificacionService.showError('Tu sesión ha expirado por seguridad. Por favor, volvé a ingresar.');
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};