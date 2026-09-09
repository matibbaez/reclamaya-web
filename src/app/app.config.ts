import { ApplicationConfig, LOCALE_ID, provideZoneChangeDetection } from '@angular/core';

// 🔥 1. IMPORTAMOS withInterceptors
import { provideHttpClient, withInterceptors } from '@angular/common/http'; 
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

// 🔥 2. IMPORTAMOS TU INTERCEPTOR (Verificá que la ruta sea correcta)
import { jwtInterceptor } from './auth/jwt-interceptor'; 

import { routes } from './app.routes';
import { registerLocaleData } from '@angular/common';
import localeEsAr from '@angular/common/locales/es-AR';

registerLocaleData(localeEsAr);

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    
    // 🔥 3. CONECTAMOS EL INTERCEPTOR AL HTTP CLIENT
    provideHttpClient(withInterceptors([jwtInterceptor])),
    
    provideAnimationsAsync(),
    
    { provide: LOCALE_ID, useValue: 'es-AR' }
  ]
};