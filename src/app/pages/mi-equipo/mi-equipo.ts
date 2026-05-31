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
  public authService = inject(AuthService); 
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

// Formulario de Alta en mi-equipo.ts
  userForm: FormGroup = this.fb.group({
    nombre: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    // 👇 Validaciones estrictas agregadas acá
    password: ['', [
      Validators.required, 
      Validators.minLength(8),
      Validators.pattern(/^(?=.*[A-Z])(?=.*\d).*$/)
    ]],
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
    
    this.usersService.getAll().subscribe({
      next: (data) => {
        // 👇 FILTRADO CRÍTICO: Excluimos a los administradores de la vista de gestión
        const usuariosNoAdmins = data.filter(u => u.role !== 'Admin' && u.role !== 'ADMIN');

        // Separamos Activos vs Pendientes solo de los que NO son admins
        this.listaUsuarios = usuariosNoAdmins.filter(u => u.isApproved);
        this.listaPendientes = usuariosNoAdmins.filter(u => !u.isApproved);
        
        this.isLoading = false;
      },
      error: (err: any) => {
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
        
        // Si el admin crea a alguien, lo sumamos a la lista local si no es admin
        if (nuevoUser.role !== 'Admin' && nuevoUser.role !== 'ADMIN') {
          this.listaUsuarios.push({ ...nuevoUser, isApproved: true }); 
        }
        
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
      confirmButtonColor: '#10b981',
      customClass: {
        popup: 'premium-modal-popup-mobile',
        actions: 'modal-actions-mobile',
        confirmButton: 'btn-confirm-mobile',
        cancelButton: 'btn-cancel-mobile'
      }
    }).then((res) => {
      if (res.isConfirmed) {
        this.usersService.aprobarUsuario(user.id).subscribe({
          next: () => {
            this.listaPendientes = this.listaPendientes.filter(u => u.id !== user.id);
            this.listaUsuarios.push({ ...user, isApproved: true });
            this.notificacionService.showSuccess('Usuario aprobado correctamente.');
          },
          error: () => this.notificacionService.showError('Error al aprobar.')
        });
      }
    });
  }

  actualizarRol(usuario: IUser, event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    const nuevoRol = selectElement.value;
    const rolAnterior = usuario.role;

    Swal.fire({
      title: '¿Cambiar privilegios?',
      html: `
        <p style="margin-bottom: 14px; color: #334155;">
          Está por asignar el rol de <strong>${nuevoRol}</strong> a <strong>${usuario.nombre}</strong>.
        </p>
        <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 12px; border-radius: 6px; text-align: left;">
          <span style="color: #b91c1c; font-weight: 800; font-size: 0.85rem; display: block; margin-bottom: 4px;">
            IMPORTANTE: RIESGO DE DESVINCULACIÓN
          </span>
          <span style="color: #7f1d1d; font-size: 0.85rem; line-height: 1.4; display: block;">
            Modificar el rol de un Organizador o Productor puede alterar irreversiblemente su acceso y la visibilidad de los casos registrados.
          </span>
        </div>
      `,
      icon: 'warning',
      width: '90%',
      showCancelButton: true,
      confirmButtonText: 'Confirmar Cambio',
      cancelButtonText: 'Cancelar',
      buttonsStyling: false,
      customClass: {
        popup: 'premium-modal-popup-mobile',
        actions: 'modal-actions-mobile',
        confirmButton: 'btn-confirm-mobile',
        cancelButton: 'btn-cancel-mobile'
      }
    }).then((res) => {
      if (res.isConfirmed) {
        this.usersService.cambiarRol(usuario.id, nuevoRol).subscribe({
          next: () => {
            this.listaUsuarios = this.listaUsuarios.map(u => 
              u.id === usuario.id ? { ...u, role: nuevoRol } : u
            );
            this.listaPendientes = this.listaPendientes.map(u => 
              u.id === usuario.id ? { ...u, role: nuevoRol } : u
            );
            this.notificacionService.showSuccess('Rol actualizado correctamente.');
          },
          error: (err: any) => {
            console.error(err);
            this.notificacionService.showError('Error al cambiar el rol.');
            selectElement.value = rolAnterior;
          }
        });
      } else {
        selectElement.value = rolAnterior;
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
      confirmButtonColor: '#ef4444',
      customClass: {
        popup: 'premium-modal-popup-mobile',
        actions: 'modal-actions-mobile',
        confirmButton: 'btn-confirm-mobile',
        cancelButton: 'btn-cancel-mobile'
      }
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
    const link = `${window.location.origin}/login?ref=${user.id}`;
    navigator.clipboard.writeText(link).then(() => {
      this.notificacionService.showSuccess('Enlace copiado al portapapeles');
    });
  }
}