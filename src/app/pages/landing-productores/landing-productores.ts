import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core'; // <-- 1. Agregamos PLATFORM_ID
import { CommonModule, isPlatformBrowser } from '@angular/common'; // <-- 2. Agregamos isPlatformBrowser
import { RouterModule } from '@angular/router';
import { SeoService } from '../../services/seo.service'; 
import { 
  LucideAngularModule, 
  Zap, 
  ArrowRight, 
  Shield, 
  BarChart3, 
  Users, 
  ChevronRight, 
  CheckCircle2,
  Menu 
} from 'lucide-angular';
import { NavbarComponent } from '../../components/navbar/navbar'; 
import { FooterComponent } from '../../components/footer/footer'; 

@Component({
  selector: 'app-landing-productores',
  standalone: true,
  imports: [CommonModule, NavbarComponent, FooterComponent, RouterModule, LucideAngularModule],
  templateUrl: './landing-productores.html',
  styleUrls: ['./landing-productores.scss']
})
export class LandingProductoresComponent implements OnInit { 

  private seoService = inject(SeoService); 
  
  // 🔥 3. LA CAPA DE INVISIBILIDAD
  private platformId = inject(PLATFORM_ID);
  public isBrowser = isPlatformBrowser(this.platformId);

  readonly icons = { 
    Zap, 
    Shield, 
    ArrowRight, 
    BarChart3, 
    Users, 
    ChevronRight, 
    CheckCircle2,
    Menu 
  };

  ngOnInit(): void {
    this.seoService.actualizarMetaTags({
      title: 'Productores | ReclamaYa',
      description: 'Sumate como productor y gestioná los reclamos de tus clientes sin adelantos. Trazabilidad total para que tu cliente vea el estado en línea.',
      ogImage: 'https://reclamaya.ar/logo-seo.png',
      // 🔧 FIX: coincide con la ruta real prerenderizada (/productores),
      // antes decía /landing-productores, que en el sitio es solo un alias/redirect.
      ogUrl: 'https://reclamaya.ar/productores'
    });
  }
}