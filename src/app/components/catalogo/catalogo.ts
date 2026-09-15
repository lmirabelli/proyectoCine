import { Component, OnInit, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService } from '../../services/supabase';
import { Pelicula } from '../../models/pelicula';
import { TarjetaPeliculaComponent } from '../tarjeta-pelicula/tarjeta-pelicula';
import { Destacados } from '../destacados/destacados';
import { Buscador } from '../buscador/buscador';

@Component({
  selector: 'app-catalogo',
  standalone: true,
  imports: [CommonModule, FormsModule, TarjetaPeliculaComponent, Destacados,Buscador],
  templateUrl: './catalogo.html',
  styleUrl: './catalogo.css'
})
export class CatalogoComponent implements OnInit {
  private supabase = inject(SupabaseService);
  private router = inject(Router)

  @Output() seleccionarPelicula = new EventEmitter<Pelicula>();

  peliculas: Pelicula[] = [];
  destacadas: Pelicula[] = [];
  busqueda: string = '';
  cargando: boolean = true;

  obtenerDestacadas(): void {
    this.destacadas = [...this.peliculas]
      .sort((a, b) => (b.ventas_totales ?? 0) - (a.ventas_totales ?? 0))
      .slice(0, 3);
  }

  ordenarCatalogoAlfabetico(): void {
    this.peliculas.sort((a, b) => a.titulo.localeCompare(b.titulo));
  }

  detallar(id: string): void {
    this.router.navigate(['/pelicula', id])
  }

  onBuscar(termino: string): void {
  this.busqueda = termino;
  this.cargarDatos();
  }

  async ngOnInit(): Promise<void> {
    await this.cargarDatos();
    this.obtenerDestacadas();
    this.ordenarCatalogoAlfabetico();
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