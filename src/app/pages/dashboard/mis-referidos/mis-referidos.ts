import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReclamosService, IReclamo } from '../../../services/reclamos.service';
import { AuthService } from '../../../services/auth.service';
import { NotificacionService } from '../../../services/notificacion';
import { environment } from '../../../../environments/environment';
import { jwtDecode } from 'jwt-decode';
import { RouterModule } from '@angular/router'; 

@Component({
  selector: 'app-mis-referidos',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './mis-referidos.html',
  styleUrls: ['./mis-referidos.scss']
})
export class MisReferidosComponent implements OnInit {

  private reclamosService = inject(ReclamosService);
  private authService = inject(AuthService);
  private notificacionService = inject(NotificacionService);

  listaReclamos: IReclamo[] = [];
  isLoading = true;
  miLinkReferido = '';
  productorId = '';

  ngOnInit() {
    this.cargarDatos();
    this.generarLink();
  }

  generarLink() {
    console.log('--- INTENTANDO GENERAR LINK ---');
    
    // 1. Intentamos leer el token directamente del navegador
    const tokenRaw = localStorage.getItem('token') || localStorage.getItem('access_token');

    if (!tokenRaw) {
      console.error('❌ NO HAY TOKEN en LocalStorage. El usuario no parece estar logueado.');
      this.notificacionService.showError('No se encontró sesión activa. Por favor, logueate de nuevo.');
      return;
    }

    try {
      // 2. Decodificamos el token manualmente aquí
      const decoded: any = jwtDecode(tokenRaw);
      console.log('✅ Token decodificado:', decoded);

      // 3. Buscamos el ID en varios campos posibles
      const userId = decoded.id || decoded.sub || decoded.userId;

      if (userId) {
        this.productorId = userId;
        const baseUrl = window.location.origin; // http://localhost:4200
        this.miLinkReferido = `${baseUrl}/iniciar-reclamo?ref=${userId}`;
        console.log('🚀 LINK GENERADO:', this.miLinkReferido);
      } else {
        console.warn('⚠️ El token existe pero no tiene campo "id" ni "sub".', decoded);
      }

    } catch (error) {
      console.error('❌ Error al decodificar el token:', error);
    }
  }

  copiarLink() {
    navigator.clipboard.writeText(this.miLinkReferido).then(() => {
      this.notificacionService.showSuccess('¡Link copiado al portapapeles!');
    });
  }

  cargarDatos() {
    this.reclamosService.obtenerMisSiniestros().subscribe({
      next: (data) => {
        this.listaReclamos = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
        this.notificacionService.showError('Error al cargar tus siniestros.');
      }
    });
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