import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FaqComponent } from '../../components/faq/faq';
import { StepsSectionComponent } from '../../components/steps-section/steps-section'; // <--- IMPORTANTE

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [CommonModule, RouterModule, FaqComponent, StepsSectionComponent],
  templateUrl: './inicio.html',
  styleUrl: './inicio.scss'
})
export class InicioComponent {

  // Controla qué pregunta está abierta (índice numérico)
  faqOpen: number | null = null;

  toggleFaq(index: number) {
    // Si toco la misma que está abierta, la cierro (null). Si no, abro la nueva.
    this.faqOpen = this.faqOpen === index ? null : index;
  }

  // Datos de las preguntas
  faqs = [
    {
      pregunta: '¿Tengo que pagar algo para iniciar?',
      respuesta: 'No. En Reclama Ya trabajamos "a resultado". Adelantamos los gastos y solo cobramos un porcentaje (20%) cuando vos cobrás tu indemnización. Si no ganamos, no pagás nada.'
    },
    {
      pregunta: '¿Cuánto demora el cobro?',
      respuesta: 'Depende de la aseguradora, pero nuestro sistema digital acelera los tiempos. Un reclamo administrativo promedio suele resolverse entre 30 y 60 días hábiles desde que presentás toda la documentación.'
    },
    {
      pregunta: 'Chocaron mi auto estacionado, ¿puedo reclamar?',
      respuesta: 'Sí, absolutamente. Si tenés los datos del tercero (patente y aseguradora), podemos iniciar el reclamo aunque no hayas estado presente en el momento del impacto.'
    },
    {
      pregunta: '¿Qué documentación necesito?',
      respuesta: 'Lo básico es: DNI, Licencia de Conducir, Cédula Verde/Azul y Fotos de los daños. Si no tenés seguro, nuestro sistema genera tu Declaración Jurada automáticamente.'
    },
    {
      pregunta: '¿Puedo revocar a mi abogado actual?',
      respuesta: 'Sí. Es tu derecho elegir quién te representa. Nosotros nos encargamos de la gestión de revocación de forma ética y profesional para que puedas traer tu caso con nosotros.'
    }
  ];
}