import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { LucideAngularModule, Users, FileText, TrendingUp, ArrowRight, AlertCircle, Search, ArrowUpDown, Filter,} from 'lucide-angular';

import { ReclamosService, IReclamo } from '../../services/reclamos.service';
import { UsersService } from '../../services/users.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  templateUrl: './admin-dashboard.html',
  styleUrls: ['./admin-dashboard.scss']
})
export class AdminDashboardComponent implements OnInit {

  private reclamosService = inject(ReclamosService);
  private usersService = inject(UsersService);
  public authService = inject(AuthService);
  private router = inject(Router);

  // Iconos
  readonly icons = { Users, FileText, TrendingUp, ArrowRight, AlertCircle, Search, Filter, arrowUp: ArrowUpDown };
 
  ordenDescendente = signal(true);

  // Estado UI
  isLoading = signal(true);
  fechaHoy = new Date();

  // --- FILTROS Y BÚSQUEDA ---
  filtroTexto = signal('');
  filtroEstado = signal('');
  filtroRol = signal('');

  // Datos Crudos
  private reclamos = signal<IReclamo[]>([]);
  private usuariosTotal = signal(0);
  private usuariosPendientes = signal(0);

  // --- LÓGICA COMPUTADA ---

  // 1. KPI Metrics
  stats = computed(() => {
    const total = this.reclamos().length;
    const nuevos = this.reclamos().filter(r => ['Enviado', 'Recepcionado'].includes(r.estado)).length;
    
    return {
      reclamosTotales: total,
      reclamosNuevos: nuevos,
      usuariosTotales: this.usuariosTotal(),
      pendientesAprobacion: this.usuariosPendientes()
    };
  });

  // 2. LISTA FILTRADA (El corazón de la gestión)
  reclamosFiltrados = computed(() => {
    const data = this.reclamos();
    const txt = this.filtroTexto().toLowerCase();
    const estado = this.filtroEstado();
    const rol = this.filtroRol();

    return data
      .filter(r => {
        const matchesText = txt 
          ? (r.nombre.toLowerCase().includes(txt) || 
             r.dni.includes(txt) || 
             r.codigo_seguimiento.toLowerCase().includes(txt))
          : true;
        
        const matchesEstado = estado ? r.estado === estado : true;
        const matchesRol = rol ? r.rol_victima === rol : true;

        return matchesText && matchesEstado && matchesRol;
      })
      .sort((a, b) => {
        const fechaA = new Date(a.fecha_creacion).getTime();
        const fechaB = new Date(b.fecha_creacion).getTime();
        return this.ordenDescendente() ? fechaB - fechaA : fechaA - fechaB;
      });
  });

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos() {
    this.isLoading.set(true);

    const p1 = new Promise<void>((resolve) => {
      this.reclamosService.findAll().subscribe({
        next: (data) => {
          this.reclamos.set(data as IReclamo[]);
          resolve();
        },
        error: () => resolve()
      });
    });

    const p2 = new Promise<void>((resolve) => {
      this.usersService.getAll().subscribe({
        next: (users) => {
          this.usuariosTotal.set(users.length);
          this.usuariosPendientes.set(users.filter(u => !u.isApproved).length);
          resolve();
        },
        error: () => resolve()
      });
    });

    Promise.all([p1, p2]).then(() => this.isLoading.set(false));
  }

  // --- ACCIONES ---
  alternarOrden() {
    this.ordenDescendente.update(val => !val);
  }
  irAEquipo() { this.router.navigate(['/mi-equipo']); }
  verDetalle(id: string) { this.router.navigate(['/reclamo', id]); }

  // --- EVENTOS FILTROS ---
  aplicarBusqueda(e: Event) { this.filtroTexto.set((e.target as HTMLInputElement).value); }
  cambiarEstado(e: Event) { this.filtroEstado.set((e.target as HTMLSelectElement).value); }
  cambiarRol(e: Event) { this.filtroRol.set((e.target as HTMLSelectElement).value); }
}