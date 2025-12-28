import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router'; 
import { jwtDecode } from 'jwt-decode';

// Servicios
import { ReclamosService, IReclamo } from '../../../services/reclamos.service';
import { AuthService } from '../../../services/auth.service';
import { NotificacionService } from '../../../services/notificacion';
import { UsersService, IUser } from '../../../services/users.service'; 

@Component({
  selector: 'app-mis-referidos',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './mis-referidos.html',
  styleUrls: ['./mis-referidos.scss']
})
export class MisReferidosComponent implements OnInit {

  private reclamosService = inject(ReclamosService);
  public authService = inject(AuthService);
  private notificacionService = inject(NotificacionService);
  private usersService = inject(UsersService); 

  // Datos
  listaReclamos: IReclamo[] = [];
  miEquipo: IUser[] = []; 
  isLoading = true;
  productorId = '';

  // Links
  linkAsegurados = '';   
  linkProductores = ''; 

  ngOnInit() {
    this.generarLinks();
    this.cargarDatos();
  }

  generarLinks() {
    const tokenRaw = localStorage.getItem('access_token') || localStorage.getItem('token');
    if (!tokenRaw) return;

    try {
      const decoded: any = jwtDecode(tokenRaw);
      const userId = decoded.id || decoded.sub || decoded.userId;

      if (userId) {
        this.productorId = userId;
        const baseUrl = window.location.origin; 
        
        this.linkAsegurados = `${baseUrl}/iniciar-reclamo?ref=${userId}`;
        
        if (this.authService.esOrganizador) {
            this.linkProductores = `${baseUrl}/login?ref=${userId}`;
        }
      } 
    } catch (error) {
      console.error(error);
    }
  }

  copiarLink(url: string) {
    if (!url) return;
    navigator.clipboard.writeText(url).then(() => {
      this.notificacionService.showSuccess('¡Link copiado!');
    });
  }

  cargarDatos() {
    this.isLoading = true;

    // 1. CARGAR SINIESTROS
    this.reclamosService.obtenerMisSiniestros().subscribe({
      next: (data) => {
        this.listaReclamos = data;
        this.isLoading = false;
      },
      error: (err) => { 
        this.isLoading = false; 
      }
    });

    // 2. CARGAR EQUIPO (Solo si soy Organizador)
    if (this.authService.esOrganizador) {
      this.usersService.obtenerMiEquipo().subscribe({
        next: (users) => {
          this.miEquipo = users;
          console.log('Equipo cargado:', users);
        },
        error: (err) => console.error('Error cargando equipo', err)
      });
    }
  }

  obtenerCantidadPorEstado(estado: string): number {
    return this.listaReclamos.filter(r => r.estado === estado).length;
  }

  getEstadoClass(estado: string): string {
    switch (estado) {
      case 'Enviado': return 'badge-blue';
      case 'Recepcionado': return 'badge-purple';
      case 'Iniciado': return 'badge-info';
      case 'Negociacion': return 'badge-orange';
      case 'Indemnizando': return 'badge-yellow';
      case 'Indemnizado': return 'badge-green';
      case 'Rechazado': return 'badge-red';
      default: return 'badge-gray';
    }
  }
}