import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UsuariosService, User } from '../../services/usuarios.service';
import { NotificacionService } from '../../services/notificacion';

@Component({
  selector: 'app-mi-equipo',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './mi-equipo.html',
  styleUrls: ['./mi-equipo.scss']
})
export class MiEquipoComponent implements OnInit {

  private usuariosService = inject(UsuariosService);
  private notificacionService = inject(NotificacionService);
  private fb = inject(FormBuilder);

  listaUsuarios: User[] = [];
  isLoading = true;
  mostrarFormulario = false; 

  // Formulario de Alta
  userForm: FormGroup = this.fb.group({
    nombre: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    dni: [''],
    telefono: [''],
    matricula: [''], // Importante para Productores
    role: ['Productor', Validators.required] // Por defecto Productor
  });

  ngOnInit() {
    this.cargarUsuarios();
  }

  cargarUsuarios() {
    this.isLoading = true;
    this.usuariosService.getUsuarios().subscribe({
      next: (data) => {
        this.listaUsuarios = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
        this.notificacionService.showError('Error al cargar usuarios.');
      }
    });
  }

  toggleFormulario() {
    this.mostrarFormulario = !this.mostrarFormulario;
  }

  onSubmit() {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    this.usuariosService.crearUsuario(this.userForm.value).subscribe({
      next: (nuevoUser) => {
        this.notificacionService.showSuccess(`Usuario ${nuevoUser.nombre} creado!`);
        this.listaUsuarios.push(nuevoUser); // Lo agrego a la tabla visualmente
        this.mostrarFormulario = false;
        this.userForm.reset({ role: 'Productor' }); // Reseteo form
      },
      error: (err) => {
        console.error(err);
        this.notificacionService.showError('Error al crear usuario. El email podría estar en uso.');
      }
    });
  }
}