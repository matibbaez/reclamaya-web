import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router'; 
import { jwtDecode } from 'jwt-decode';

/* Lucide Icons */
import { 
  LucideAngularModule, Users, FileText, CheckCircle2, 
  Clock, Share2, Copy, Search, ExternalLink, MessageCircle,
  Filter, ArrowUpDown
} from 'lucide-angular';

/* Servicios */
import { ReclamosService, IReclamo } from '../../../services/reclamos.service';
import { AuthService } from '../../../services/auth.service';
import { NotificacionService } from '../../../services/notificacion';
import { UsersService, IUser } from '../../../services/users.service'; 

@Component({
  selector: 'app-mis-referidos',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  templateUrl: './mis-referidos.html',
  styleUrls: ['./mis-referidos.scss']
})
export class MisReferidosComponent implements OnInit {

  private reclamosService = inject(ReclamosService);
  public authService = inject(AuthService); // Public para usar en HTML
  private notificacionService = inject(NotificacionService);
  private usersService = inject(UsersService); 

  // Iconos
  readonly icons = { 
    Users, FileText, CheckCircle2, Clock, Share2, Copy, 
    Search, ExternalLink, MessageCircle, Filter, ArrowUpDown 
  };

  productorId = '';

  // --- SIGNALS DE ESTADO ---
  isLoading = signal(true);
  reclamos = signal<IReclamo[]>([]);
  equipo = signal<IUser[]>([]);
  
  // --- FILTROS ---
  filtroBusqueda = signal('');
  filtroEstado = signal('');
  ordenDescendente = signal(true);

  // Links
  linkAsegurados = '';   
  linkProductores = ''; 

  // --- COMPUTED: FILTRADO Y ORDENAMIENTO ---
  reclamosFiltrados = computed(() => {
    let data = this.reclamos();
    const term = this.filtroBusqueda().toLowerCase();
    const estado = this.filtroEstado();
    const desc = this.ordenDescendente();

    // 1. Filtrar por Texto
    if (term) {
      data = data.filter(r => 
        r.nombre.toLowerCase().includes(term) || 
        r.dni.includes(term) ||
        r.codigo_seguimiento.toLowerCase().includes(term)
      );
    }

    // 2. Filtrar por Estado
    if (estado) {
      data = data.filter(r => r.estado === estado);
    }

    // 3. Ordenar por Fecha
    return data.sort((a, b) => {
      const dateA = new Date(a.fecha_creacion).getTime();
      const dateB = new Date(b.fecha_creacion).getTime();
      return desc ? dateB - dateA : dateA - dateB;
    });
  });

  // --- COMPUTED: KPIS ---
  stats = computed(() => {
    const data = this.reclamos();
    return {
      total: data.length,
      enGestion: data.filter(r => ['Recepcionado', 'Iniciado', 'Negociacion', 'Indemnizando'].includes(r.estado)).length,
      finalizados: data.filter(r => r.estado === 'Indemnizado').length
    };
  });

  // --- GETTER: ETIQUETA DE ROL ---
  get rolLabel(): string {
    if (this.authService.esTramitador) return 'Tramitador';
    if (this.authService.esOrganizador) return 'Broker';
    return 'Productor';
  }

  ngOnInit() {
    this.generarLinks();
    this.cargarDatos();
  }

  generarLinks() {
    const tokenRaw = localStorage.getItem('access_token');
    if (!tokenRaw) return;

    try {
      const decoded: any = jwtDecode(tokenRaw);
      const userId = decoded.id || decoded.sub; 

      if (userId) {
        this.productorId = userId; 

        const baseUrl = window.location.origin; 
        this.linkAsegurados = `${baseUrl}/iniciar-reclamo?ref=${userId}`;
        
        if (this.authService.esOrganizador) {
            this.linkProductores = `${baseUrl}/login?ref=${userId}`;
        }
      } 
    } catch (error) {
      console.error('Error decodificando token:', error);
    }
  }

  cargarDatos() {
    this.isLoading.set(true);
    // 1. Cargar Reclamos
    this.reclamosService.obtenerMisSiniestros().subscribe({
      next: (data) => {
        this.reclamos.set(data);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });

    // 2. Cargar Equipo (Solo si es Organizador)
    if (this.authService.esOrganizador) {
      this.usersService.obtenerMiEquipo().subscribe(u => this.equipo.set(u));
    }
  }

  // --- EVENTOS UI ---
  aplicarFiltro(event: Event) { this.filtroBusqueda.set((event.target as HTMLInputElement).value); }
  cambiarEstado(event: Event) { this.filtroEstado.set((event.target as HTMLSelectElement).value); }
  alternarOrden() { this.ordenDescendente.update(v => !v); }

  copiarLink(url: string) {
    navigator.clipboard.writeText(url).then(() => this.notificacionService.showSuccess('Link copiado!'));
  }
}