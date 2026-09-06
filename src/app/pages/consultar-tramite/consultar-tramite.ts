import { Component, inject, OnInit } from '@angular/core'; // <-- 1. Agregamos OnInit
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ReclamosService, IReclamo } from '../../services/reclamos.service';
import { SeoService } from '../../services/seo.service';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { LucideAngularModule, Mail } from 'lucide-angular';

@Component({
  selector: 'app-consultar-tramite',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './consultar-tramite.html',
  styleUrl: './consultar-tramite.scss'
})
export class ConsultarTramiteComponent implements OnInit { // <-- 2. Implementamos OnInit

  readonly icons = { Mail };
  private fb = inject(FormBuilder);
  private seoService = inject(SeoService);
  private reclamosService = inject(ReclamosService);

  consultaForm = this.fb.group({
    dni: ['', [Validators.required, Validators.pattern(/^[0-9]{7,11}$/)]], 
    codigo: ['', [Validators.required, Validators.minLength(6)]]
  });

  resultado: IReclamo | null = null;
  isLoading = false;
  errorMensaje = '';

  readonly pasosTimeline = [
    { id: 'Enviado', label: 'Enviado' },
    { id: 'Recepcionado', label: 'Recibido' },
    { id: 'Iniciado', label: 'Iniciado' },
    { id: 'Negociacion', label: 'Negociación' },
    { id: 'Indemnizando', label: 'En pago' },
    { id: 'Indemnizado', label: 'Cobrado' } 
  ];

  pasoActual = 0; 
  claseEstado = 'info'; 
  isInputFocused = false; 

  // 👇 3. Agregamos el ngOnInit con la inyección de metadatos
  ngOnInit(): void {
    this.seoService.actualizarMetaTags({
      title: 'Consultar Trámite | ReclamaYa',
      description: 'Consultá el estado de tu expediente ingresando tu DNI y código de seguimiento de forma rápida y segura.',
      ogImage: 'https://reclamaya.ar/logo-seo.png', // Provisorio
      ogUrl: 'https://reclamaya.ar/consultar-tramite'
    });
  }

  onSubmit() {
    if (this.consultaForm.invalid) {
        this.consultaForm.markAllAsTouched();
        return;
    }

    this.isLoading = true;
    this.resultado = null;
    this.errorMensaje = '';

    const { codigo, dni } = this.consultaForm.value;

    this.reclamosService.consultarEstado(codigo!, dni!)
      .pipe(
        catchError((err) => {
          this.isLoading = false;
          if (err.status === 404) {
            this.errorMensaje = 'No encontramos coincidencias. Verificá que el DNI y el Código sean correctos.';
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
        this.pasoActual = -1; 
        this.claseEstado = 'danger';
        return;
    }

    const index = this.pasosTimeline.findIndex(p => p.id === estadoBackend);
    this.pasoActual = index >= 0 ? index : 0;

    if (this.pasoActual < 2) this.claseEstado = 'info';
    else if (this.pasoActual < 4) this.claseEstado = 'warning';
    else this.claseEstado = 'success';
  }

  getProgressWidth() {
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