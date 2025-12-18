import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

export interface User {
  id: string;
  nombre: string;
  email: string;
  role: string;
  dni?: string;
  matricula?: string;
  fecha_creacion?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UsuariosService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  // Obtener todos los usuarios (para la tabla)
  getUsuarios(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users`);
  }

  // Crear nuevo usuario (Productor)
  crearUsuario(datos: any): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/users`, datos);
  }
  
  // Borrar usuario (Opcional por ahora)
  borrarUsuario(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/users/${id}`);
  }
}