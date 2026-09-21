import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService } from '../../services/supabase';
import { Pelicula } from '../../models/pelicula';
import { TarjetaPeliculaComponent } from '../tarjeta-pelicula/tarjeta-pelicula';
import { Destacados } from '../destacados/destacados';
import { Buscador, FiltroBusqueda } from '../buscador/buscador';

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

    busqueda = signal<boolean>(false);
    cargando = signal<boolean>(true);

    async ngOnInit(): Promise<void> {
        await this.cargarDatosIniciales();
    }

    private async cargarDatosIniciales(): Promise<void> {
        this.cargando.set(true);
        try {
            const data = await this.supabase.getPeliculas();

            const peliculasOrdenadas = [...data].sort((a, b) => a.titulo.localeCompare(b.titulo));
            this.peliculas.set(peliculasOrdenadas);
            this.obtenerDestacadas(data);
        } catch (error) {
            console.error('Error al obtener la cartelera:', error);
        } finally {
            this.cargando.set(false);
        }
    }

    async onBuscar(filtro: FiltroBusqueda): Promise<void> {
        const tieneTexto = filtro.texto !== '';
        const tieneGeneros = filtro.generosIds.length > 0;
        const hayFiltrosActivos = tieneTexto || tieneGeneros;

        this.busqueda.set(hayFiltrosActivos);

        if (!hayFiltrosActivos) {
            await this.cargarDatosIniciales();
            return;
        }

        try {
            let data: Pelicula[] = [];

            if (tieneGeneros) {
                let query = this.supabase.client
                    .from('peliculas')
                    .select(`
                        *,
                        peliculas_generos!inner (
                            genero_id
                        )
                    `);

                if (tieneTexto) {
                    query = query.ilike('titulo', `%${filtro.texto}%`);
                }

                query = query.in('peliculas_generos.genero_id', filtro.generosIds);

                const { data: result, error } = await query;
                if (error) throw error;
                data = result || [];
            }
            else if (tieneTexto) {
                const { data: result, error } = await this.supabase.client
                    .from('peliculas')
                    .select('*')
                    .ilike('titulo', `%${filtro.texto}%`);

                if (error) throw error;
                data = result || [];
            }

            const unicas = Array.from(new Map(data.map(p => [p.id, p])).values());
            const ordenadas = unicas.sort((a, b) => a.titulo.localeCompare(b.titulo));

            this.peliculas.set(ordenadas);
            this.destacadas.set([]);
        } catch (error) {
            console.error('Error al filtrar películas:', error);
        }
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