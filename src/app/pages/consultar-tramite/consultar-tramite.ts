import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { CardComponent } from '../../components/card/card';
import { NotificacionService } from '../../services/notificacion';
import { ReclamosService, IReclamo } from '../../services/reclamos.service'; 
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-consultar-tramite',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, CardComponent],
  templateUrl: './consultar-tramite.html',
  styleUrl: './consultar-tramite.scss'
})
export class ConsultarTramiteComponent {
  
  private fb = inject(FormBuilder);
  private reclamosService = inject(ReclamosService); 
  private notificacionService = inject(NotificacionService);

  resultado: IReclamo | null = null;
  errorMensaje: string | null = null;
  isLoading = false;

  consultaForm = this.fb.group({
    codigo: ['', [Validators.required, Validators.minLength(6)]]
  });

  onSubmit() {
    this.resultado = null;
    this.errorMensaje = null;
    
    if (this.consultaForm.invalid) {
      this.consultaForm.markAllAsTouched();
      return;
    }

    this.isLoading = true; 
    const codigo = this.consultaForm.value.codigo!.trim().toUpperCase();

    this.reclamosService.consultarEstado(codigo)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (res) => {
          this.resultado = res;
          this.notificacionService.showSuccess('¡Expediente encontrado!');
        },
        error: (err) => {
          console.error(err);
          if (err.status === 404) {
            this.errorMensaje = 'No encontramos un trámite con ese código.';
          } else {
            this.errorMensaje = 'Ocurrió un error de conexión. Intente nuevamente.';
          }
        }
      });
  }

  resetForm() {
    this.consultaForm.reset();
    this.resultado = null;
    this.errorMensaje = null;
  }

  // --- LÓGICA VISUAL DE LA LÍNEA DE TIEMPO ---
    get pasoActual(): number {
    if (!this.resultado) return 0;
    const e = this.resultado.estado;

    switch (e) {
      case 'Enviado': 
      case 'Recepcionado': return 0; // Paso 1: Inicio
      
      case 'Iniciado': 
      case 'Negociacion': return 1;  // Paso 2: Gestión
      
      case 'Indemnizando': return 2; // Paso 3: Resolución
      
      case 'Indemnizado': 
      case 'Rechazado': return 3;    // Paso 4: Final
      
      default: return 0;
    }
  }

  get claseEstado(): string {
    if (!this.resultado) return '';
    const e = this.resultado.estado;
    if (e === 'Indemnizado') return 'success';
    if (e === 'Rechazado') return 'danger';
    if (e === 'Indemnizando' || e === 'Negociacion') return 'warning';
    return 'info';
  }
}