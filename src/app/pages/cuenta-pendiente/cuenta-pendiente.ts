import { Component, OnInit, inject } from '@angular/core'; // <-- 1. Agregamos OnInit e inject
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Clock, CheckCircle } from 'lucide-angular';
import { SeoService } from '../../services/seo.service'; // <-- 2. Importamos el SeoService

@Component({
  selector: 'app-cuenta-pendiente',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  templateUrl: './cuenta-pendiente.html',
  styleUrl: './cuenta-pendiente.scss'
})
export class CuentaPendienteComponent implements OnInit { // <-- 3. Agregamos "implements OnInit"
  
  private seoService = inject(SeoService); // <-- 4. Inyectamos el servicio

  clockIcon = Clock;
  checkIcon = CheckCircle;

  // 👇 5. Agregamos el método de bloqueo al iniciar la página
  ngOnInit(): void {
    this.seoService.bloquearIndexacion();
  }
}