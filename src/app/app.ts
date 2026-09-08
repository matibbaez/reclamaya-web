import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common'; // <-- EL ESCUDO
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar';
import { FooterComponent } from './components/footer/footer';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, FooterComponent],
  template: `
    <app-navbar></app-navbar>
    <router-outlet></router-outlet>
    <app-footer></app-footer>
  `
})
export class AppComponent implements OnInit {
  private platformId = inject(PLATFORM_ID);

  ngOnInit() {
    // 🔥 BLOQUEAMOS EL BUCLE INFINITO EN EL SERVIDOR
    if (isPlatformBrowser(this.platformId)) {
      
      // 👇 1. LE DECIMOS A TYPESCRIPT QUE IGNORE EL ERROR DE TIPOS
      // @ts-ignore
      import('lenis').then(module => {
        
        // Dependiendo de la versión de Lenis, puede venir en default o directo
        const Lenis = module.default;
        const lenis = new Lenis();

        function raf(time: any) {
          lenis.raf(time);
          requestAnimationFrame(raf);
        }
        requestAnimationFrame(raf);
      }).catch(err => console.error('Error cargando Lenis:', err));
      
    }
  }
}