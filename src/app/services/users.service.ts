import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

export interface IUser {
  id: string;
  nombre: string;
  email: string;
  role: string;
  dni?: string;
  telefono?: string;  
  matricula?: string;
  createdAt?: string;
  isApproved: boolean;
  reclamos_cargados?: any[]; 
}

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/users`;

  constructor() { }

  getAll(role?: string): Observable<IUser[]> {
    let url = this.apiUrl;
    if (role) {
      url += `?role=${role}`;
    }
    return this.http.get<IUser[]>(url);
  }

  getPendientes(): Observable<IUser[]> {
    return this.http.get<IUser[]>(`${this.apiUrl}?approved=false`);
  }

  aprobarUsuario(id: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/approve`, {});
  }

  getTramitadores(): Observable<IUser[]> {
    return this.getAll('Tramitador');
  }

  obtenerMiEquipo(): Observable<IUser[]> {
    return this.http.get<IUser[]>(`${this.apiUrl}/mis-referidos`);
  }

  create(user: any): Observable<IUser> {
    return this.http.post<IUser>(this.apiUrl, user);
  }

  cambiarRol(id: string, nuevoRol: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/role`, { role: nuevoRol });
  }

  delete(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  // ----------------------------------------------------------------------
  // AUTOGESTIÓN DE PERFIL
  // ----------------------------------------------------------------------
  cambiarMiPassword(passwordActual: string, passwordNueva: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/perfil/cambiar-password`, {
      passwordActual,
      passwordNueva
    });
  }
}