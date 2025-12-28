import { ApplicationConfig, LOCALE_ID, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http'; 
import { provideRouter, withInMemoryScrolling, withRouterConfig } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';

import { routes } from './app.routes';
import { jwtInterceptor } from './auth/jwt-interceptor';

// 1. Importar los datos del idioma Español (Argentina)
import { registerLocaleData } from '@angular/common';
import localeEsAr from '@angular/common/locales/es-AR';

// 2. Registrar los datos
registerLocaleData(localeEsAr);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    
    provideRouter(routes, 
      withInMemoryScrolling({
        // 1. Ponemos 'disabled' para que Angular NO salte de golpe (si usás scroll suave manual)
        scrollPositionRestoration: 'disabled', 
        anchorScrolling: 'enabled',      
      }), 
      withRouterConfig({ onSameUrlNavigation: 'reload' })
    ),
    
    provideHttpClient(
      withInterceptors([jwtInterceptor])
    ),
    
    provideAnimations(),

    // 3. 👇 ESTA LÍNEA ES LA CLAVE PARA QUE LOS PIPES USEN ESPAÑOL
    { provide: LOCALE_ID, useValue: 'es-AR' }
  ]
};