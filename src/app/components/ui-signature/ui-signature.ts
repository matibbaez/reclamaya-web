import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, Output, EventEmitter, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import type SignaturePad from 'signature_pad'; // ✅ Importamos SOLO EL TIPO para TypeScript, esto no rompe Node

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
    .actions { margin-top: 5px; text-align: right; }
    .btn-clear { background: #f8f9fa; border: 1px solid #ddd; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 0.85rem; }
    .btn-clear:hover { background: #e2e6ea; }
  `]
})
export class UiSignatureComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  private signaturePad!: SignaturePad;
  private platformId = inject(PLATFORM_ID); // 👈 Escudo activado
  
  @Output() firmaHecha = new EventEmitter<void>();

  async ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      await this.initPad();
      // Protegemos el objeto window
      window.addEventListener('resize', this.resizeCanvas.bind(this));
    }
  }

  ngOnDestroy() {
    if (isPlatformBrowser(this.platformId)) {
      // Protegemos el objeto window
      window.removeEventListener('resize', this.resizeCanvas.bind(this));
    }
  }

  private async initPad() {
    // ✅ IMPORTACIÓN DINÁMICA DE LA LIBRERÍA
    const SignaturePadClass = (await import('signature_pad')).default;
    
    const canvas = this.canvasRef.nativeElement;
    this.signaturePad = new SignaturePadClass(canvas, {
      backgroundColor: 'rgba(255, 255, 255, 0)',
      penColor: 'rgb(0, 0, 0)'
    });
    
    this.resizeCanvas();

    this.signaturePad.addEventListener('endStroke', () => {
      this.firmaHecha.emit();
    });
  }

  private resizeCanvas() {
    if (isPlatformBrowser(this.platformId)) {
      const canvas = this.canvasRef.nativeElement;
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      const width = canvas.offsetWidth * ratio;
      const height = canvas.offsetHeight * ratio;

      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d')?.scale(ratio, ratio);
      
      if (this.signaturePad) {
        this.signaturePad.clear(); 
      }
    }
  }

  clear() {
    if (this.signaturePad) this.signaturePad.clear();
  }

  isEmpty(): boolean {
    return this.signaturePad ? this.signaturePad.isEmpty() : true;
  }

  getSignatureData(): string {
    return this.signaturePad ? this.signaturePad.toDataURL('image/png') : '';
  }
  
  getSignatureBlob(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.signaturePad) return reject('No hay pad inicializado');
      const dataURL = this.getSignatureData();
      fetch(dataURL)
        .then(res => res.blob())
        .then(blob => resolve(blob));
    });
  }
}