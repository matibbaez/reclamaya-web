import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-terminos-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './terminos-modal.html',
  styleUrl: './terminos-modal.scss'
})
export class TerminosModalComponent {
  @Output() aceptar = new EventEmitter<void>();
  @Output() cancelar = new EventEmitter<void>();

  onAceptar() { this.aceptar.emit(); }
  onCancelar() { this.cancelar.emit(); }
}