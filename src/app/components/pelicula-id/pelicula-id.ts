import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SupabaseService } from '../../services/supabase';
import { ProcesoCompraComponent } from '../proceso-compra/proceso-compra';

@Component({
    selector: 'app-pelicula-id',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink, ProcesoCompraComponent],
    templateUrl: './pelicula-id.html',
    styleUrl: './pelicula-id.css'
})
export class PeliculaIdComponent implements OnInit {
    @Input() id!: string;

    private supabaseService = inject(SupabaseService);

    cargando = signal<boolean>(true);
    enviando = signal<boolean>(false);
    pelicula = signal<any>(null);
    resenas = signal<any[]>([]);

    comentarioTexto = signal<string>('');

    usuario = this.supabaseService.usuarioActual;

    async ngOnInit(): Promise<void> {
        await this.cargarPeliculaYResenas();
    }

    async cargarPeliculaYResenas(): Promise<void> {
        if (!this.id) {
            this.cargando.set(false);
            return;
        }

        this.cargando.set(true);

        try {
            const { data: pData, error: pError } = await this.supabaseService.client
                .from('peliculas')
                .select('*')
                .eq('id', this.id)
                .single();

            if (pError) throw pError;
            this.pelicula.set(pData);

            const { data: rData, error: rError } = await this.supabaseService.client
                .from('resenas')
                .select('*, perfiles(usuario, email)')
                .eq('pelicula_id', this.id)
                .order('created_at', { ascending: false });

            if (rError) throw rError;
            this.resenas.set(rData || []);
        } catch (error) {
            console.error('Error al obtener la película o reseñas:', error);
        } finally {
            this.cargando.set(false);
        }
    }
    estrellasSeleccionadas = signal<number>(0);
    async enviarResena(): Promise<void> {
        const usuarioLogueado = this.usuario();

        if (!usuarioLogueado || !usuarioLogueado.id) {
            alert('Debés iniciar sesión para poder dejar una reseña.');
            return;
        }

        if (this.estrellasSeleccionadas() === 0) {
            alert('Por favor, seleccioná una puntuación de 1 a 10 estrellas.');
            return;
        }

        if (!this.comentarioTexto().trim()) return;

        this.enviando.set(true);

        try {
            const p = this.pelicula();
            const estrellas = this.estrellasSeleccionadas();
            const comentario = this.comentarioTexto().trim();

            const { error: errorResena } = await this.supabaseService.client
                .from('resenas')
                .insert([
                    {
                        pelicula_id: p.id,
                        usuario_id: usuarioLogueado.id,
                        estrellas: estrellas,
                        comentario: comentario
                    }
                ]);

            if (errorResena) throw errorResena;

            const nuevaCantidad = (p.puntuacion_cantidad || 0) + 1;
            const nuevoTotal = (p.puntuacion_total || 0) + estrellas;

            const { error: errorPelicula } = await this.supabaseService.client
                .from('peliculas')
                .update({
                    puntuacion_cantidad: nuevaCantidad,
                    puntuacion_total: nuevoTotal
                })
                .eq('id', p.id);

            if (errorPelicula) throw errorPelicula;

            this.comentarioTexto.set('');
            this.estrellasSeleccionadas.set(0);
            await this.cargarPeliculaYResenas();

            alert('¡Reseña publicada con éxito!');
        } catch (error: any) {
            console.error('Error al guardar la reseña:', error);
            alert('Ocurrió un error al guardar la reseña: ' + (error.message || error));
        } finally {
            this.enviando.set(false);
        }
    }
}