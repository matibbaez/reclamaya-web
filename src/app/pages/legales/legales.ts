import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core'; 
import { CommonModule, isPlatformBrowser } from '@angular/common'; // <-- Agregamos isPlatformBrowser
import { NavbarComponent } from '../../components/navbar/navbar'; 
import { FooterComponent } from '../../components/footer/footer'; 
import { SeoService } from '../../services/seo.service'; 

@Component({
  selector: 'app-legales',
  standalone: true,
  imports: [CommonModule, NavbarComponent, FooterComponent],
  templateUrl: './legales.html',
  styleUrls: ['./legales.scss']
})
export class LegalesComponent implements OnInit { 

  private seoService = inject(SeoService); 
  private platformId = inject(PLATFORM_ID); // 🛡️ ESCUDO

  activeTab: 'terminos' | 'privacidad' = 'terminos';

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
    
    // 🛡️ BLINDAMOS EL SCROLL
    if (isPlatformBrowser(this.platformId)) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
}