// 🔥 1. LA TRAMPA: Capturamos la muerte del hilo antes de que Angular la oculte
process.on('uncaughtException', (err) => {
  console.error('\n\n🚨🚨🚨 ASESINO ATRAPADO (Exception) 🚨🚨🚨\n', err, '\n\n');
});
process.on('unhandledRejection', (err) => {
  console.error('\n\n🚨🚨🚨 ASESINO ATRAPADO (Rejection) 🚨🚨🚨\n', err, '\n\n');
});

// 2. Ahora sí, las importaciones normales de Angular
import { bootstrapApplication, type BootstrapContext } from '@angular/platform-browser';
import { AppComponent } from './app/app';
import { config } from './app/app.config.server';

const bootstrap = (context: BootstrapContext) => bootstrapApplication(AppComponent, config, context);
export default bootstrap;