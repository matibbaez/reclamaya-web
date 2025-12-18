import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardComponent } from '../../components/card/card';
import { GestionarReclamoModalComponent } from '../../components/gestionar-reclamo-modal/gestionar-reclamo-modal';
import { ReclamosService, IReclamo } from '../../services/reclamos.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, CardComponent, RouterModule, GestionarReclamoModalComponent],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.scss'
})
export class AdminDashboardComponent implements OnInit {

  private reclamosService = inject(ReclamosService);

  ordenDescendente = true;
  reclamosOriginales: IReclamo[] = []; 
  reclamosFiltrados: IReclamo[] = [];  
  loading = true;

  filtroEstado: string = ''; 
  filtroRol: string = '';   

  reclamoSeleccionado: IReclamo | null = null;
  filtrosAbiertos = false;

  ngOnInit() {
    this.cargarDatos();
  }

  toggleFiltros() { this.filtrosAbiertos = !this.filtrosAbiertos; }
  alternarOrden() {
    this.ordenDescendente = !this.ordenDescendente;
    this.aplicarFiltrosLocales();
  }

  // 1. Carga desde Backend
  cargarDatos() {
    this.loading = true;
    
    // 👇 CORRECCIÓN: Si el string está vacío, mandamos undefined
    const filtro = this.filtroEstado || undefined;

    this.reclamosService.findAll(filtro).subscribe({
      next: (data) => {
        this.reclamosOriginales = data as IReclamo[];
        this.aplicarFiltrosLocales();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error cargando reclamos', err);
        // Si da 401, es probable que el token venció. Podrías redirigir al login.
        if (err.status === 401) {
             // Opcional: this.router.navigate(['/login']);
        }
        this.loading = false;
      }
    });
  }

  // 2. Filtro Local (Por Rol y Orden)
  aplicarFiltrosLocales() {
    let resultado = [...this.reclamosOriginales];

    if (this.filtroRol) {
      resultado = resultado.filter(r => r.rol_victima === this.filtroRol);
    }

    resultado.sort((a, b) => {
      const fechaA = new Date(a.fecha_creacion).getTime();
      const fechaB = new Date(b.fecha_creacion).getTime();
      return this.ordenDescendente ? fechaB - fechaA : fechaA - fechaB;
    });

    this.reclamosFiltrados = resultado;
  }

  cambiarEstado(event: any) {
    const nuevoEstado = event.target.value;
    this.filtroEstado = nuevoEstado;
    this.cargarDatos(); 
  }

  cambiarRol(event: any) {
    this.filtroRol = event.target.value;
    this.aplicarFiltrosLocales(); 
  }

  abrirModal(reclamo: IReclamo) { this.reclamoSeleccionado = reclamo; }
  cerrarModal() { this.reclamoSeleccionado = null; }

  guardarCambiosModal(nuevoEstado: string) {
    if (!this.reclamoSeleccionado) return;
    const id = this.reclamoSeleccionado.id;
    this.cerrarModal(); 
    
    this.reclamosService.update(id, { estado: nuevoEstado }).subscribe({
      next: () => this.cargarDatos(),
      error: (err) => console.error('Error actualizando', err)
    });
  }
}