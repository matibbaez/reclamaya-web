import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

export interface IReclamo {
  id: string;
  nombre: string;
  dni: string;
  cbu?: string;
  email: string;
  codigo_seguimiento: string;
  estado: string;
  fecha_creacion: string;
  updated_at?: Date;

  rol_victima: string;
  tiene_seguro: boolean;
  
  aseguradora_tercero?: string;
  patente_tercero?: string;
  patente_propia?: string;
  
  relato_hecho?: string;
  fecha_hecho?: string;
  
  hora_hecho?: string;   
  in_itinere?: boolean;  
  posee_art?: boolean;   

  lugar_hecho?: string;
  localidad?: string;
  telefono?: string;

  // Archivos
  path_dni?: string;
  path_licencia?: string;
  path_cedula?: string;
  path_poliza?: string;
  path_denuncia?: string;
  path_fotos?: string;
  path_medicos?: string;
  path_representacion?: string;
  path_honorarios?: string;

  // Relaciones
  tramitador?: { id: string; nombre: string; email: string };
  usuario_creador?: { id: string; nombre: string; email: string };
}

@Injectable({
  providedIn: 'root'
})
export class ReclamosService {
  private apiUrl = `${environment.apiUrl}/reclamos`;

  constructor(private http: HttpClient) { }

  // =========================================================
  // 1. CREAR RECLAMO 
  // =========================================================
  crearReclamo(formData: FormData): Observable<any> {
    return this.http.post(this.apiUrl, formData);
  }

  obtenerMisSiniestros(): Observable<IReclamo[]> {
    return this.http.get<IReclamo[]>(`${this.apiUrl}/mis-siniestros`);
  }

  getReclamoPorId(id: string): Observable<IReclamo> {
    return this.http.get<IReclamo>(`${this.apiUrl}/${id}`);
  }

  // Obtener la URL firmada para descargar/ver un archivo
  getArchivoUrl(id: string, tipo: string): Observable<{ url: string }> {
    return this.http.get<{ url: string }>(`${this.apiUrl}/descargar/${id}/${tipo}`);
  }

  // Actualizar estado
  actualizarEstado(id: string, estado: string): Observable<IReclamo> {
    return this.http.patch<IReclamo>(`${this.apiUrl}/${id}`, { estado });
  }

  // 2. CONSULTAR (Público)
  consultarEstado(codigo: string): Observable<IReclamo> {
    return this.http.get<IReclamo>(`${this.apiUrl}/consultar/${codigo}`);
  }

  // 3. VER TODOS (Admin)
  findAll(estado: string = ''): Observable<IReclamo[]> {
    return this.http.get<IReclamo[]>(`${this.apiUrl}?estado=${estado}`);
  }

  // 4. ACTUALIZAR (Para cambios generales)
  update(id: string, body: any): Observable<IReclamo> {
    return this.http.patch<IReclamo>(`${this.apiUrl}/${id}`, body);
  }

  // 👇 NUEVO MÉTODO: ASIGNAR TRAMITADOR
  asignarTramitador(reclamoId: string, tramitadorId: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${reclamoId}/asignar`, { tramitadorId });
  }
}