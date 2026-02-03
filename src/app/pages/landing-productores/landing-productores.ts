import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LucideAngularModule, Zap, Shield, BarChart3, Users, ChevronRight, CheckCircle2 } from 'lucide-angular';

@Component({
  selector: 'app-landing-productores',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  templateUrl: './landing-productores.html',
  styleUrls: ['./landing-productores.scss']
})
export class LandingProductoresComponent {
  readonly icons = { Zap, Shield, BarChart3, Users, ChevronRight, CheckCircle2 };
}