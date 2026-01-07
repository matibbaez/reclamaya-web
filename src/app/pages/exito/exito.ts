import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { NotificacionService } from '../../services/notificacion';

@Component({
  selector: 'app-exito',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './exito.html', // Asegurate que sea .html y no .component.html si así lo tenés
  styleUrl: './exito.scss'
})
export class ExitoComponent implements OnInit {
  
  private router = inject(Router);
  private notificacionService = inject(NotificacionService);

  // Variables para el HTML
  codigo: string = '---';
  nombre: string = ''; 
  copiado: boolean = false; // <--- Agregamos esta para controlar el texto del botón

  ngOnInit() {
    // Recuperamos los datos del 'state'
    const estadoNavegacion = history.state;
    
    if (estadoNavegacion && estadoNavegacion.codigo) {
      this.codigo = estadoNavegacion.codigo;
      // Tomamos solo el primer nombre para que sea más personal (opcional)
      const nombreCompleto = estadoNavegacion.nombre || 'Usuario';
      this.nombre = nombreCompleto.split(' ')[0]; 
    } else {
      // Si entra directo sin datos, volver al inicio
      this.router.navigate(['/']);
    }
  }

  copiarCodigo() {
    if (this.codigo && this.codigo !== '---') {
      navigator.clipboard.writeText(this.codigo).then(() => {
        
        // 1. Efecto visual en el botón (cambia a "¡Copiado!")
        this.copiado = true;

        // 2. Notificación Toast (tu servicio actual)
        this.notificacionService.showSuccess('Código copiado al portapapeles');

        // 3. Volver el botón a la normalidad después de 2 segundos
        setTimeout(() => {
          this.copiado = false;
        }, 2000);

      }).catch(err => {
        console.error('Error al copiar', err);
        this.notificacionService.showError('No se pudo copiar el código');
      });
    }
  }
}