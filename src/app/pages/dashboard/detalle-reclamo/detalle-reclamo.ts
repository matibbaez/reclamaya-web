import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import Swal from 'sweetalert2';

/* Lucide */
import {
  LucideAngularModule,
  Eye,
  FileText,
  Camera,
  Shield,
  CreditCard,
  Car,
  AlertTriangle,
  Stethoscope
} from 'lucide-angular';

/* Services & Interfaces */
import { ReclamosService, IReclamo } from '../../../services/reclamos.service';
import { NotificacionService } from '../../../services/notificacion';
import { AuthService } from '../../../services/auth.service';
import { UsersService, IUser } from '../../../services/users.service';

@Component({
  selector: 'app-detalle-reclamo',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './detalle-reclamo.html',
  styleUrls: ['./detalle-reclamo.scss']
})
export class DetalleReclamoComponent implements OnInit {

  /* =======================
     ICONOS
  ======================== */
  readonly EyeIcon = Eye;

  /* =======================
     INYECCIONES
  ======================== */
  private route = inject(ActivatedRoute);
  private location = inject(Location);
  private reclamosService = inject(ReclamosService);
  private usersService = inject(UsersService);
  private notificacionService = inject(NotificacionService);
  public authService = inject(AuthService);

  /* =======================
     ESTADO
  ======================== */
  reclamo: IReclamo | null = null;
  isLoading = true;

  // SOLUCIÓN CLAVE: Variable normal, NO es un getter.
  // Esto evita que Angular redibuje los botones al mover el mouse.
  archivosDisponibles: any[] = []; 

  /* =======================
     TRAMITADORES
  ======================== */
  tramitadores: IUser[] = [];
  tramitadorSeleccionado = '';
  editandoTramitador = false;

  /* =======================
     ESTADOS POSIBLES
  ======================== */
  estadosPosibles = [
    'Enviado',
    'Recepcionado',
    'Iniciado',
    'Negociacion',
    'Indemnizando',
    'Indemnizado',
    'Rechazado'
  ];

