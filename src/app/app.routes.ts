import { Routes } from '@angular/router';
import { CatalogoComponent } from './components/catalogo/catalogo';
import { PeliculaIdComponent } from './components/pelicula-id/pelicula-id';


export const routes: Routes = [
    {path: '', component: CatalogoComponent},
    {path: 'pelicula/:id', component: PeliculaIdComponent},
    {path: '**', redirectTo: ''}
];