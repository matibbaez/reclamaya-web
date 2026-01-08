import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../components/navbar/navbar'; // Reutilizamos tu navbar
import { FooterComponent } from '../../components/footer/footer'; // Reutilizamos tu footer

@Component({
  selector: 'app-legales',
  standalone: true,
  imports: [CommonModule, NavbarComponent, FooterComponent],
  templateUrl: './legales.html',
  styleUrls: ['./legales.scss']
})
export class LegalesComponent {
  activeTab: 'terminos' | 'privacidad' = 'terminos';

  setTab(tab: 'terminos' | 'privacidad') {
    this.activeTab = tab;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}