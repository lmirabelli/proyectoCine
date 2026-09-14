import { Component } from '@angular/core';
import { CatalogoComponent } from './components/catalogo/catalogo';
import { Pelicula } from './models/pelicula';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CatalogoComponent],
  template: `
    <div class="app-layout">
      <header class="navbar">
        <h1>Proyecto Cine - Progra IV</h1>
      </header>
      <main class="content">
        <app-catalogo (seleccionarPelicula)="verDetalle($event)"></app-catalogo>
      </main>
    </div>
  `,
  styleUrl: "./app.css",
})
export class AppComponent {
  verDetalle(pelicula: Pelicula): void {
    console.log('Película seleccionada:', pelicula);
  }
}