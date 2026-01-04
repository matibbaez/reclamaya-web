import { Component, inject, OnInit, signal, computed } from '@angular/core';
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

  // --- VARIABLES DE ESTADO (SIGNALS) ---
  fechaHoy = new Date();
  isLoading = signal(true);
  
  // Fuente de verdad
  reclamos = signal<IReclamo[]>([]);

  // Filtros (Signals reactivos)
  filtroTexto = signal('');
  filtroEstado = signal('');
  filtroRol = signal('');
  ordenDescendente = signal(true);

  // --- LÓGICA REACTIVA (COMPUTED) ---
  
  // 1. Filtrado y Ordenamiento automático
  // Se recalcula SOLO si cambia 'reclamos' o algún filtro
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

  // 2. Métricas KPI (Cálculo optimizado)
  // Calculamos esto una sola vez basado en la data original, no en la vista
  kpis = computed(() => {
    const data = this.reclamos();
    return {
      total: data.length,
      // Ahora "Gestión Activa" abarca todo lo que no sea nuevo ni finalizado
      gestionActiva: data.filter(r => 
        ['Recepcionado', 'Iniciado', 'Negociacion', 'Indemnizando'].includes(r.estado)
      ).length,
      // Finalizados Éxito
      finalizados: data.filter(r => r.estado === 'Indemnizado').length
    };
  });

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos() {
    this.isLoading.set(true);
    
    this.reclamosService.findAll().subscribe({
      next: (data) => {
        this.reclamos.set(data as IReclamo[]);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error cargando reclamos', err);
        this.isLoading.set(false);
      }
    });
  }

  // --- EVENTOS DEL HTML (Setters simples) ---

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