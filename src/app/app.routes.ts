import { Routes } from '@angular/router';
import { authGuard } from './auth/auth-guard';
import { adminGuard } from './auth/admin.guard';

export const routes: Routes = [
  { 
    path: '', 
    loadComponent: () => import('./pages/inicio/inicio').then(m => m.InicioComponent),
    pathMatch: 'full',
    data: { animation: 'InicioPage' }
  },
  { 
    path: 'iniciar-reclamo', 
    loadComponent: () => import('./pages/iniciar-reclamo/iniciar-reclamo').then(m => m.IniciarReclamoComponent),
    data: { animation: 'IniciarPage' } 
  },
  { 
    path: 'consultar-tramite', 
    loadComponent: () => import('./pages/consultar-tramite/consultar-tramite').then(m => m.ConsultarTramiteComponent),
    data: { animation: 'ConsultarPage' } 
  },
  { 
    path: 'login', 
    loadComponent: () => import('./pages/login/login').then(m => m.LoginComponent),
    data: { animation: 'LoginPage' } 
  },
  { 
    path: 'admin-dashboard', 
    loadComponent: () => import('./pages/admin-dashboard/admin-dashboard').then(m => m.AdminDashboardComponent),
    canActivate: [adminGuard], 
    data: { animation: 'AdminPage' } 
  },
  { 
    path: 'mi-equipo', 
    loadComponent: () => import('./pages/mi-equipo/mi-equipo').then(m => m.MiEquipoComponent),
    canActivate: [adminGuard], 
  },
  { 
    path: 'mi-perfil', 
    loadComponent: () => import('./pages/mi-perfil/mi-perfil').then(m => m.MiPerfilComponent),
    canActivate: [authGuard], 
    data: { animation: 'PerfilPage' } 
  },
  { 
    path: 'reclamo/:id', 
    loadComponent: () => import('./pages/dashboard/detalle-reclamo/detalle-reclamo').then(m => m.DetalleReclamoComponent),
    canActivate: [authGuard], 
    data: { animation: 'DetallePage' } 
  },
  { 
    path: 'mis-referidos', 
    loadComponent: () => import('./pages/dashboard/mis-referidos/mis-referidos').then(m => m.MisReferidosComponent),
    canActivate: [authGuard], 
    data: { animation: 'ReferidosPage' } 
  },
  { 
    path: 'exito', 
    loadComponent: () => import('./pages/exito/exito').then(m => m.ExitoComponent),
    data: { animation: 'ExitoPage' } 
  },
  { 
    path: 'legales', 
    loadComponent: () => import('./pages/legales/legales').then(m => m.LegalesComponent) 
  },
  { 
    path: 'productores', 
    loadComponent: () => import('./pages/landing-productores/landing-productores').then(m => m.LandingProductoresComponent) 
  },
  { 
    path: 'landing-productores', 
    loadComponent: () => import('./pages/landing-productores/landing-productores').then(m => m.LandingProductoresComponent) 
  },
  { 
    path: 'cuenta-pendiente', 
    loadComponent: () => import('./pages/cuenta-pendiente/cuenta-pendiente').then(m => m.CuentaPendienteComponent),
    data: { animation: 'PendientePage' } 
  },
  { path: 'inicio', redirectTo: '', pathMatch: 'full' },
  { path: 'landing-productores', redirectTo: 'productores', pathMatch: 'full' },
  { path: '**', redirectTo: '' } 
];