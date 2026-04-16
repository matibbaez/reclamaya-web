import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router); // Inyectamos el Router
  
  // 1. Chequeamos si el "sello" (token) existe en localStorage
  const token = localStorage.getItem('access_token');

  if (token) {
    try {
      // 2. Decodificamos el token para ver qué tiene adentro
      const decoded: any = jwtDecode(token);
      const currentTime = Date.now() / 1000; // Tiempo actual en segundos
      
      // 3. Verificamos si la fecha de expiración (exp) ya pasó
      if (decoded.exp < currentTime) {
        // ¡El token venció! Lo borramos y lo pateamos al Login
        console.warn('AuthGuard: Token vencido, redirigiendo a /login');
        localStorage.removeItem('access_token');
        router.navigate(['/login']);
        return false;
      }
      
      // ¡PERFECTO! Tiene el sello y todavía es válido. Dejalo pasar.
      return true; 
      
    } catch (e) {
      // Si el token está mal formado o hay un error al decodificar
      console.error('AuthGuard: Error al decodificar token', e);
      localStorage.removeItem('access_token');
      router.navigate(['/login']);
      return false;
    }
  } 

  // ¡NO TIENE SELLO! Lo pateamos de vuelta al Login
  router.navigate(['/login']);
  return false; 
};