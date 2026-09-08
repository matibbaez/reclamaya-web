import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core'; // <-- 1. Agregamos PLATFORM_ID
import { CommonModule, isPlatformBrowser } from '@angular/common'; // <-- 2. Agregamos isPlatformBrowser
import { RouterModule } from '@angular/router';
import { FaqComponent } from '../../components/faq/faq';
import { SeoService } from '../../services/seo.service'; 

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [CommonModule, RouterModule, FaqComponent],
  templateUrl: './inicio.html',
  styleUrl: './inicio.scss'
})
export class InicioComponent implements OnInit { 

  private seoService = inject(SeoService);
  
  // 🔥 3. LA CAPA DE INVISIBILIDAD
  private platformId = inject(PLATFORM_ID);
  public isBrowser = isPlatformBrowser(this.platformId);

  ngOnInit(): void {
    this.seoService.actualizarMetaTags({
      title: 'ReclamaYa | Gestión de Siniestros',
      description: 'Plataforma líder en gestión de reclamos. Iniciá y seguí tu trámite en línea de forma rápida y 100% segura.',
      ogImage: 'https://reclamaya.ar/logo-seo.png',
      ogUrl: 'https://reclamaya.ar/'
    });
  }
}