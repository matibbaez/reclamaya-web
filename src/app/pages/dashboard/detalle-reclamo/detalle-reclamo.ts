import { Component, inject, OnInit, computed, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import Swal from 'sweetalert2';

/* Lucide Icons */
import {
  LucideAngularModule, Eye, FileText, Camera, Shield, CreditCard,
  Car, AlertTriangle, Stethoscope, ChevronLeft, Calendar, MapPin, 
  Phone, Mail, CheckCircle2, AlertCircle, Clock, UserCog, UserPlus,
  Save, X, Check, File, Briefcase, HardHat, 
  Siren, Ambulance, Send
} from 'lucide-angular';

/* Services */
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

  // --- ICONOS ---
  readonly icons = { 
    Eye, FileText, Camera, Shield, CreditCard, Car, AlertTriangle, 
    Stethoscope, ChevronLeft, Calendar, MapPin, Phone, Mail, 
    Check: CheckCircle2, Alert: AlertCircle, Clock, 
    UserCog, UserPlus, Save, X, Tick: Check, File,
    Briefcase, HardHat,
    Siren, Ambulance, Send
  };

  private route = inject(ActivatedRoute);
  private location = inject(Location);
  private reclamosService = inject(ReclamosService);
  private usersService = inject(UsersService);
  private notificacionService = inject(NotificacionService);
  public authService = inject(AuthService);

  // --- VARIABLES DE OBSERVACIÓN (MENSAJES) ---
  observacionTexto = '';
  guardandoObservacion = false;

  // --- ESTADO (SIGNALS) ---
  reclamo = signal<IReclamo | null>(null);
  isLoading = signal(true);
  editandoTramitador = signal(false);
  
  archivosDisponibles: any[] = [];
  tramitadores: IUser[] = [];
  tramitadorSeleccionado = '';

  // --- TIMELINE ---
  pasosTimeline = [
    { id: 'Enviado', label: 'Enviado' },
    { id: 'Recepcionado', label: 'Recepcionado' },
    { id: 'Iniciado', label: 'Iniciado' },
    { id: 'Negociacion', label: 'Negociación' },
    { id: 'Indemnizando', label: 'Cobro' },
    { id: 'Indemnizado', label: 'Finalizado' }
  ];

  indiceProgreso = computed(() => {
    const r = this.reclamo();
    if (!r) return 0;
    if (r.estado === 'Rechazado') return -1;
    return this.pasosTimeline.findIndex(p => p.id === r.estado);
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.volver(); return; }

    this.cargarReclamo(id);
    if (this.authService.esAdmin) this.cargarTramitadores();
  }

  volver() {
    this.location.back();
  }

  private cargarReclamo(id: string): void {
    this.isLoading.set(true);
    this.reclamosService.getReclamoPorId(id)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (data) => {
          this.reclamo.set(data);
          this.syncDatos(data); // Sincronizamos datos y observaciones
          this.generarLegajo(data);
        },
        error: () => {
          this.notificacionService.showError('Error al recuperar el expediente.');
          this.volver();
        }
      });
  }

  // Sincroniza datos iniciales (Tramitador y Mensajes)
  private syncDatos(data: IReclamo): void {
    
    this.observacionTexto = ''; 
    
    // 2. Tramitador asignado
    if (data.tramitador) {
      this.tramitadorSeleccionado = data.tramitador.id;
    } else {
      this.tramitadorSeleccionado = '';
    }
    this.editandoTramitador.set(false);
  }

  private generarLegajo(r: IReclamo): void {
    const iconMap: Record<string, any> = {
      dni: CreditCard, licencia: Car, cedula: FileText, poliza: Shield,
      denuncia: AlertTriangle, fotos: Camera, medicos: Stethoscope,
      representacion: FileText, honorarios: FileText
    };

    const docs = [
      { key: 'dni', label: 'DNI', sub: 'Identidad', path: r.path_dni },
      { key: 'licencia', label: 'Licencia', sub: 'Conductor', path: r.path_licencia },
      { key: 'cedula', label: 'Cédula', sub: 'Vehículo', path: r.path_cedula },
      { key: 'poliza', label: 'Póliza', sub: 'Seguro', path: r.path_poliza },
      { key: 'denuncia', label: 'Denuncia', sub: 'Administrativa', path: r.path_denuncia },
      { key: 'fotos', label: 'Fotos', sub: 'Daños/Lugar', path: r.path_fotos, highlight: true },
      { key: 'medicos', label: 'Médicos', sub: 'Certificados', path: r.path_medicos, alert: true },
      
      // Nuevos campos
      { key: 'presupuesto', label: 'Presupuesto', sub: 'Reparación', path: r.path_presupuesto },
      { key: 'cbu', label: 'Comp. CBU', sub: 'Bancario', path: r.path_cbu_archivo },
      { key: 'legal', label: 'Denuncia Penal', sub: 'Judicial', path: r.path_denuncia_penal },

      { key: 'representacion', label: 'Poder', sub: 'Legal', path: r.path_representacion, highlight: true },
      { key: 'honorarios', label: 'Honorarios', sub: 'Convenio', path: r.path_honorarios }
    ];

    this.archivosDisponibles = docs.filter(d => d.path).map(d => ({
      ...d, icon: iconMap[d.key] || FileText
    }));
  }

  private cargarTramitadores(): void {
    this.usersService.getTramitadores().subscribe(u => this.tramitadores = u);
  }

  // --- LÓGICA DE TRAMITADOR ---
  activarEdicion() { this.editandoTramitador.set(true); }
  
  cancelarEdicion() {
    this.editandoTramitador.set(false);
    const r = this.reclamo();
    if (r?.tramitador) {
      this.tramitadorSeleccionado = r.tramitador.id;
    } else {
      this.tramitadorSeleccionado = '';
    }
  }

  asignarAbogado() {
    const r = this.reclamo();
    if (!r || !this.tramitadorSeleccionado) return;

    this.reclamosService.asignarTramitador(r.id, this.tramitadorSeleccionado).subscribe({
      next: res => {
        this.reclamo.set(res);
        this.editandoTramitador.set(false);
        this.notificacionService.showSuccess('Tramitador asignado.');
      },
      error: () => this.notificacionService.showError('Error al asignar.')
    });
  }

  // --- LÓGICA DE ESTADOS ---
  cambiarEstado(nuevoEstado: string) {
    const r = this.reclamo();
    if (!r || r.estado === nuevoEstado) return;

    Swal.fire({
      title: '¿Cambiar Estado?',
      text: `El trámite pasará a: ${nuevoEstado}`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, cambiar',
      confirmButtonColor: '#3b82f6',
      cancelButtonText: 'Cancelar'
    }).then(res => {
      if (res.isConfirmed) {
        const tramitadorActual = r.tramitador; 
        this.reclamosService.actualizarEstado(r.id, nuevoEstado).subscribe({
          next: (updated) => {
            if (!updated.tramitador && tramitadorActual) {
              updated.tramitador = tramitadorActual;
            }
            this.reclamo.set(updated);
            this.notificacionService.showSuccess(`Estado actualizado a ${nuevoEstado}`);
          },
          error: () => this.notificacionService.showError('Error al actualizar estado.')
        });
      }
    });
  }

  guardarObservacion() {
    const r = this.reclamo();
    if (!r || !this.observacionTexto.trim()) return;

    this.guardandoObservacion = true;
    
    // Usamos el NUEVO método agregarMensaje
    this.reclamosService.agregarMensaje(r.id, this.observacionTexto).subscribe({
      next: (res) => {
        this.guardandoObservacion = false;
        this.observacionTexto = ''; // Limpiamos el input
        
        // Mantenemos el tramitador visualmente
        const currentTramitador = r.tramitador;
        if (!res.tramitador && currentTramitador) res.tramitador = currentTramitador;
        
        this.reclamo.set(res); // Actualizamos la lista en pantalla
        // Scroll al fondo si quisieras (opcional)
      },
      error: () => {
        this.guardandoObservacion = false;
        this.notificacionService.showError('Error al enviar.');
      }
    });
  }

  // --- UTILIDADES ---
  contactarWhatsApp() {
    const r = this.reclamo();
    if (!r?.telefono) return;
    const tel = r.telefono.replace(/\D/g, '');
    const msg = `Hola ${r.nombre}, te contacto de ReclamaYa por el caso #${r.codigo_seguimiento}.`;
    window.open(`https://wa.me/549${tel}?text=${encodeURIComponent(msg)}`, '_blank');
  }

  verArchivo(tipo: string) {
    const r = this.reclamo();
    if (!r) return;
    
    const nuevaVentana = window.open('', '_blank');
    const htmlCarga = `
      <!DOCTYPE html><html lang="es"><head><title>Cargando...</title>
      <style>body{margin:0;height:100vh;display:flex;flex-direction:column;justify-content:center;align-items:center;background:#f8fafc;font-family:sans-serif;color:#1e293b}
      .spinner{width:40px;height:40px;border:4px solid #e2e8f0;border-top-color:#3b82f6;border-radius:50%;animation:s 1s infinite linear;margin-bottom:20px}
      @keyframes s{to{transform:rotate(360deg)}}</style></head>
      <body><div class="spinner"></div><p>Accediendo al documento...</p></body></html>`;
    
    if (nuevaVentana) { 
      nuevaVentana.document.write(htmlCarga); 
      nuevaVentana.document.close(); 
    }

    this.reclamosService.getArchivoUrl(r.id, tipo).subscribe({
      next: res => { if (nuevaVentana) nuevaVentana.location.href = res.url; },
      error: () => { 
        if (nuevaVentana) nuevaVentana.close();
        this.notificacionService.showError('No se pudo abrir el archivo.');
      }
    });
  }
}