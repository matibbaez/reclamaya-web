import { Injectable, inject, PLATFORM_ID } from '@angular/core'; // <-- 1. Importar PLATFORM_ID
import { isPlatformBrowser } from '@angular/common'; // <-- 2. Importar isPlatformBrowser
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { jwtDecode } from 'jwt-decode';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

export interface User {
  id: string;
  email: string;
  nombre: string;
  role: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  
  private http = inject(HttpClient);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID); // <-- 3. Inyectar el ID de la plataforma
  private apiUrl = environment.apiUrl;

  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;

  constructor() {
    let user = null;

    // 👇 4. ENCAPSULAMOS EL ACCESO AL STORAGE
    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          user = jwtDecode<User>(token);
        } catch (error) {
          console.error('Error al decodificar token inicial', error);
        }
      }
    }

    this.currentUserSubject = new BehaviorSubject<User | null>(user);
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  login(credentials: { email: string; password: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/login`, credentials);
  }

  registro(datosUsuario: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/register`, datosUsuario);
  }

  setSession(token: string) {
    if (isPlatformBrowser(this.platformId)) { // <-- También lo protegemos por las dudas
      localStorage.setItem('access_token', token);
    }
    try {
      const user = jwtDecode<User>(token);
      this.currentUserSubject.next(user);
    } catch (e) {
      console.error('Error al decodificar al hacer setSession', e);
    }
  }

  logout() {
    if (isPlatformBrowser(this.platformId)) { // <-- Protegido
      localStorage.removeItem('access_token');
    }
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    return !!this.currentUserSubject.value;
  }

  // --- Getters de Roles ---
  get esAdmin(): boolean {
    return this.currentUserValue?.role === 'Admin';
  }
  get esOrganizador(): boolean {
    return this.currentUserValue?.role === 'Organizador';
  }
  get esTramitador(): boolean {
    return this.currentUserValue?.role === 'Tramitador';
  }
  get esProductor(): boolean {
    return this.currentUserValue?.role === 'Productor';
  }
}