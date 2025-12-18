import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { NotificacionService } from '../services/notificacion';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const notificacion = inject(NotificacionService);

  // 1. Primero chequeamos si está logueado
  if (!authService.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }

  // 2. Chequeamos si es ADMIN
  if (authService.esAdmin) {
    return true; // Pase, jefe.
  }

  // 3. Si no es admin (ej: es Productor), lo echamos a su zona
  notificacion.showError('Acceso denegado. Zona exclusiva de Administradores.');
  router.navigate(['/mis-referidos']); // O al inicio
  return false;
};