import { ApplicationConfig, LOCALE_ID, provideZoneChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http'; 
import { provideRouter } from '@angular/router';

// 🔥 1. CAMBIAMOS EL IMPORT AL ASÍNCRONO
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import { routes } from './app.routes';
import { registerLocaleData } from '@angular/common';
import localeEsAr from '@angular/common/locales/es-AR';

registerLocaleData(localeEsAr);

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(),
    
    // 🔥 2. USAMOS LA VERSIÓN ASÍNCRONA PARA NO COLGAR A NODE.JS
    provideAnimationsAsync(),
    
    { provide: LOCALE_ID, useValue: 'es-AR' }
  ]
};