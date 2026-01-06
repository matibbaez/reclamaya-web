import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
// Importamos iconos para la UI
import { LucideAngularModule, CheckCircle, Clock, Users, FileText, LayoutDashboard } from 'lucide-angular';

// Servicios e Interfaces
import { ReclamosService, IReclamo } from '../../services/reclamos.service';
import { UsersService, IUser } from '../../services/users.service';
import { NotificacionService } from '../../services/notificacion';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.scss'
})
export class AdminDashboardComponent implements OnInit {

  private reclamosService = inject(ReclamosService);
  private usersService = inject(UsersService);
  private notificacionService = inject(NotificacionService);

  // --- VARIABLES DE ESTADO (SIGNALS) ---
  fechaHoy = new Date();
  isLoading = signal(true);
  
  // Control de Vistas (Tabs)
  vistaActual = signal<'reclamos' | 'usuarios'>('reclamos');

  // --- DATOS: RECLAMOS ---
  reclamos = signal<IReclamo[]>([]);
  filtroTexto = signal('');
  filtroEstado = signal('');
  filtroRol = signal('');
  ordenDescendente = signal(true);

  // --- DATOS: USUARIOS PENDIENTES ---
  usuariosPendientes = signal<IUser[]>([]);

  // --- ICONOS ---
  icons = {
    check: CheckCircle,
    clock: Clock,
    users: Users,
    file: FileText,
    dashboard: LayoutDashboard
  };

  // --- LÓGICA REACTIVA (COMPUTED) ---
  
  // 1. Filtrado y Ordenamiento de Reclamos
  reclamosFiltrados = computed(() => {
    const rawData = this.reclamos();
    const texto = this.filtroTexto().toLowerCase();
    const estado = this.filtroEstado();
    const rol = this.filtroRol();
    const descendente = this.ordenDescendente();

    return rawData
      .filter(r => {
        const matchEstado = estado ? r.estado === estado : true;
        const matchRol = rol ? r.rol_victima === rol : true;
        const matchTexto = texto 
          ? (r.nombre.toLowerCase().includes(texto) || 
             r.dni.toString().includes(texto) ||
             r.codigo_seguimiento.toLowerCase().includes(texto) ||
             (r.aseguradora_tercero && r.aseguradora_tercero.toLowerCase().includes(texto)))
          : true;
        
        return matchEstado && matchRol && matchTexto;
      })
      .sort((a, b) => {
        const fechaA = new Date(a.fecha_creacion).getTime();
        const fechaB = new Date(b.fecha_creacion).getTime();
        return descendente ? fechaB - fechaA : fechaA - fechaB;
      });
  });

  // 2. Métricas KPI (Incluye contador de solicitudes)
  kpis = computed(() => {
    const data = this.reclamos();
    const solicitudes = this.usuariosPendientes().length;
    
    return {
      total: data.length,
      // "Gestión Activa": todo lo que no sea nuevo ni finalizado
      gestionActiva: data.filter(r => 
        ['Recepcionado', 'Iniciado', 'Negociacion', 'Indemnizando'].includes(r.estado)
      ).length,
      // Finalizados Éxito
      finalizados: data.filter(r => r.estado === 'Indemnizado').length,
      // Solicitudes de acceso pendientes
      pendientes: solicitudes
    };
  });

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos() {
    this.isLoading.set(true);
    
    // Carga paralela de Reclamos y Usuarios
    const p1 = new Promise<void>((resolve) => {
      this.reclamosService.findAll().subscribe({
        next: (data) => {
          this.reclamos.set(data as IReclamo[]);
          resolve();
        },
        error: (err) => {
          console.error('Error cargando reclamos', err);
          resolve();
        }
      });
    });

    const p2 = new Promise<void>((resolve) => {
      this.usersService.getPendientes().subscribe({
        next: (data) => {
          this.usuariosPendientes.set(data);
          resolve();
        },
        error: (err) => {
          console.error('Error cargando usuarios', err);
          resolve();
        }
      });
    });

    // Cuando ambos terminen, quitamos el loading
    Promise.all([p1, p2]).then(() => this.isLoading.set(false));
  }

  // --- ACCIONES DE USUARIOS ---

  aprobarUsuario(user: IUser) {
    if (!confirm(`¿Confirmas la aprobación de acceso para ${user.nombre}?`)) return;

    this.usersService.aprobarUsuario(user.id).subscribe({
      next: () => {
        this.notificacionService.showSuccess(`Usuario ${user.nombre} aprobado.`);
        // Recargar solo la lista de pendientes
        this.usersService.getPendientes().subscribe(data => this.usuariosPendientes.set(data));
      },
      error: () => this.notificacionService.showError('Error al aprobar el usuario.')
    });
  }

  // --- EVENTOS DEL HTML ---

  cambiarVista(vista: 'reclamos' | 'usuarios') {
    this.vistaActual.set(vista);
  }

  filtrarGlobal(event: Event) {
    const valor = (event.target as HTMLInputElement).value;
    this.filtroTexto.set(valor);
  }

  cambiarEstado(event: Event) {
    const valor = (event.target as HTMLSelectElement).value;
    this.filtroEstado.set(valor);
  }

  cambiarRol(event: Event) {
    const valor = (event.target as HTMLSelectElement).value;
    this.filtroRol.set(valor);
  }

  alternarOrden() {
    this.ordenDescendente.update(val => !val);
  }
}