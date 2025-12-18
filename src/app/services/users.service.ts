import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

export interface IMiembroEquipo {
  id: string;
  nombre: string;
  email: string;
  role: string;
  createdAt: string;
  reclamos_cargados: any[]; 
}

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/users`;

  constructor() { }

  // 1. TRAER MI EQUIPO (El endpoint nuevo)
  obtenerMiEquipo(): Observable<IMiembroEquipo[]> {
    return this.http.get<IMiembroEquipo[]>(`${this.apiUrl}/mis-referidos`);
  }

  // 2. REGISTRAR UN NUEVO USUARIO (Para el futuro, si querés invitar)
  create(user: any): Observable<any> {
    return this.http.post(this.apiUrl, user);
  }
}