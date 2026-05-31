import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UsersService } from '../../services/users.service';
import { NotificacionService } from '../../services/notificacion';
import { AuthService } from '../../services/auth.service';
import { LucideAngularModule, Lock, ShieldCheck, User } from 'lucide-angular';

@Component({
  selector: 'app-mi-perfil',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './mi-perfil.html',
  styleUrls: ['./mi-perfil.scss']
})
export class MiPerfilComponent {
  private fb = inject(FormBuilder);
  private usersService = inject(UsersService);
  private notificacionService = inject(NotificacionService);
  public authService = inject(AuthService);

  readonly icons = { Lock, ShieldCheck, User };
  isLoading = false;

  passwordForm: FormGroup = this.fb.group({
    passwordActual: ['', Validators.required],
    passwordNueva: ['', [
      Validators.required, 
      Validators.minLength(8),
      // Esta expresión regular exige al menos 1 letra mayúscula y 1 número
      Validators.pattern(/^(?=.*[A-Z])(?=.*\d).*$/)
    ]]
  });

  cambiarPassword() {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const { passwordActual, passwordNueva } = this.passwordForm.value;

    this.usersService.cambiarMiPassword(passwordActual, passwordNueva).subscribe({
      next: () => {
        this.notificacionService.showSuccess('Contraseña actualizada con éxito.');
        this.passwordForm.reset();
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error(err);
        const msg = err.error?.message || 'Error al actualizar la contraseña.';
        this.notificacionService.showError(msg);
        this.isLoading = false;
      }
    });
  }
}