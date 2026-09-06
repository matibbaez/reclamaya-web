import { Component, OnInit, inject } from '@angular/core'; // <-- 1. Agregamos OnInit e inject
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FaqComponent } from '../../components/faq/faq';
import { SeoService } from '../../services/seo.service'; // <-- 2. Importamos el servicio

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [CommonModule, RouterModule, FaqComponent],
  templateUrl: './inicio.html',
  styleUrl: './inicio.scss'
})
export class InicioComponent implements OnInit { // <-- 3. Implementamos OnInit

  private seoService = inject(SeoService); // <-- 4. Inyectamos el servicio

  // 👇 5. Configuramos los metadatos al inicializar
  ngOnInit(): void {
    this.seoService.actualizarMetaTags({
      title: 'ReclamaYa | Gestión de Siniestros',
      description: 'Plataforma líder en gestión de reclamos. Iniciá y seguí tu trámite en línea de forma rápida y 100% segura.',
      ogImage: 'https://reclamaya.ar/logo-seo.png',
      ogUrl: 'https://reclamaya.ar/'
    });
  }
}