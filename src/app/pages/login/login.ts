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
    password: ['', [Validators.required]], 
    nombre: [''], 
    dni: [''],
    telefono: [''],
    matricula: [''] 
  });

  ngOnInit() {
    // Escuchamos los parámetros de la URL (ref y mode)
    this.route.queryParams.subscribe(params => {
      const ref = params['ref'];
      const mode = params['mode'];

      // 1. Manejo de Código de Referido
      if (ref) {
        this.referralCode = ref;
        this.isRegisterMode = true; 
        this.notificacionService.showSuccess('Código de invitación aplicado.');
      }

      // 2. Manejo de Modo (desde Landing Productores)
      if (mode === 'register') {
        this.isRegisterMode = true;
      } else if (mode === 'login') {
        this.isRegisterMode = false;
      }

      // Ejecutamos validaciones según el modo resultante
      this.actualizarValidaciones();
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
        this.noWhitespaceValidator 
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
      // MODO LOGIN: Relajamos validaciones
      c.nombre.clearValidators();
      c.dni.clearValidators();
      c.telefono.clearValidators();
      
      // En Login solo pedimos que no esté vacía
      c.password.setValidators([Validators.required]);
    }

    // Actualizamos el estado de los inputs
    c.nombre.updateValueAndValidity();
    c.dni.updateValueAndValidity();
    c.telefono.updateValueAndValidity();
    c.password.updateValueAndValidity();
  }

  // Validador Custom: Evita solo espacios
  noWhitespaceValidator(control: AbstractControl): ValidationErrors | null {
    const isWhitespace = (control.value || '').trim().length === 0;
    const isValid = !isWhitespace;
    return isValid ? null : { 'whitespace': true };
  }

  get f() { return this.loginForm.controls; }

  // --- SUBMIT ---
  onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched(); 
      this.notificacionService.showError('Por favor revisá los datos ingresados.');
      return;
    }

    this.isLoading = true;
    const formValue = this.loginForm.value;

    if (this.isRegisterMode) {
      // === REGISTRO ===
      const datosRegistro = { ...formValue, referralCode: this.referralCode };

      this.authService.registro(datosRegistro).subscribe({
        next: (res: any) => {
          this.isLoading = false;
          // 👇 REDIRECCIÓN A LA PANTALLA DE ÉXITO/PENDIENTE
          this.router.navigate(['/cuenta-pendiente']);
        },
        error: (err: any) => { 
          this.isLoading = false;
          console.error(err);
          const mensaje = err.error?.message || 'Error al registrarse.';
          this.notificacionService.showError(mensaje);
        }
      });

    } else {
      // === LOGIN DIRECTO ===
      this.procesarLogin(formValue.email!, formValue.password!);
    }
  }

  // --- LÓGICA CENTRAL DE LOGIN ---
  private procesarLogin(email: string, pass: string) {
    this.authService.login({ email, password: pass }).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        
        // 1. Guardar Sesión
        this.authService.setSession(response.access_token);
        
        // 2. Notificar Éxito
        this.notificacionService.showSuccess(`¡Hola, ${response.user.nombre}!`);

        // 3. Redirigir según Rol
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
        
        if (err.status === 403) {
          // CASO: Usuario registrado pero NO aprobado (isApproved: false)
          this.notificacionService.showWarning(
            'Cuenta en Revisión',
            'Tu registro fue exitoso, pero un administrador debe aprobar tu cuenta antes de ingresar.'
          );
        } 
        else if (err.status === 401) {
          // CASO: Contraseña o mail incorrecto
          this.notificacionService.showError('Email o contraseña incorrectos.');
        } 
        else {
          // CASO: Servidor caído u otro problema
          this.notificacionService.showError('Error de conexión. Intente nuevamente.');
        }
      }
    });
  }

  recuperarPassword() {
    // Agarramos el email si es que ya lo escribió, sino queda en blanco
    const emailIngresado = this.loginForm.get('email')?.value || '...';
    
    // Armamos el mensaje
    const mensaje = `¡Hola! Olvidé la contraseña de mi cuenta de productor en ReclamaYa. Mi correo registrado es: ${emailIngresado}`;
    
    // 👇 PONÉ TU NÚMERO DE WHATSAPP ACÁ (con código de país, ej: 5491123456789)
    const numeroAdmin = "5491133360425"; 
    
    const urlWa = `https://wa.me/${numeroAdmin}?text=${encodeURIComponent(mensaje)}`;
    
    // Abre WhatsApp en una pestaña nueva
    window.open(urlWa, '_blank');
  }
}