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
  templateUrl: './consultar-tramite.html', // Asegurate que coincida el nombre
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
  pasoActual = 0; 
  claseEstado = 'info'; 
  
  // Variable para la animación del input
  isInputFocused = false; 

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
          if (err.status === 404) {
            this.errorMensaje = 'No encontramos un expediente con ese código. Verificalo e intentá nuevamente.';
          } else {
            this.errorMensaje = 'Ocurrió un error de conexión. Intentá más tarde.';
          }
          return of(null);
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
  private calcularEstadoVisual(estadoBackend: string) {
    switch (estadoBackend) {
      case 'Enviado':
      case 'Recepcionado':
        this.pasoActual = 0;
        this.claseEstado = 'info';
        break;
      case 'Iniciado':
      case 'Negociacion':
        this.pasoActual = 1;
        this.claseEstado = 'warning';
        break;
      case 'Indemnizando':
        this.pasoActual = 2;
        this.claseEstado = 'success';
        break;
      case 'Indemnizado':
        this.pasoActual = 3;
        this.claseEstado = 'success';
        break;
      case 'Rechazado':
        this.pasoActual = 3;
        this.claseEstado = 'danger';
        break;
      default:
        this.pasoActual = 0;
        this.claseEstado = 'info';
    }
  }

  // Calcula el ancho de la barra de progreso en Desktop
  getProgressWidth() {
    const step = this.pasoActual; // 0, 1, 2, 3
    const percent = (step / 3) * 100; // Dividimos por 3 espacios
    return `${percent}%`;
  }

  resetForm() {
    this.resultado = null;
    this.consultaForm.reset();
    this.errorMensaje = '';
  }
}