  /* =======================
     CICLO DE VIDA
  ======================== */
  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      this.volver();
      return;
    }

    this.cargarReclamo(id);

    if (this.authService.esAdmin) {
      this.cargarTramitadores();
    }
  }

  /* =======================
     CARGA DE DATOS
  ======================== */
  private cargarReclamo(id: string): void {
    this.isLoading = true;

    this.reclamosService.getReclamoPorId(id)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (data) => {
          this.reclamo = data;
          this.syncTramitador(data);
          
          // GENERAMOS LA LISTA UNA ÚNICA VEZ AQUÍ
          this.generarLegajo();
        },
        error: () => {
          this.notificacionService.showError('Error al recuperar el expediente.');
          this.volver();
        }
      });
  }

  /* =======================
     LÓGICA DEL LEGAJO (FIX)
  ======================== */
  private generarLegajo(): void {
    if (!this.reclamo) return;

    const iconMap: Record<string, any> = {
      dni: CreditCard,
      licencia: Car,
      cedula: FileText,
      poliza: Shield,
      denuncia: AlertTriangle,
      fotos: Camera,
      medicos: Stethoscope
    };

    const docs = [
      { key: 'dni',      label: 'DNI',             sub: 'Documento identidad', path: this.reclamo.path_dni },
      { key: 'licencia', label: 'Licencia',        sub: 'Licencia conducir',   path: this.reclamo.path_licencia },
      { key: 'cedula',   label: 'Cédula',          sub: 'Cédula verde/azul',   path: this.reclamo.path_cedula },
      { key: 'poliza',   label: 'Póliza',          sub: 'Póliza vigente',      path: this.reclamo.path_poliza },
      { key: 'denuncia', label: 'Denuncia Admin.', sub: 'Denuncia seguro',     path: this.reclamo.path_denuncia },
      { key: 'fotos',    label: 'Fotos del Hecho', sub: 'Galería imágenes',    path: this.reclamo.path_fotos, highlight: true },
      { key: 'medicos',  label: 'Cert. Médicos',   sub: 'Historia Clínica',    path: this.reclamo.path_medicos, alert: true },
    ];

    // Asignamos el array una sola vez. Ahora es estable en memoria.
    this.archivosDisponibles = docs
      .filter(d => d.path)
      .map(d => ({
        ...d,
        icon: iconMap[d.key] || FileText
      }));
  }

  /* =======================
     RESTO DE LÓGICA
  ======================== */
  private cargarTramitadores(): void {
    this.usersService.getTramitadores().subscribe({
      next: users => this.tramitadores = users,
      error: () => console.error('Error cargando tramitadores')
    });
  }

  private syncTramitador(data: IReclamo): void {
    if (data.tramitador) {
      this.tramitadorSeleccionado = data.tramitador.id;
      this.editandoTramitador = false;
    } else {
      this.editandoTramitador = true;
    }
  }

  activarEdicion(): void {
    this.editandoTramitador = true;
  }

  cancelarEdicion(): void {
    if (this.reclamo?.tramitador) {
      this.tramitadorSeleccionado = this.reclamo.tramitador.id;
      this.editandoTramitador = false;
    } else {
      this.tramitadorSeleccionado = '';
    }
  }

  asignarAbogado(): void {
    if (!this.reclamo || !this.tramitadorSeleccionado) return;

    this.reclamosService
      .asignarTramitador(this.reclamo.id, this.tramitadorSeleccionado)
      .subscribe({
        next: res => {
          this.reclamo = res;
          this.editandoTramitador = false;
          this.notificacionService.showSuccess('Responsable asignado correctamente');
        },
        error: () =>
          this.notificacionService.showError('No se pudo asignar el responsable.')
      });
  }

  cambiarEstado(nuevoEstado: string): void {
    if (!this.reclamo || this.reclamo.estado === nuevoEstado) return;

    Swal.fire({
      title: '¿Confirmar cambio?',
      html: `Vas a cambiar el estado a <b style="color:#3b82f6">${nuevoEstado}</b>.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, cambiar estado',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
      buttonsStyling: false,
      customClass: {
        popup: 'mi-alert-popup',
        confirmButton: 'mi-alert-btn-confirm',
        cancelButton: 'mi-alert-btn-cancel'
      }
    }).then(result => {
      if (!result.isConfirmed || !this.reclamo) return;

      const tramitadorActual = this.reclamo.tramitador;
      this.isLoading = true;

      Swal.fire({
        title: 'Actualizando...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      this.reclamosService
        .actualizarEstado(this.reclamo.id, nuevoEstado)
        .pipe(finalize(() => this.isLoading = false))
        .subscribe({
          next: res => {
            this.reclamo = res;

            if (!this.reclamo.tramitador && tramitadorActual) {
              this.reclamo.tramitador = tramitadorActual;
            }

            Swal.fire({
              title: 'Actualizado',
              icon: 'success',
              timer: 2000,
              showConfirmButton: false,
              buttonsStyling: false,
              customClass: { popup: 'mi-alert-popup' }
            });
          },
          error: () =>
            Swal.fire({
              title: 'Error',
              text: 'No se pudo actualizar el estado.',
              icon: 'error',
              buttonsStyling: false,
              confirmButtonText: 'Cerrar',
              customClass: {
                popup: 'mi-alert-popup',
                confirmButton: 'mi-alert-btn-confirm'
              }
            })
        });
    });
  }

  verArchivo(tipo: string): void {
    if (!this.reclamo) return;

    // 1. ABRIR VENTANA INMEDIATAMENTE
    const nuevaVentana = window.open('', '_blank');

    // 2. DISEÑO DE LA PANTALLA DE CARGA
    // Usamos estilos en línea e inyectados porque esta ventana no ve tu styles.scss
    const htmlCarga = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <title>Procesando | ReclamaYa</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            margin: 0;
            padding: 20px;
            height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            background-color: #f8fafc; /* Fondo gris muy suave */
            font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            color: #1e293b; /* Texto oscuro */
            box-sizing: border-box;
          }
          
          .container {
            text-align: center;
            background: white;
            padding: 40px;
            border-radius: 20px;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);
            max-width: 400px;
            width: 100%;
            border: 1px solid #e2e8f0;
          }

          .spinner {
            width: 50px;
            height: 50px;
            border: 4px solid #e2e8f0;
            border-top: 4px solid #3b82f6; /* Tu color primario azul */
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px auto;
          }

          h2 {
            margin: 0 0 10px 0;
            font-size: 1.25rem;
            font-weight: 700;
          }

          p {
            margin: 0;
            color: #64748b;
            font-size: 0.95rem;
          }

          .brand {
            font-weight: 900;
            color: #0f172a;
            margin-bottom: 30px;
            display: block;
            font-size: 1.5rem;
            letter-spacing: -1px;
          }
          
          .brand span { color: #f59e0b; } /* Acento naranja */

          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="brand">Reclama<span>Ya</span>.</div>
          
          <div class="spinner"></div>
          
          <h2>Recuperando documento</h2>
          <p>Estamos validando el acceso y descargando el archivo del legajo...</p>
        </div>
      </body>
      </html>
    `;

    if (nuevaVentana) {
      nuevaVentana.document.write(htmlCarga);
      nuevaVentana.document.close(); // Importante para que el navegador deje de "cargar" el HTML estático
    }

    // 3. LLAMAR AL BACKEND
    this.reclamosService.getArchivoUrl(this.reclamo.id, tipo).subscribe({
      next: res => {
        if (nuevaVentana) {
          // Redirección final
          nuevaVentana.location.href = res.url;
        }
      },
      error: () => {
        if (nuevaVentana) {
          // Opcional: Mostrar error en la misma ventana en vez de cerrarla
          nuevaVentana.document.body.innerHTML = `
            <div style="display:flex;height:100vh;justify-content:center;align-items:center;font-family:sans-serif;text-align:center;">
              <div>
                <h2 style="color:#ef4444">Error</h2>
                <p>No se pudo recuperar el archivo.</p>
                <button onclick="window.close()" style="margin-top:20px;padding:10px 20px;cursor:pointer;">Cerrar</button>
              </div>
            </div>
          `;
        }
        this.notificacionService.showError('No se pudo abrir el archivo.');
      }
    });
  }

  contactarWhatsApp(): void {
    if (!this.reclamo?.telefono) {
      Swal.fire({
        title: 'Sin teléfono',
        text: 'Este usuario no tiene un número registrado.',
        icon: 'info',
        confirmButtonText: 'Entendido',
        buttonsStyling: false,
        customClass: {
          popup: 'mi-alert-popup',
          confirmButton: 'mi-alert-btn-confirm'
        }
      });
      return;
    }

    const telefono = this.reclamo.telefono.replace(/\D/g, '');
    const nombre = this.reclamo.nombre || 'Cliente';
    const codigo = this.reclamo.codigo_seguimiento || this.reclamo.id.slice(0, 8);

    const mensaje = `Hola ${nombre}, te contacto de ReclamaYa por tu trámite #${codigo}.`;
    window.open(
      `https://wa.me/549${telefono}?text=${encodeURIComponent(mensaje)}`,
      '_blank'
    );
  }

  volver(): void {
    this.location.back();
  }
}