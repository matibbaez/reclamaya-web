import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { UsersService } from '../../services/users.service'; 
import { NotificacionService } from '../../services/notificacion';
import { environment } from '../../../environments/environment';
import { IReclamo } from '../../services/reclamos.service';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs/operators';

// --- TIPOS NUEVOS ---
type TipoArchivo = 'dni' | 'licencia' | 'cedula' | 'poliza' | 'denuncia' | 'fotos' | 'medicos';

@Component({
  selector: 'app-gestionar-reclamo-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './gestionar-reclamo-modal.html',
  styleUrl: './gestionar-reclamo-modal.scss'
})
export class GestionarReclamoModalComponent implements OnInit {

  @Input() reclamo!: IReclamo; 
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<string>();

  private fb = inject(FormBuilder);
  private http = inject(HttpClient); 
  private notificacionService = inject(NotificacionService);

  public descargando: TipoArchivo | null = null;

  // Lista de los 7 estados para el selector
  estadosPosibles = [
    'Enviado', 'Recepcionado', 'Iniciado', 'Negociacion', 
    'Indemnizando', 'Indemnizado', 'Rechazado'
  ];

  estadoForm = this.fb.group({
    estado: ['', Validators.required]
  });

  ngOnInit(): void {
    if (this.reclamo) {
      this.estadoForm.patchValue({ estado: this.reclamo.estado });
    }
  }

  descargarArchivo(tipo: TipoArchivo) {
    if (this.descargando) return; 
    this.descargando = tipo; 
    
    // Backend: /reclamos/descargar/:id/:tipo
    const url = `${environment.apiUrl}/reclamos/descargar/${this.reclamo.id}/${tipo}`;

    this.http.get<{ url: string }>(url).pipe(
      finalize(() => { this.descargando = null; })
    ).subscribe({
      next: (res) => window.open(res.url, '_blank'),
      error: (err) => this.notificacionService.showError('No se pudo descargar el archivo.')
    });
  }

  guardarCambios() {
    if (this.estadoForm.valid) {
      this.save.emit(this.estadoForm.value.estado!);
    }
  }

  cerrarModal() { this.close.emit(); }
}