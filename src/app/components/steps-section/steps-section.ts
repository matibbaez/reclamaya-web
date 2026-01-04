import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-steps-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './steps-section.html',
  styleUrls: ['./steps-section.scss']
})
export class StepsSectionComponent {
  steps = [
    {
      num: '01',
      title: 'Registrate',
      desc: 'Creá tu cuenta en segundos. Es simple, rápido y 100% seguro.',
      iconPath: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
      // Azul Reclama (Brand)
      gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
      shadow: 'rgba(59, 130, 246, 0.4)',
      colorClass: 'text-blue'
    },
    {
      num: '02',
      title: 'Cargá tu Caso',
      desc: 'Subí la documentación. El sistema te guía y nosotros nos ocupamos.',
      iconPath: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M17 8l-5-5-5 5 M12 3v12',
      // NARANJA "YA" (Identidad pura)
      gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', 
      shadow: 'rgba(245, 158, 11, 0.4)',
      colorClass: 'text-orange'
    },
    {
      num: '03',
      title: 'Recibí tu Pago',
      desc: 'Nosotros gestionamos el reclamo. Vos solo esperás tu indemnización.',
      iconPath: 'M12 1v22 M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',
      // Verde (Dinero/Éxito)
      gradient: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
      shadow: 'rgba(34, 197, 94, 0.4)',
      colorClass: 'text-green'
    }
  ];
}