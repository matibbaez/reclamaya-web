import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UsersService, IUser } from '../../services/users.service';
import { NotificacionService } from '../../services/notificacion';

@Component({
  selector: 'app-mi-equipo',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './mi-equipo.html',
  styleUrls: ['./mi-equipo.scss']
})
export class MiEquipoComponent implements OnInit {

  // 👇 CORRECCIÓN 2: Inyectamos el servicio correcto
  private usersService = inject(UsersService);
  private notificacionService = inject(NotificacionService);
  private fb = inject(FormBuilder);

  listaUsuarios: IUser[] = [];
  isLoading = true;
  mostrarFormulario = false; 

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
    this.cargarUsuarios();
  }

  cargarUsuarios() {
    this.isLoading = true;
    // 👇 CORRECCIÓN 3: Usamos getAll() (sin filtro trae todos, o podrías filtrar)
    this.usersService.getAll().subscribe({
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

    // 👇 CORRECCIÓN 4: Usamos create()
    this.usersService.create(this.userForm.value).subscribe({
      next: (nuevoUser) => {
        this.notificacionService.showSuccess(`Usuario ${nuevoUser.nombre} creado!`);
        this.listaUsuarios.push(nuevoUser); // Agregamos a la tabla
        this.mostrarFormulario = false;
        this.userForm.reset({ role: 'Productor' }); // Reseteamos y dejamos rol por defecto
      },
      error: (err) => {
        console.error(err);
        this.notificacionService.showError('Error al crear. Posiblemente el email ya existe.');
      }
    });
  }
}