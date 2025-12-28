import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReclamosService, IReclamo } from '../../services/reclamos.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.scss'
})
export class AdminDashboardComponent implements OnInit {

  private reclamosService = inject(ReclamosService);

  // --- VARIABLES DE ESTADO ---
  fechaHoy = new Date();
  isLoading = true;
  
  // Datos
  reclamosOriginales: IReclamo[] = []; // La "Base de datos" en memoria
  reclamosFiltrados: IReclamo[] = [];  // Lo que se ve en la tabla

  // Filtros Activos
  filtroTexto: string = '';
  filtroEstado: string = ''; 
  filtroRol: string = ''; 
  ordenDescendente = true;

  ngOnInit() {
    this.cargarDatos();
  }

  // 1. CARGA INICIAL (Trae todo para que los KPIs funcionen)
  cargarDatos() {
    this.isLoading = true;
    
    // Llamamos sin filtros al backend para tener la data completa
    this.reclamosService.findAll().subscribe({
      next: (data) => {
        this.reclamosOriginales = data as IReclamo[];
        this.aplicarFiltros(); // Aplica filtros iniciales (o ninguno)
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error cargando reclamos', err);
        this.isLoading = false;
      }
    });
  }

  // 2. MOTOR DE FILTRADO UNIFICADO
  aplicarFiltros() {
    let resultado = [...this.reclamosOriginales];

    // A. Filtro por Estado (Dropdown)
    if (this.filtroEstado) {
      resultado = resultado.filter(r => r.estado === this.filtroEstado);
    }

    // B. Filtro por Rol (Dropdown)
    if (this.filtroRol) {
      resultado = resultado.filter(r => r.rol_victima === this.filtroRol);
    }

    // C. Filtro por Texto (Buscador)
    if (this.filtroTexto) {
      const termino = this.filtroTexto.toLowerCase();
      resultado = resultado.filter(r => 
        r.nombre.toLowerCase().includes(termino) || 
        r.dni.toString().includes(termino) ||
        r.codigo_seguimiento.toLowerCase().includes(termino) ||
        (r.aseguradora_tercero && r.aseguradora_tercero.toLowerCase().includes(termino))
      );
    }

    // D. Ordenamiento
    resultado.sort((a, b) => {
      const fechaA = new Date(a.fecha_creacion).getTime();
      const fechaB = new Date(b.fecha_creacion).getTime();
      return this.ordenDescendente ? fechaB - fechaA : fechaA - fechaB;
    });

    this.reclamosFiltrados = resultado;
  }

  // --- EVENTOS DEL HTML ---

  // Buscador (Input text)
  filtrarGlobal(event: any) {
    this.filtroTexto = event.target.value;
    this.aplicarFiltros();
  }

  // Select de Estado
  cambiarEstado(event: any) {
    this.filtroEstado = event.target.value;
    this.aplicarFiltros();
  }

  // Select de Rol
  cambiarRol(event: any) {
    this.filtroRol = event.target.value;
    this.aplicarFiltros();
  }

  // Botón de Ordenar
  alternarOrden() {
    this.ordenDescendente = !this.ordenDescendente;
    this.aplicarFiltros();
  }

  // --- HELPERS PARA EL HTML ---

  // Cuenta totales para las tarjetas de arriba (KPIs)
  contarPorEstado(estado: string): number {
    // Usamos 'reclamosOriginales' para que el KPI no cambie si filtro la tabla
    return this.reclamosOriginales.filter(r => r.estado === estado).length;
  }
}