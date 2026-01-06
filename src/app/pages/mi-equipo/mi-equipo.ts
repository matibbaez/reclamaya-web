import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { UsersService, IUser } from '../../services/users.service';
import { NotificacionService } from '../../services/notificacion';
import { AuthService } from '../../services/auth.service';
import Swal from 'sweetalert2';

// Iconos Lucide
import { LucideAngularModule, Search, UserPlus, Trash2, CheckCircle, Users, Clock, Copy, MoreVertical } from 'lucide-angular';

@Component({
  selector: 'app-mi-equipo',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, LucideAngularModule],
  templateUrl: './mi-equipo.html',
  styleUrls: ['./mi-equipo.scss']
})
export class MiEquipoComponent implements OnInit {

  private usersService = inject(UsersService);
  private notificacionService = inject(NotificacionService);
  public authService = inject(AuthService); // Para saber si soy admin
  private fb = inject(FormBuilder);

  // Iconos
  readonly icons = { Search, UserPlus, Trash2, CheckCircle, Users, Clock, Copy, MoreVertical };

  // Datos
  listaUsuarios: IUser[] = [];
  listaPendientes: IUser[] = [];
  
  // Estado UI
  isLoading = true;
  mostrarFormulario = false;
  activeTab: 'activos' | 'pendientes' = 'activos';
  searchTerm = '';

  // Formulario de Alta
  userForm: FormGroup = this.fb.group({
    nombre: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    dni: [''],
    telefono: [''],
    matricula: [''], 
    role: ['Productor', Validators.required]
  });

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos() {
    this.isLoading = true;
    
    // 1. Cargamos TODOS los usuarios (luego filtramos en memoria para optimizar)
    this.usersService.getAll().subscribe({
      next: (data) => {
        // Separamos Activos vs Pendientes
        this.listaUsuarios = data.filter(u => u.isApproved);
        this.listaPendientes = data.filter(u => !u.isApproved);
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
        this.notificacionService.showError('Error al cargar datos.');
      }
    });
  }

  // --- GETTERS PARA FILTRADO ---
  get usuariosFiltrados() {
    return this.listaUsuarios.filter(u => 
      u.nombre.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  get pendientesFiltrados() {
    return this.listaPendientes.filter(u => 
      u.nombre.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  // --- ACCIONES ---
  toggleFormulario() { this.mostrarFormulario = !this.mostrarFormulario; }
  cambiarTab(tab: 'activos' | 'pendientes') { this.activeTab = tab; }

  onSubmit() {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    this.usersService.create(this.userForm.value).subscribe({
      next: (nuevoUser) => {
        this.notificacionService.showSuccess(`Usuario ${nuevoUser.nombre} creado!`);
        
        // Lo agregamos a la lista correcta según si nace aprobado o no (usualmente backend decide)
        // Asumimos que si lo crea un admin, ya está aprobado, o lo metemos en activos.
        this.listaUsuarios.push({ ...nuevoUser, isApproved: true }); 
        
        this.mostrarFormulario = false;
        this.userForm.reset({ role: 'Productor' });
      },
      error: () => this.notificacionService.showError('Error al crear usuario.')
    });
  }

  aprobarUsuario(user: IUser) {
    Swal.fire({
      title: '¿Aprobar Acceso?',
      text: `Darás acceso a ${user.nombre} al sistema.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, Aprobar',
      confirmButtonColor: '#10b981'
    }).then((res) => {
      if (res.isConfirmed) {
        this.usersService.aprobarUsuario(user.id).subscribe({
          next: () => {
            // Mover de pendientes a activos visualmente
            this.listaPendientes = this.listaPendientes.filter(u => u.id !== user.id);
            this.listaUsuarios.push({ ...user, isApproved: true });
            this.notificacionService.showSuccess('Usuario aprobado correctamente.');
          },
          error: () => this.notificacionService.showError('Error al aprobar.')
        });
      }
    });
  }

  eliminarUsuario(user: IUser) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: `Eliminarás a ${user.nombre} permanentemente.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      confirmButtonColor: '#ef4444'
    }).then((res) => {
      if (res.isConfirmed) {
        this.usersService.delete(user.id).subscribe({
          next: () => {
            this.listaUsuarios = this.listaUsuarios.filter(u => u.id !== user.id);
            this.listaPendientes = this.listaPendientes.filter(u => u.id !== user.id);
            this.notificacionService.showSuccess('Usuario eliminado.');
          },
          error: () => this.notificacionService.showError('No se pudo eliminar.')
        });
      }
    });
  }

  copiarLinkInvitacion(user: IUser) {
    // Generamos link basado en el ID del usuario como referido
    const link = `${window.location.origin}/login?ref=${user.id}`;
    navigator.clipboard.writeText(link).then(() => {
      this.notificacionService.showSuccess('Enlace copiado al portapapeles');
    });
  }
}