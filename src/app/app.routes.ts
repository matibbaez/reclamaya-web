import { Routes } from '@angular/router';
import { InicioComponent } from './pages/inicio/inicio';
import { IniciarReclamoComponent } from './pages/iniciar-reclamo/iniciar-reclamo';
import { ConsultarTramiteComponent } from './pages/consultar-tramite/consultar-tramite';
import { LoginComponent } from './pages/login/login';
import { AdminDashboardComponent } from './pages/admin-dashboard/admin-dashboard';
import { MiEquipoComponent } from './pages/mi-equipo/mi-equipo';
import { ExitoComponent } from './pages/exito/exito';
import { CuentaPendienteComponent } from './pages/cuenta-pendiente/cuenta-pendiente';
import { MisReferidosComponent } from './pages/dashboard/mis-referidos/mis-referidos';
import { DetalleReclamoComponent } from './pages/dashboard/detalle-reclamo/detalle-reclamo';
import { LegalesComponent } from './pages/legales/legales';
import { authGuard } from './auth/auth-guard';
import { adminGuard } from './auth/admin.guard';

export const routes: Routes = [
  { 
    path: '', 
    component: InicioComponent, 
    pathMatch: 'full',
    data: { animation: 'InicioPage' }
  },
  { 
    path: 'iniciar-reclamo', 
    component: IniciarReclamoComponent,
    data: { animation: 'IniciarPage' } 
  },
  { 
    path: 'consultar-tramite', 
    component: ConsultarTramiteComponent,
    data: { animation: 'ConsultarPage' } 
  },
  { 
    path: 'login', 
    component: LoginComponent,
    data: { animation: 'LoginPage' } 
  },
  { 
    path: 'admin-dashboard', 
    component: AdminDashboardComponent, 
    canActivate: [adminGuard], 
    data: { animation: 'AdminPage' } 
  },

  { 
    path: 'mi-equipo', 
    component: MiEquipoComponent, 
    canActivate: [adminGuard], 
  },
  
  { 
    path: 'reclamo/:id', 
    component: DetalleReclamoComponent,
    canActivate: [authGuard], 
    data: { animation: 'DetallePage' } 
  },

  { 
    path: 'mis-referidos', 
    component: MisReferidosComponent, 
    canActivate: [authGuard], 
    data: { animation: 'ReferidosPage' } 
  },
  { 
    path: 'exito', 
    component: ExitoComponent,
    data: { animation: 'ExitoPage' } 
  },

  { path: 'legales', component: LegalesComponent },

  { 
    path: 'cuenta-pendiente', 
    component: CuentaPendienteComponent,
    data: { animation: 'PendientePage' } 
  },
  
  { path: '**', redirectTo: '' } 
];