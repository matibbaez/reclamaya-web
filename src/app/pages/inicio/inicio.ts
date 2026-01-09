import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FaqComponent } from '../../components/faq/faq';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [CommonModule, RouterModule, FaqComponent],
  templateUrl: './inicio.html',
  styleUrl: './inicio.scss'
})
export class InicioComponent {
}