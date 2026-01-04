import { Component, inject, HostListener, OnInit } from '@angular/core'; 
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { filter } from 'rxjs/operators'; 
import Swal from 'sweetalert2';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.html', 
  styleUrl: './navbar.scss'
})
export class NavbarComponent implements OnInit {
  
  public authService = inject(AuthService);
  private router = inject(Router);
  
  menuAbierto = false;
  isScrolled = false; 
  isHome = true;

  toggleMenu() {
    this.menuAbierto = !this.menuAbierto;
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.isScrolled = window.scrollY > 20;
  }

  ngOnInit() {
    this.checkUrl();
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.checkUrl();
    });
  }

  checkUrl() {
    this.isHome = this.router.url === '/';
  }

  // 👇 CERRAR SESIÓN PREMIUM
  cerrarSesion() {
    this.menuAbierto = false;

    Swal.fire({
      html: `
        <div class="swal-custom-content">
            <div class="icon-wrapper">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M9 3h6a2 2 0 012 2v4" />
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M16 17v4H8a2 2 0 01-2-2V5a2 2 0 012-2" />
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M12 12h9m0 0l-3-3m3 3l-3 3" />
                </svg>
            </div>
            <h3>¿Cerrar Sesión?</h3>
            <p>Nos vemos pronto 👋</p>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Sí, Salir',
      cancelButtonText: 'Cancelar',
      
      customClass: {
        popup: 'premium-modal-popup',
        confirmButton: 'btn-confirm-custom',
        cancelButton: 'btn-cancel-custom'
      },
      buttonsStyling: false,
      width: '360px',
      background: '#ffffff',
      backdrop: `
        rgba(15, 23, 42, 0.6)
        backdrop-filter: blur(4px)
      `
    }).then((result) => {
      if (result.isConfirmed) {
        this.authService.logout();
      }
    });
  }

  cerrarMenu() {
    this.menuAbierto = false;
  }
}