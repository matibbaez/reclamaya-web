import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import { Router } from '@angular/router';

export interface User {
  id: string;
  email: string;
  role: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  
  private router = inject(Router);
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;

  constructor() {
    // 1. CAMBIO AQUÍ: Usamos 'access_token'
    const token = localStorage.getItem('access_token'); // 👈 CAMBIO
    let user = null;

    if (token) {
      try {
        user = jwtDecode<User>(token);
      } catch (error) {
        console.error('Error al decodificar token', error);
      }
    }

    this.currentUserSubject = new BehaviorSubject<User | null>(user);
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  // 2. CAMBIO AQUÍ: Al guardar, usamos 'access_token'
  setSession(token: string) {
    localStorage.setItem('access_token', token); // 👈 CAMBIO
    const user = jwtDecode<User>(token);
    this.currentUserSubject.next(user);
  }

  // 3. CAMBIO AQUÍ: Al borrar, borramos 'access_token'
  logout() {
    localStorage.removeItem('access_token'); // 👈 Que coincida con el que usamos para entrar
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    return !!this.currentUserSubject.value;
  }

  get esAdmin(): boolean {
    const user = this.currentUserValue;
    return user?.role === 'Admin';
  }

  get esProductor(): boolean {
    const user = this.currentUserValue;
    return user?.role === 'Productor';
  }
}