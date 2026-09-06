import { Component, OnInit, inject } from '@angular/core'; // <-- 1. Agregamos OnInit e inject
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SeoService } from '../../services/seo.service'; // <-- 2. Importamos el servicio
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
export class LandingProductoresComponent implements OnInit { // <-- 3. Implementamos OnInit

  private seoService = inject(SeoService); // <-- 4. Inyectamos el servicio

  // Añadir Menu al objeto de iconos
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

  // 👇 5. Metadatos al cargar
  ngOnInit(): void {
    this.seoService.actualizarMetaTags({
      title: 'Productores | ReclamaYa',
      description: 'Sumate como productor y gestioná los reclamos de tus clientes sin adelantos. Trazabilidad total para que tu cliente vea el estado en línea.',
      ogImage: 'https://reclamaya.ar/logo-seo.png',
      ogUrl: 'https://reclamaya.ar/landing-productores'
    });
  }
}