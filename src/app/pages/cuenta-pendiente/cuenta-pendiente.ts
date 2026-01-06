import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Clock, CheckCircle } from 'lucide-angular';

@Component({
  selector: 'app-cuenta-pendiente',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  templateUrl: './cuenta-pendiente.html',
  styleUrl: './cuenta-pendiente.scss'
})
export class CuentaPendienteComponent {
  clockIcon = Clock;
  checkIcon = CheckCircle;
}