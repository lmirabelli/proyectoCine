import { Component, OnInit, inject, signal } from '@angular/core';
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
    imports: [
        CommonModule,
        FormsModule,
        TarjetaPeliculaComponent,
        Destacados,
        Buscador
    ],
    templateUrl: './catalogo.html',
    styleUrl: './catalogo.css'
})
export class CatalogoComponent implements OnInit {
    private supabase = inject(SupabaseService);
    private router = inject(Router);

    peliculas = signal<Pelicula[]>([]);
    destacadas = signal<Pelicula[]>([]);
    busqueda = signal<string>('');
    cargando = signal<boolean>(true);

    async ngOnInit(): Promise<void> {
        await this.cargarDatos();
    }

    async cargarDatos(): Promise<void> {
        this.cargando.set(true);
        try {
            const data = await this.supabase.getPeliculas(this.busqueda());
            
            const peliculasOrdenadas = [...data].sort((a, b) => a.titulo.localeCompare(b.titulo));
            this.peliculas.set(peliculasOrdenadas);

            if (!this.busqueda()) {
                this.obtenerDestacadas(data);
            } else {
                this.destacadas.set([]);
            }
        } catch (error) {
            console.error('Error al obtener la cartelera:', error);
        } finally {
            this.cargando.set(false);
        }
    }

    onBuscar(termino: string): void {
        this.busqueda.set(termino);
        this.cargarDatos();
    }

    obtenerDestacadas(lista: Pelicula[]): void {
        const topDestacadas = [...lista]
            .sort((a, b) => (b.ventas_totales ?? 0) - (a.ventas_totales ?? 0))
            .slice(0, 3);
        this.destacadas.set(topDestacadas);
    }

    irAlDetalle(id: string): void {
        this.router.navigate(['/pelicula', id]);
    }
}