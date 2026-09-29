import { Routes } from '@angular/router';
import { CatalogoComponent } from './components/catalogo/catalogo';
import { LoginComponent } from './components/login/login';
import { PeliculaIdComponent } from './components/pelicula-id/pelicula-id';
import { GestionFuncionesComponent } from './components/gestion-funciones/gestion-funciones';
import { CandyBarComponent } from './components/candy-bar/candy-bar';
import { MenuEmpleadosComponent } from './components/menu-empleados/menu-empleados';
import { CuponesComponent } from './components/cupones/cupones';
import { adminGuard, empleadoGuard } from './guards/roles';

export const routes: Routes = [
    { path: '', component: CatalogoComponent },
    { path: 'pelicula/:id', component: PeliculaIdComponent },
    { path: 'login', component: LoginComponent },
    { path: 'menu-empleados', component: MenuEmpleadosComponent, canActivate: [empleadoGuard] },
    { path: 'panelAdministrador', component: GestionFuncionesComponent },
    { path: 'cupones', component: CuponesComponent },
    { path: 'candybar', component: CandyBarComponent },
    { path: 'despacho',loadComponent: () => import('./components/despacho-candy/despacho-candy').then(m => m.DespachoCandyComponent),canActivate: [empleadoGuard]},
    { path: 'gestionPeliculas',loadComponent: () => import('./components/gestion-peliculas/gestion-peliculas').then(m => m.GestionPeliculasComponent),canActivate: [empleadoGuard]},
    { path: 'gestionUsuarios',loadComponent: () => import('./components/gestion-usuarios/gestion-usuarios').then(m => m.GestionUsuariosComponent),canActivate: [empleadoGuard]},
    { path: 'facturacion', loadComponent: () => import('./components/facturacion/facturacion').then(m => m.Facturacion)},
    { path: 'proceso-compra/:id', loadComponent: () => import('./components/proceso-compra/proceso-compra').then(m => m.ProcesoCompraComponent) },
    { path: '**', redirectTo: '' }
];