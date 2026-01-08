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

  // ESTADOS DEL PDF (Secuenciales)
  readonly pasosTimeline = [
    { id: 'Enviado', label: 'Enviado' },
    { id: 'Recepcionado', label: 'Recepcionado' },
    { id: 'Iniciado', label: 'Iniciado' },
    { id: 'Negociacion', label: 'Negociación' },
    { id: 'Indemnizando', label: 'Indemnizando' },
    { id: 'Indemnizado', label: 'Finalizado' } 
  ];

  pasoActual = 0; 
  claseEstado = 'info'; 
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

  private calcularEstadoVisual(estadoBackend: string) {
    if (estadoBackend === 'Rechazado') {
        this.pasoActual = -1; // Estado especial
        this.claseEstado = 'danger';
        return;
    }

    // Buscamos en qué índice del array está el estado actual
    const index = this.pasosTimeline.findIndex(p => p.id === estadoBackend);
    
    // Si no lo encuentra (por error), asumimos 0
    this.pasoActual = index >= 0 ? index : 0;

    // Colores del banner
    if (this.pasoActual < 2) this.claseEstado = 'info';
    else if (this.pasoActual < 4) this.claseEstado = 'warning';
    else this.claseEstado = 'success';
  }

  getProgressWidth() {
    // Si es rechazado, llenamos la barra completa (se pintará roja por CSS)
    if (this.resultado?.estado === 'Rechazado') return '100%';
    
    const totalPasos = this.pasosTimeline.length - 1;
    const percent = (this.pasoActual / totalPasos) * 100;
    return `${percent}%`;
  }

  resetForm() {
    this.resultado = null;
    this.consultaForm.reset();
    this.errorMensaje = '';
  }
}