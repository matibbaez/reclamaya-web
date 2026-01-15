import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import SignaturePad from 'signature_pad';

@Component({
  selector: 'app-ui-signature',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="signature-container">
      <canvas #canvas></canvas>
    </div>
    <div class="actions">
      <button type="button" (click)="clear()" class="btn-clear">Borrar firma</button>
    </div>
  `,
  styles: [`
    .signature-container {
      border: 2px dashed #ccc;
      border-radius: 8px;
      background: #fff;
      position: relative;
      height: 200px;
      width: 100%;
    }
    canvas {
      width: 100%;
      height: 100%;
      display: block;
    }
    .actions {
      margin-top: 5px;
      text-align: right;
    }
    .btn-clear {
      background: #f8f9fa;
      border: 1px solid #ddd;
      padding: 5px 10px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.85rem;
    }
    .btn-clear:hover { background: #e2e6ea; }
  `]
})
export class UiSignatureComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  private signaturePad!: SignaturePad;
  
  // Emitimos evento cuando el usuario termina de trazar
  @Output() firmaHecha = new EventEmitter<void>();

  ngAfterViewInit() {
    this.initPad();
    // Ajustar el tamaño del canvas al redimensionar ventana
    window.addEventListener('resize', this.resizeCanvas.bind(this));
  }

  ngOnDestroy() {
    window.removeEventListener('resize', this.resizeCanvas.bind(this));
  }

  private initPad() {
    const canvas = this.canvasRef.nativeElement;
    this.signaturePad = new SignaturePad(canvas, {
      backgroundColor: 'rgba(255, 255, 255, 0)',
      penColor: 'rgb(0, 0, 0)'
    });
    
    // Ajuste inicial de tamaño
    this.resizeCanvas();

    // Detectar cuando se dibuja
    this.signaturePad.addEventListener('endStroke', () => {
      this.firmaHecha.emit();
    });
  }

  // Truco para que el canvas se vea nítido en pantallas retina/móviles
  private resizeCanvas() {
    const canvas = this.canvasRef.nativeElement;
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    
    // Obtenemos el ancho del contenedor padre
    const width = canvas.offsetWidth * ratio;
    const height = canvas.offsetHeight * ratio;

    canvas.width = width;
    canvas.height = height;
    
    // Escalamos el contexto
    canvas.getContext('2d')?.scale(ratio, ratio);
    
    // Limpiamos al redimensionar (opcional, pero recomendado para evitar deformaciones)
    this.signaturePad.clear(); 
  }

  clear() {
    this.signaturePad.clear();
  }

  isEmpty(): boolean {
    return this.signaturePad.isEmpty();
  }

  // Devuelve la imagen en Base64 (PNG)
  getSignatureData(): string {
    return this.signaturePad.toDataURL('image/png');
  }
  
  // Convierte Base64 a Blob (para enviar al backend como archivo)
  getSignatureBlob(): Promise<Blob> {
    return new Promise((resolve) => {
      const dataURL = this.getSignatureData();
      fetch(dataURL)
        .then(res => res.blob())
        .then(blob => resolve(blob));
    });
  }
}