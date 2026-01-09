import { ApplicationConfig, LOCALE_ID, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http'; 
import { provideRouter, withInMemoryScrolling, withRouterConfig } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';

import { routes } from './app.routes';
import { jwtInterceptor } from './auth/jwt-interceptor';

import { registerLocaleData } from '@angular/common';
import localeEsAr from '@angular/common/locales/es-AR';

registerLocaleData(localeEsAr);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    
    provideRouter(routes, 
      withInMemoryScrolling({
        scrollPositionRestoration: 'disabled', 
        anchorScrolling: 'enabled',      
      }), 
      withRouterConfig({ onSameUrlNavigation: 'reload' })
    ),
    
    provideHttpClient(
      withInterceptors([jwtInterceptor])
    ),
    
    provideAnimations(),

    { provide: LOCALE_ID, useValue: 'es-AR' }
  ]
};