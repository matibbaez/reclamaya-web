import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { NotificacionService } from '../../services/notificacion';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class LoginComponent implements OnInit {

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private notificacionService = inject(NotificacionService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  isRegisterMode = false;
  isLoading = false;
  referralCode: string | null = null; 

  // --- VALIDACIONES CUSTOM (REGEX) ---
  // DNI: Solo números, entre 7 y 8 caracteres
  private dniPattern = /^[0-9]{7,8}$/;
  
  // PASSWORD: Min 8, 1 Mayúscula, 1 Minúscula, 1 Número
  private passwordPattern = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/;

  // NOMBRE: Solo letras y espacios (no números ni símbolos raros)
  private nombrePattern = /^[a-zA-ZñÑáéíóúÁÉÍÓÚ\s]+$/;

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]], // Validación base, se refuerza en registro
    nombre: [''], 
    dni: [''],
    telefono: [''],
    matricula: [''] 
  });

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const ref = params['ref'];
      if (ref) {
        this.referralCode = ref;
        this.isRegisterMode = true; 
        this.actualizarValidaciones(); 
        this.notificacionService.showSuccess('Código de invitación aplicado.');
      }
    });
  }

  toggleMode() {
    this.isRegisterMode = !this.isRegisterMode;
    this.actualizarValidaciones();
  }

  // --- EL CEREBRO DE LAS VALIDACIONES ---
  actualizarValidaciones() {
    const c = this.loginForm.controls;
    
    if (this.isRegisterMode) {
      // 1. NOMBRE: Required, Min 3, Solo Letras, No espacios vacíos
      c.nombre.setValidators([
        Validators.required, 
        Validators.minLength(3), 
        Validators.pattern(this.nombrePattern),
        this.noWhitespaceValidator // <--- Custom
      ]);

      // 2. DNI: Required, Regex 7-8 números
      c.dni.setValidators([
        Validators.required, 
        Validators.pattern(this.dniPattern)
      ]);

      // 3. TELÉFONO: Required
      c.telefono.setValidators([Validators.required]);

      // 4. PASSWORD (MODO REGISTRO): Más estricta
      c.password.setValidators([
        Validators.required,
        Validators.pattern(this.passwordPattern)
      ]);

    } else {
      // MODO LOGIN: Relajamos validaciones (solo required)
      c.nombre.clearValidators();
      c.dni.clearValidators();
      c.telefono.clearValidators();
      
      // En Login solo pedimos que no esté vacía (no validamos complejidad para no dar pistas)
      c.password.setValidators([Validators.required]);
    }

    // Actualizamos el estado de los inputs para que Angular se entere
    c.nombre.updateValueAndValidity();
    c.dni.updateValueAndValidity();
    c.telefono.updateValueAndValidity();
    c.password.updateValueAndValidity();
  }

  // Validador Custom: Evita que pongan "   " (solo espacios)
  noWhitespaceValidator(control: AbstractControl): ValidationErrors | null {
    const isWhitespace = (control.value || '').trim().length === 0;
    const isValid = !isWhitespace;
    return isValid ? null : { 'whitespace': true };
  }

  // --- GETTERS PARA EL HTML (Para no escribir chorizo de código en el template) ---
  get f() { return this.loginForm.controls; }

  onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched(); // Esto hace que todos los errores salten rojos de una
      this.notificacionService.showError('Por favor revisá los datos ingresados.');
      return;
    }

    this.isLoading = true;
    const formValue = this.loginForm.value;

    if (this.isRegisterMode) {
      // REGISTRO
      const datosRegistro = { ...formValue, referralCode: this.referralCode };

      this.authService.registro(datosRegistro).subscribe({
        next: () => {
          this.notificacionService.showSuccess('¡Cuenta creada!');
          this.procesarLogin(formValue.email!, formValue.password!);
        },
        error: (err: any) => { 
          this.isLoading = false;
          console.error(err);
          this.notificacionService.showError(err.error?.message || 'Error al registrarse.');
        }
      });

    } else {
      // LOGIN
      this.procesarLogin(formValue.email!, formValue.password!);
    }
  }

  private procesarLogin(email: string, pass: string) {
    this.authService.login({ email, password: pass }).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        this.authService.setSession(response.access_token);
        this.notificacionService.showSuccess(`¡Hola, ${response.user.nombre}!`);

        if (this.authService.esAdmin) {
          this.router.navigate(['/admin-dashboard']);
        } else if (this.authService.esOrganizador || this.authService.esProductor || this.authService.esTramitador) {
          this.router.navigate(['/mis-referidos']);
        } else {
           this.router.navigate(['/admin-dashboard']); 
        }
      },
      error: (err: any) => {
        this.isLoading = false;
        if (err.status === 401) {
          this.notificacionService.showError('Email o contraseña incorrectos.');
        } else {
          this.notificacionService.showError('Error de conexión.');
        }
      }
    });
  }
}