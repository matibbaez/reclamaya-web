import { HttpInterceptorFn } from '@angular/common/http';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  // 1. Buscamos el token con el nombre exacto que usaste en el login
  const token = localStorage.getItem('access_token');

  // 2. Si hay token, lo pegamos en la cabecera de la petición
  if (token) {
    const cloned = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(cloned);
  }

  // 3. Si no hay token (ej: carga de un reclamo público), sigue normal
  return next(req);
};