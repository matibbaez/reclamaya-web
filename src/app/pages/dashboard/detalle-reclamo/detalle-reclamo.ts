import { Component, inject, OnInit, computed, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { NgOptimizedImage } from '@angular/common';
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
  imports: [CommonModule, NgOptimizedImage, FormsModule, LucideAngularModule],
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

  // --- VARIABLES DE MENSAJES ---
  tabActual: 'publico' | 'interno' = 'publico'; 
  notaInternaTexto = ''; 
  guardandoNotaInterna = false;

  observacionTexto = '';
  guardandoObservacion = false;

  // --- ESTADO (SIGNALS) ---
  reclamo = signal<IReclamo | null>(null);
  isLoading = signal(true);
  editandoTramitador = signal(false);
  
  archivosDisponibles: any[] = [];
  tramitadores: IUser[] = [];
  tramitadorSeleccionado = '';

  galeriaFotos: string[] = [];
  cargandoFotos = false;

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

  cambiarTab(tab: 'publico' | 'interno') {
    this.tabActual = tab;
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
          this.syncDatos(data); 
          this.generarLegajo(data);

          if (data.path_fotos && data.path_fotos.length > 0) {
           this.cargarGaleria(data.id);
          }
        },
        error: () => {
          this.notificacionService.showError('Error al recuperar el expediente.');
          this.volver();
        }
      });
  }

  cargarGaleria(id: string) {
    this.cargandoFotos = true;
    this.reclamosService.obtenerGaleria(id).subscribe({
      next: (res) => {
        this.galeriaFotos = res.urls;
        this.cargandoFotos = false;
      },
      error: () => {
        this.cargandoFotos = false;
        console.error('Error cargando galería');
      }
    });
  }

  private syncDatos(data: IReclamo): void {
    this.observacionTexto = ''; 
    if (data.tramitador) {
      this.tramitadorSeleccionado = data.tramitador.id;
    } else {
      this.tramitadorSeleccionado = '';
    }
    this.editandoTramitador.set(false);
  }

  // --- GENERACIÓN DEL LEGAJO DIGITAL (CORREGIDO) ---
  private generarLegajo(r: IReclamo): void {
    const iconMap: Record<string, any> = {
      dni: CreditCard, licencia: Car, cedula: FileText, poliza: Shield,
      denuncia: AlertTriangle, fotos: Camera, medicos: Stethoscope,
      representacion: FileText, honorarios: FileText, 
      presupuesto: FileText, cbu: CreditCard, legal: Shield, complementaria: FileText
    };

    // MAPEO DE PROPIEDADES ESPECIALES (IMPORTANTE)
    // Relaciona la "key" del array con el nombre real de la propiedad en IReclamo
    const propertyMap: Record<string, string> = {
        'cbu': 'path_cbu_archivo',
        'legal': 'path_denuncia_penal'
    };

    const esNoSeguro = r.tiene_seguro === false;
    const etiquetaPoliza = esNoSeguro ? 'Carta No Seguro' : 'Póliza';
    const subPoliza = esNoSeguro ? 'Declaración Jurada' : 'Seguro Vigente';

    const definiciones = [
      { key: 'dni', label: 'DNI', sub: 'Identidad' },
      { key: 'licencia', label: 'Licencia', sub: 'Conductor' },
      { key: 'cedula', label: 'Cédula', sub: 'Vehículo' },
      
      { key: 'poliza', label: etiquetaPoliza, sub: subPoliza },
      { key: 'denuncia', label: 'Denuncia', sub: 'Administrativa' },
      { key: 'presupuesto', label: 'Presupuesto', sub: 'Reparación' },
      { key: 'medicos', label: 'Médicos', sub: 'Certificados', alert: true },
      { key: 'cbu', label: 'Comp. CBU', sub: 'Bancario' },
      { key: 'legal', label: 'Denuncia Penal', sub: 'Judicial' },
      { key: 'complementaria', label: 'Doc. Extra', sub: 'Adicional' },

      { key: 'representacion', label: 'Poder', sub: 'Legal', highlight: true },
      { key: 'honorarios', label: 'Honorarios', sub: 'Convenio' }
    ];

    this.archivosDisponibles = [];

    definiciones.forEach(def => {
       // CORRECCIÓN AQUÍ: Usamos el mapa o el default 'path_' + key
       const propName = propertyMap[def.key] || ('path_' + def.key);
       
       // @ts-ignore
       const rawValue = r[propName];

       if (!rawValue) return; 

       // CASO 1: ARRAY DE ARCHIVOS
       if (Array.isArray(rawValue)) {
          rawValue.forEach((pathItem, index) => {
             this.archivosDisponibles.push({
                key: def.key,  // Para la API usamos la key original (ej: 'cbu')
                label: `${def.label} (${index + 1})`,
                sub: def.sub,
                path: pathItem,
                isMultiple: true,
                index: index,     // Índice para descargar el correcto
                icon: (def.key === 'poliza' && esNoSeguro) ? FileText : (iconMap[def.key] || FileText),
                highlight: def.highlight,
                alert: def.alert
             });
          });
       } 
       // CASO 2: STRING ÚNICO
       else if (typeof rawValue === 'string') {
          this.archivosDisponibles.push({
             ...def,
             path: rawValue,
             isMultiple: false,
             icon: (def.key === 'poliza' && esNoSeguro) ? FileText : (iconMap[def.key] || FileText)
          });
       }
    });
  }

  private cargarTramitadores(): void {
    this.usersService.getTramitadores().subscribe(u => this.tramitadores = u);
  }

  abrirFoto(url: string) {
    window.open(url, '_blank');
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

  guardarNotaInterna() {
    const r = this.reclamo();
    if (!r || !this.notaInternaTexto.trim()) return;

    this.guardandoNotaInterna = true;
    
    this.reclamosService.agregarNotaInterna(r.id, this.notaInternaTexto).subscribe({
      next: (res) => {
        this.guardandoNotaInterna = false;
        this.notaInternaTexto = ''; 
        const currentTramitador = r.tramitador;
        if (!res.tramitador && currentTramitador) res.tramitador = currentTramitador;
        this.reclamo.set(res);
        this.notificacionService.showSuccess('Nota interna guardada.');
      },
      error: () => {
        this.guardandoNotaInterna = false;
        this.notificacionService.showError('Error al guardar nota.');
      }
    });
  }

  guardarObservacion() {
    const r = this.reclamo();
    if (!r || !this.observacionTexto.trim()) return;

    this.guardandoObservacion = true;
    
    this.reclamosService.agregarMensaje(r.id, this.observacionTexto).subscribe({
      next: (res) => {
        this.guardandoObservacion = false;
        this.observacionTexto = ''; 
        const currentTramitador = r.tramitador;
        if (!res.tramitador && currentTramitador) res.tramitador = currentTramitador;
        this.reclamo.set(res); 
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

  verArchivo(doc: any) {
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

    // Al backend le mandamos la "KEY" original ('cbu', 'legal', etc) para que el mapaColumnas funcione
    // Pero pasamos el index si es múltiple
    this.reclamosService.getArchivoUrl(r.id, doc.key, doc.index).subscribe({
      next: res => { 
        if (nuevaVentana) nuevaVentana.location.href = res.url; 
      },
      error: () => { 
        if (nuevaVentana) nuevaVentana.close();
        this.notificacionService.showError('No se pudo abrir el archivo.');
      }
    });
  }
}