import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core'; // 👈 IMPORTAMOS PLATFORM_ID
import { isPlatformBrowser } from '@angular/common'; // 👈 IMPORTAMOS isPlatformBrowser
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { NotificacionService } from '../services/notificacion';
import { AuthService } from '../services/auth.service';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  // 1. Inyectamos los servicios necesarios
  const router = inject(Router);
  const notificacionService = inject(NotificacionService);
  const authService = inject(AuthService);
  const platformId = inject(PLATFORM_ID); // 👈 INYECTAMOS EL DETECTOR

  // 2. Buscamos el token SOLO si estamos en el navegador real
  let token = null;
  if (isPlatformBrowser(platformId)) {
    token = localStorage.getItem('access_token');
  }

  // 3. Clonamos la petición si hay token
  let requestToForward = req;
  if (token) {
    requestToForward = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  // 4. Enviamos la petición y atajamos la respuesta
  return next(requestToForward).pipe(
    catchError((error: HttpErrorResponse) => {
      // Si el backend nos patea con un 401
      if (error.status === 401) {
        console.warn('Interceptor: Token rechazado por el backend. Cerrando sesión...');
        
        // Limpiamos el localStorage y el estado del servicio
        authService.logout();
        
        // Le avisamos al usuario
        notificacionService.showError('Tu sesión ha expirado por seguridad. Por favor, volvé a ingresar.');
        
        // Lo mandamos al login
        router.navigate(['/login']);
      }

      // Dejamos que el error siga su curso
      return throwError(() => error);
    })
  );
};