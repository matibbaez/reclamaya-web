import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-faq',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './faq.html',
  styleUrls: ['./faq.scss']
})
export class FaqComponent {

  faqOpen: number | null = null;

  faqs = [
    {
      pregunta: '¿Tengo que pagar algo para iniciar?',
      respuesta: 'No. En Reclama Ya trabajamos "a resultado". Adelantamos todos los gastos administrativos y legales. Solo cobramos nuestros honorarios (20%) una vez que vos tenés el dinero de la indemnización en tu cuenta. Si no ganamos, no pagás nada.'
    },
    {
      pregunta: '¿Cuánto tiempo demora el cobro?',
      respuesta: 'Depende de cada aseguradora, pero nuestro sistema digital acelera los tiempos. Un reclamo administrativo promedio suele resolverse entre 30 y 60 días hábiles desde que presentamos toda la documentación completa.'
    },
    {
      pregunta: 'Chocaron mi auto estacionado, ¿puedo reclamar?',
      respuesta: 'Sí, absolutamente. Si tenés los datos del tercero (patente y aseguradora), podemos iniciar el reclamo aunque no hayas estado presente en el momento del impacto. Es fundamental que tengas fotos de los daños.'
    },
    {
      pregunta: '¿Qué documentación necesito?',
      respuesta: 'Lo básico para arrancar es: DNI, Licencia de Conducir, Cédula Verde o Azul y Fotos de los daños. Si no tenés seguro vigente, nuestro sistema genera tu Declaración Jurada automáticamente.'
    },
    {
      pregunta: '¿Puedo revocar a mi abogado actual?',
      respuesta: 'Sí. Es tu derecho elegir quién te representa. Nosotros nos encargamos de la gestión de revocación de forma ética y profesional, notificando al abogado anterior para que puedas traer tu caso con nosotros sin estrés.'
    }
  ];

  toggleFaq(index: number) {
    this.faqOpen = this.faqOpen === index ? null : index;
  }
}