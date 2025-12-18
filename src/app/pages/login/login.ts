import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { environment } from '../../../environments/environment';
// Componentes y Servicios
import { CardComponent } from '../../components/card/card';
import { NotificacionService } from '../../services/notificacion';
import { AuthService } from '../../services/auth.service'; 

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, CardComponent],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class LoginComponent {

  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private notificacionService = inject(NotificacionService);
  private router = inject(Router);
  private authService = inject(AuthService); 

  isLoading = false;

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  constructor() {}

  onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.notificacionService.showError('Formulario inválido');
      return;
    }

    this.isLoading = true;
    const url = `${environment.apiUrl}/auth/login`; 
    const credentials = this.loginForm.value;

    this.http.post(url, credentials).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        
        // 1. DELEGAMOS AL SERVICE EL GUARDADO DEL TOKEN
        this.authService.setSession(response.access_token);
        
        this.notificacionService.showSuccess('¡Bienvenido!');
        
        // 2. REDIRECCIÓN INTELIGENTE SEGÚN ROL
        if (this.authService.esAdmin) {
           console.log('👑 Usuario es Admin -> Dashboard');
           this.router.navigate(['/admin-dashboard']);
        } else {
           console.log('💼 Usuario es Productor -> Mis Referidos');
           this.router.navigate(['/mis-referidos']);
        }
      },
      error: (error: HttpErrorResponse) => {
        this.isLoading = false;
        if (error.status === 401) { 
          this.notificacionService.showError('Credenciales incorrectas');
        } else {
          this.notificacionService.showError('Error al conectar con el servidor');
        }
        console.error('Error en el login:', error.message);
      }
    });
  }
}