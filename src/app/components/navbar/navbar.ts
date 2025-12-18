import { Component, inject, HostListener } from '@angular/core'; // 👈 Importá HostListener
import { CommonModule } from '@angular/common'; // Necesario para *ngIf
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service'; // Ajustá la ruta si hace falta

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.html', // Ojo con el nombre del archivo
  styleUrl: './navbar.scss'
})
export class NavbarComponent {
  
  // Inyectamos el AuthService (público para usarlo en el HTML)
  public authService = inject(AuthService);
  
  menuAbierto = false;
  isScrolled = false; 

  toggleMenu() {
    this.menuAbierto = !this.menuAbierto;
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    // Si bajamos más de 20px, activamos el fondo
    this.isScrolled = window.scrollY > 20;
  }

  // 👇 Función para cerrar sesión
  cerrarSesion() {
    // Un confirm simple para que no le den sin querer
    if(confirm('¿Seguro querés cerrar sesión?')) {
      this.authService.logout();
      this.menuAbierto = false; // Cerramos el menú móvil si estaba abierto
    }
  }

  // 3. (Opcional pero pro) Función para cerrar el menú si se hace clic en un link
  cerrarMenu() {
    this.menuAbierto = false;
  }
}