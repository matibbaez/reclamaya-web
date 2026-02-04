import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
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
export class LandingProductoresComponent {
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
}