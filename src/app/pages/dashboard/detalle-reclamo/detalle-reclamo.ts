import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common'; 
import { ActivatedRoute } from '@angular/router';
import { ReclamosService, IReclamo } from '../../../services/reclamos.service';
import { NotificacionService } from '../../../services/notificacion';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-detalle-reclamo',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './detalle-reclamo.html',
  styleUrls: ['./detalle-reclamo.scss']
})
export class DetalleReclamoComponent implements OnInit {

  private route = inject(ActivatedRoute);
  private location = inject(Location);
  private reclamosService = inject(ReclamosService);
  private notificacionService = inject(NotificacionService);
  public authService = inject(AuthService); 

  reclamo: IReclamo | null = null;
  isLoading = true;
  
  // Lista de estados para el select (Solo si es Admin)
  estadosPosibles = ['Enviado', 'Recepcionado', 'Iniciado', 'Negociacion', 'Indemnizando', 'Indemnizado', 'Rechazado'];

  ngOnInit() {
    // 1. Obtener el ID de la URL
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.cargarReclamo(id);
    } else {
      this.volver();
    }
  }

  cargarReclamo(id: string) {
    this.reclamosService.getReclamoPorId(id).subscribe({
      next: (data) => {
        this.reclamo = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.notificacionService.showError('No se pudo cargar el reclamo.');
        this.volver();
      }
    });
  }

  // Lógica para ver archivos
  verArchivo(tipo: string) {
    if (!this.reclamo) return;

    this.reclamosService.getArchivoUrl(this.reclamo.id, tipo).subscribe({
      next: (res) => {
        window.open(res.url, '_blank');
      },
      error: (err) => {
        this.notificacionService.showError('No se encontró el archivo o expiró.');
      }
    });
  }

  contactarWhatsApp() {
    if (!this.reclamo) return;

    // 1. GUARDIA DE SEGURIDAD:
    // Si no hay teléfono o está vacío, avisamos y cortamos la ejecución.
    if (!this.reclamo.telefono) {
      alert('⚠️ Este reclamo no tiene un teléfono registrado.');
      return;
    }

    const telefono = this.reclamo.telefono;
    const nombre = this.reclamo.nombre || 'Cliente'; // Por si no tiene nombre
    const codigo = this.reclamo.codigo_seguimiento;

    // 2. Ahora sí es seguro usar .replace() porque ya validamos arriba
    const numLimpio = telefono.replace(/\D/g, '');
    
    const mensaje = `Hola ${nombre}, te escribo de Reclama Ya por tu trámite con código ${codigo}. Necesitamos consultarte lo siguiente: `;
    const mensajeEscapado = encodeURIComponent(mensaje);

    window.open(`https://wa.me/${numLimpio}?text=${mensajeEscapado}`, '_blank');
  }

  cambiarEstado(nuevoEstado: string) {
    if (!this.reclamo) return;
    
    if (!confirm(`¿Estás seguro de cambiar el estado a "${nuevoEstado}"? El cliente recibirá un email.`)) return;

    this.isLoading = true;
    this.reclamosService.actualizarEstado(this.reclamo.id, nuevoEstado).subscribe({
      next: (res) => {
        this.reclamo = res;
        this.isLoading = false;
        this.notificacionService.showSuccess(`Estado actualizado a ${nuevoEstado}`);
      },
      error: (err) => {
        this.isLoading = false;
        this.notificacionService.showError('Error al actualizar estado.');
      }
    });
  }

  volver() {
    this.location.back();
  }
}