import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { NotificacionService } from '../services/notificacion';
import { AuthService } from '../services/auth.service';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  // 1. Inyectamos los servicios necesarios (igual que en tu authGuard)
  const router = inject(Router);
  const notificacionService = inject(NotificacionService);
  const authService = inject(AuthService);

  // 2. Buscamos el token
  const token = localStorage.getItem('access_token');

  // 3. Clonamos la petición si hay token
  let requestToForward = req;
  if (token) {
    requestToForward = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  // 4. Enviamos la petición y atajamos la respuesta (ACÁ ESTÁ LA MAGIA)
  return next(requestToForward).pipe(
    catchError((error: HttpErrorResponse) => {
      // Si el backend nos patea con un 401 (Unauthorized / Token vencido)
      if (error.status === 401) {
        console.warn('Interceptor: Token rechazado por el backend. Cerrando sesión...');
        
        // Limpiamos el localStorage y el estado del servicio
        authService.logout();
        
        // Le avisamos al usuario para que no se asuste si ve todo en blanco
        notificacionService.showError('Tu sesión ha expirado por seguridad. Por favor, volvé a ingresar.');
        
        // Lo mandamos al login
        router.navigate(['/login']);
      }

      // Dejamos que el error siga su curso por si otro componente lo necesita
      return throwError(() => error);
    })
  );
};