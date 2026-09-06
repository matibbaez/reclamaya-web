import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app'; // <-- Ajustado a './app/app' igual que tu main.ts
import { config } from './app/app.config.server';

const bootstrap = () => bootstrapApplication(AppComponent, config);

export default bootstrap;