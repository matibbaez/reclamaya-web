import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Notificacion {
  id: number;
  mensaje: string;
  tipo: 'success' | 'error'; 
  isFadingOut?: boolean; 
}

@Injectable({
  providedIn: 'root' 
})
export class NotificacionService {

  private notificacionesSubject = new BehaviorSubject<Notificacion[]>([]);
  public notificaciones$ = this.notificacionesSubject.asObservable();

  private idCounter = 0;

  constructor() { }

  showSuccess(mensaje: string) {
    this.mostrarNotificacion(mensaje, 'success');
  }

  showError(mensaje: string) {
    this.mostrarNotificacion(mensaje, 'error');
  }

  showWarning(mensaje: string, titulo?: string) {
    this.mostrarNotificacion(mensaje, 'error');
  }

  private mostrarNotificacion(mensaje: string, tipo: 'success' | 'error') {
    const id = this.idCounter++;
    const nuevaNotificacion: Notificacion = { id, mensaje, tipo };

    const notificacionesActuales = [...this.notificacionesSubject.value, nuevaNotificacion];
    this.notificacionesSubject.next(notificacionesActuales);

    setTimeout(() => {
      this.setFadeOut(id);
    }, 4000); 

    setTimeout(() => {
      this.removerNotificacion(id);
    }, 4500);
  }

  private setFadeOut(id: number) {
    const notificaciones = this.notificacionesSubject.value.map(n => 
      n.id === id ? { ...n, isFadingOut: true } : n
    );
    this.notificacionesSubject.next(notificaciones);
  }

  removerNotificacion(id: number) {
    const notificaciones = this.notificacionesSubject.value.filter(n => n.id !== id);
    this.notificacionesSubject.next(notificaciones);
  }
}