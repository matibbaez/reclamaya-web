import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

export interface IReclamo {
  id: string;
  codigo_seguimiento: string;
  mensajes?: { fecha: Date, texto: string, autor: string }[];
  estado: string;
  fecha_creacion: Date;
  updatedAt?: Date;
  
  // Datos Personales
  nombre: string;
  dni: string;
  email: string;
  telefono: string;
  domicilio_usuario?: string; 
  cbu?: string;

  // Datos Siniestro
  rol_victima: string;
  tiene_seguro: boolean;
  aseguradora_tercero: string;
  patente_tercero?: string;
  patente_propia?: string;
  
  // --- Datos del Tercero (NUEVOS) ---
  tercero_nombre?: string;       
  tercero_apellido?: string;     
  tercero_dni?: string;          
  tercero_marca_modelo?: string; 

  fecha_hecho: string;
  hora_hecho?: string;
  lugar_hecho: string;
  localidad: string;
  relato_hecho?: string;

  // --- Contexto Laboral ---
  in_itinere?: boolean;
  posee_art?: boolean;

  // --- Intervenciones ---
  intervino_policia?: boolean;
  intervino_ambulancia?: boolean;
  sufrio_lesiones?: boolean;

  // Relaciones
  usuario_creador?: any;
  tramitador?: any;

  // --- Archivos (Paths) ---
  path_dni?: string;
  path_licencia?: string;
  path_cedula?: string;
  path_poliza?: string;
  path_denuncia?: string;
  path_fotos?: string[];
  path_medicos?: string;
  path_representacion?: string;
  path_honorarios?: string;

  // 👇 LOS QUE TE DABAN ERROR (NUEVOS)
  path_presupuesto?: string;
  path_cbu_archivo?: string;
  path_denuncia_penal?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReclamosService {
  private apiUrl = `${environment.apiUrl}/reclamos`;

  constructor(private http: HttpClient) { }

  // 1. CREAR RECLAMO 
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

  // ASIGNAR TRAMITADOR
  asignarTramitador(reclamoId: string, tramitadorId: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${reclamoId}/asignar`, { tramitadorId });
  }

  agregarMensaje(idReclamo: string, texto: string) {
    return this.http.post<IReclamo>(`${this.apiUrl}/${idReclamo}/mensajes`, { texto });
  }

  obtenerGaleria(id: string): Observable<{ urls: string[] }> {
    return this.http.get<{ urls: string[] }>(`${this.apiUrl}/${id}/galeria`);
  }
}