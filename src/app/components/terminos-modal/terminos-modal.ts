import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-terminos-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './terminos-modal.html',
  styles: [`
    .modal-backdrop {
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.6); z-index: 50;
      display: flex; justify-content: center; align-items: center;
      backdrop-filter: blur(4px);
    }
    .modal-content {
      background: white; width: 90%; max-width: 600px;
      border-radius: 12px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
      display: flex; flex-direction: column; max-height: 90vh;
    }
    .modal-header {
      background: #1e3a8a; color: white; padding: 1.5rem;
      font-weight: bold; font-size: 1.25rem; display: flex; align-items: center; gap: 0.5rem;
    }
    .modal-body {
      padding: 1.5rem; overflow-y: auto; color: #374151; font-size: 0.95rem; line-height: 1.6;
    }
    .legal-text {
      background: #f3f4f6; padding: 1rem; border-radius: 8px; border: 1px solid #e5e7eb;
      font-family: monospace; font-size: 0.85rem; height: 200px; overflow-y: scroll;
    }
    .modal-footer {
      padding: 1.5rem; border-top: 1px solid #e5e7eb; display: flex; justify-content: flex-end; gap: 1rem; background: #f9fafb;
    }
    .btn { padding: 0.75rem 1.5rem; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.2s; border: none;}
    .btn-secondary { background: white; border: 1px solid #d1d5db; color: #374151; }
    .btn-secondary:hover { background: #f3f4f6; }
    .btn-primary { background: #2563eb; color: white; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2); }
    .btn-primary:hover { background: #1d4ed8; transform: translateY(-1px); }
  `]
})
export class TerminosModalComponent {
  @Output() aceptar = new EventEmitter<void>();
  @Output() cancelar = new EventEmitter<void>();

  onAceptar() { this.aceptar.emit(); }
  onCancelar() { this.cancelar.emit(); }
}