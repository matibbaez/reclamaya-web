import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

// Interfaz unificada para todo tipo de usuario que venga del back
export interface IUser {
  id: string;
  nombre: string;
  email: string;
  role: string;
  dni?: string;
  telefono?: string;  
  matricula?: string;
  createdAt?: string;
  reclamos_cargados?: any[]; // Para la vista de equipo
}

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/users`;

  constructor() { }

  // 1. TRAER TODOS (Para listados de Admin)
  getAll(role?: string): Observable<IUser[]> {
    let url = this.apiUrl;
    if (role) {
      url += `?role=${role}`;
    }
    return this.http.get<IUser[]>(url);
  }

  // 2. TRAER SOLO TRAMITADORES (Para el select de asignación)
  getTramitadores(): Observable<IUser[]> {
    return this.getAll('Tramitador');
  }

  obtenerMiEquipo(): Observable<IUser[]> {
    return this.http.get<IUser[]>(`${this.apiUrl}/mis-referidos`);
  }

  // 4. CREAR USUARIO (Productor/Tramitador)
  create(user: any): Observable<IUser> {
    return this.http.post<IUser>(this.apiUrl, user);
  }

  // 5. BORRAR USUARIO
  delete(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}