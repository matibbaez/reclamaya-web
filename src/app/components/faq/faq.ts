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
      pregunta: '¿Es un servicio gratuito?',
      respuesta: 'No cobramos gastos de inicio en etapa administrativa. Impulsamos el reclamo nosotros mismos para negociar la mayor indemnización. Se cobrarán honorarios a resultado del 20% de la indemnización, una vez acreditado el capital en tu cuenta. Si no cobrás, nosotros tampoco.'
    },
    {
      pregunta: '¿Qué pasa si la oferta no cumple mis expectativas?',
      respuesta: 'Ningún problema. En ese caso pedimos una reevaluación a la aseguradora para que el monto ofrecido repare los daños sufridos, o bien te informaremos los pasos a seguir para avanzar a una instancia de mayor tenor legal.'
    },
    {
      pregunta: '¿Qué pasa si la aseguradora demora en contestar?',
      respuesta: 'Nuestro sistema actualiza constantemente los tiempos de demora de cada aseguradora. Estamos atentos para realizar el reclamo respectivo en caso de retraso, manteniéndote informado en todo momento.'
    },
    // {
    //   pregunta: '¿Qué pasa si no termino de cargar la documentación?',
    //   respuesta: 'No hay problema. Podés subir la documentación que tengas a mano y continuar la carga más tarde. Tené en cuenta que hay documentación obligatoria para avanzar, la cual está detallada en el sistema.'
    // },
    {
      pregunta: '¿Qué sucede con la documentación que subí al finalizar?',
      respuesta: 'El sistema funciona como una base de datos segura. Cada documento quedará cargado, resguardado bajo estrictas políticas de privacidad y seguridad, disponible para vos o tus asegurados en cualquier momento.'
    }
  ];

  toggleFaq(index: number) {
    this.faqOpen = this.faqOpen === index ? null : index;
  }
}