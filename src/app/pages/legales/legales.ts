import { Component, OnInit, inject } from '@angular/core'; // <-- 1. Agregamos OnInit e inject
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../components/navbar/navbar'; 
import { FooterComponent } from '../../components/footer/footer'; 
import { SeoService } from '../../services/seo.service'; // <-- 2. Importamos el servicio

@Component({
  selector: 'app-legales',
  standalone: true,
  imports: [CommonModule, NavbarComponent, FooterComponent],
  templateUrl: './legales.html',
  styleUrls: ['./legales.scss']
})
export class LegalesComponent implements OnInit { // <-- 3. Implementamos OnInit

  private seoService = inject(SeoService); // <-- 4. Inyectamos el servicio

  activeTab: 'terminos' | 'privacidad' = 'terminos';

  // 👇 5. Configuramos los metadatos al inicializar
  ngOnInit(): void {
    this.seoService.actualizarMetaTags({
      title: 'Términos y Privacidad | ReclamaYa',
      description: 'Términos, condiciones y políticas de privacidad sobre el tratamiento de datos en la plataforma ReclamaYa.',
      ogImage: 'https://reclamaya.ar/logo-seo.png',
      ogUrl: 'https://reclamaya.ar/legales'
    });
  }

  setTab(tab: 'terminos' | 'privacidad') {
    this.activeTab = tab;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}