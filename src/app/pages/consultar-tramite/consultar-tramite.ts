import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ReclamosService, IReclamo } from '../../services/reclamos.service';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-consultar-tramite',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './consultar-tramite.html',
  styleUrl: './consultar-tramite.scss'
})
export class ConsultarTramiteComponent {

  private fb = inject(FormBuilder);
  private reclamosService = inject(ReclamosService);

  consultaForm = this.fb.group({
    codigo: ['', [Validators.required, Validators.minLength(6)]]
  });

  resultado: IReclamo | null = null;
  isLoading = false;
  errorMensaje = '';

  // Variables para la vista
  pasoActual = 0; // 0 a 3
  claseEstado = 'info'; // 'info', 'warning', 'success', 'danger'

  onSubmit() {
    if (this.consultaForm.invalid) return;

    this.isLoading = true;
    this.resultado = null;
    this.errorMensaje = '';

    const codigo = this.consultaForm.value.codigo!;

    this.reclamosService.consultarEstado(codigo)
      .pipe(
        catchError((err) => {
          this.isLoading = false;
          // Manejo de errores amigable
          if (err.status === 404) {
            this.errorMensaje = 'No encontramos un expediente con ese código. Verificalo e intentá nuevamente.';
          } else {
            this.errorMensaje = 'Ocurrió un error de conexión. Intentá más tarde.';
          }
          return of(null); // Retorna null para cortar el flujo
        })
      )
      .subscribe((data) => {
        this.isLoading = false;
        if (data) {
          this.resultado = data;
          this.calcularEstadoVisual(data.estado);
        }
      });
  }

  // --- EL CEREBRO DE LA LÍNEA DE TIEMPO ---
  // Mapeamos los 7 estados del Backend a los 4 pasos visuales del Frontend
  private calcularEstadoVisual(estadoBackend: string) {
    switch (estadoBackend) {
      // PASO 1: INICIO
      case 'Enviado':
      case 'Recepcionado':
        this.pasoActual = 0;
        this.claseEstado = 'info'; // Azul
        break;

      // PASO 2: GESTIÓN
      case 'Iniciado':
      case 'Negociacion':
        this.pasoActual = 1;
        this.claseEstado = 'warning'; // Naranja (Trabajando)
        break;

      // PASO 3: RESOLUCIÓN
      case 'Indemnizando':
        this.pasoActual = 2;
        this.claseEstado = 'success'; // Verde
        break;

      // PASO 4: FINAL
      case 'Indemnizado':
        this.pasoActual = 3;
        this.claseEstado = 'success'; // Verde Fuerte
        break;

      // CASO TRISTE: RECHAZADO
      case 'Rechazado':
        this.pasoActual = 3; // Lo mostramos al final, pero rojo
        this.claseEstado = 'danger'; // Rojo
        break;

      default:
        this.pasoActual = 0;
        this.claseEstado = 'info';
    }
  }

  resetForm() {
    this.resultado = null;
    this.consultaForm.reset();
    this.errorMensaje = '';
  }
}