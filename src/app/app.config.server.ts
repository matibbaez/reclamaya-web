import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering } from '@angular/platform-server';
import { provideNoopAnimations } from '@angular/platform-browser/animations'; // 👈 Apaga animaciones en el server
import { appConfig } from './app.config';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(),
    provideNoopAnimations() // 👈 Fundamental para que no explote
  ]
};

export const config = mergeApplicationConfig(appConfig, serverConfig);