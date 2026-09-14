import { Component, OnInit, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../services/supabase';
import { Pelicula } from '../../models/pelicula';
import { TarjetaPeliculaComponent } from '../tarjeta-pelicula/tarjeta-pelicula';

@Component({
  selector: 'app-catalogo',
  standalone: true,
  imports: [CommonModule, FormsModule, TarjetaPeliculaComponent],
  templateUrl: './catalogo.html',
  styleUrl: './catalogo.css'
})
export class CatalogoComponent implements OnInit {
  private supabase = inject(SupabaseService);

  @Output() seleccionarPelicula = new EventEmitter<Pelicula>();

  peliculas: Pelicula[] = [];
  destacadas: Pelicula[] = [];
  busqueda: string = '';
  cargando: boolean = true;

  async ngOnInit(): Promise<void> {
    await this.cargarDatos();
  }

  async cargarDatos(): Promise<void> {
    this.cargando = true;
    try {
      this.peliculas = await this.supabase.getPeliculas(this.busqueda);
      console.log(this.peliculas)
      if (!this.busqueda) {
        this.destacadas = await this.supabase.getPeliculasDestacadas();
      }
    } catch (error) {
      console.error('Error al obtener la cartelera:', error);
    } finally {
      this.cargando = false;
    }
  }

  onPeliculaSeleccionada(pelicula: Pelicula): void {
    this.seleccionarPelicula.emit(pelicula);
  }
}