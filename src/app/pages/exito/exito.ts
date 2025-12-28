import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
// Importamos el servicio de notificaciones para el mensaje de "Copiado"
import { NotificacionService } from '../../services/notificacion';

@Component({
  selector: 'app-exito',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './exito.html',
  styleUrl: './exito.scss'
})
export class ExitoComponent implements OnInit {
  
  private router = inject(Router);
  private notificacionService = inject(NotificacionService);

  // Variables que usa el HTML
  codigo: string = '---';
  nombre: string = ''; 

  ngOnInit() {
    // Recuperamos los datos del 'state' enviado por IniciarReclamo
    const estadoNavegacion = history.state;
    
    if (estadoNavegacion && estadoNavegacion.codigo) {
      this.codigo = estadoNavegacion.codigo;
      this.nombre = estadoNavegacion.nombre || 'Usuario';
    } else {
      // Si alguien entra directo sin datos, lo mandamos al inicio
      this.router.navigate(['/']);
    }
  }

  copiarCodigo() {
    if (this.codigo && this.codigo !== '---') {
      navigator.clipboard.writeText(this.codigo).then(() => {
        // Usamos tu servicio de notificación para que quede pro
        this.notificacionService.showSuccess('Código copiado al portapapeles');
      }).catch(err => {
        console.error('Error al copiar', err);
      });
    }
  }
}