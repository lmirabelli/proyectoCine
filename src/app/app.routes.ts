import { Routes } from '@angular/router';
import { CatalogoComponent } from './components/catalogo/catalogo';
import { LoginComponent } from './components/login/login';
import { PeliculaIdComponent } from './components/pelicula-id/pelicula-id';
import { GestionFuncionesComponent } from './components/gestion-funciones/gestion-funciones';
import { CandyBarComponent } from './components/candy-bar/candy-bar';


export const routes: Routes = [
    {path: '', component: CatalogoComponent},
    {path: 'pelicula/:id', component: PeliculaIdComponent},
    {path: 'login',component: LoginComponent},
    {path: 'panelAdministrador',component: GestionFuncionesComponent},
    {path: 'candybar',component: CandyBarComponent},
    {path: '**', redirectTo: ''}
];