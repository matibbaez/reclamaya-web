import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar';
import { FooterComponent } from './components/footer/footer';
import { NotificacionComponent } from './components/notificacion/notificacion';
import { NotificacionService } from './services/notificacion';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent, FooterComponent, NotificacionComponent],
  template: `
    <app-navbar></app-navbar>

    <div class="toast-container">
      <app-notificacion
        *ngFor="let n of (notificacionService.notificaciones$ | async)"
        [notificacion]="n"
        (close)="onCloseNotificacion($event)">
      </app-notificacion>
    </div>

    <router-outlet></router-outlet>
    <app-footer></app-footer>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      pointer-events: none;
    }
    .toast-container app-notificacion {
      pointer-events: auto;
    }
  `]
})
export class AppComponent implements OnInit {
  private platformId = inject(PLATFORM_ID);
  public notificacionService = inject(NotificacionService);

  onCloseNotificacion(id: number) {
    this.notificacionService.removerNotificacion(id);
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      // @ts-ignore
      import('lenis').then(module => {
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