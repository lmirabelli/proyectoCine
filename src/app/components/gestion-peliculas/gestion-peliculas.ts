import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService } from '../../services/supabase';
import { Genero, OpcionEdad, Pelicula } from '../../models/pelicula';

@Component({
    selector: 'app-gestion-peliculas',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './gestion-peliculas.html',
    styleUrl: './gestion-peliculas.css'
})
export class GestionPeliculasComponent implements OnInit {
    private supabase = inject(SupabaseService);
    private router = inject(Router);

    esAdmin = signal<boolean>(false);
    cargando = signal<boolean>(true);
    guardando = signal<boolean>(false);
    
    mensajeError = signal<string | null>(null);
    mensajeExito = signal<string | null>(null);

    peliculaEdicionId = signal<string | null>(null);
    titulo = signal<string>('');
    sinopsis = signal<string>('');
    duracionMinutos = signal<number>(120);
    formato = signal<string>('2D');
    restriccionEdad = signal<number>(0);
    estreno = signal<number>(new Date().getFullYear());
    disponibilidad = signal<string>('no disponible');
    peliculasListado = signal<Pelicula[]>([]);
    generosDisponibles = signal<Genero[]>([]);
    generosSeleccionadosIds = signal<(number | string)[]>([]);
    archivoSeleccionado = signal<File | null>(null);
    vistaPreviaUrl = signal<string | null>(null);

    formatosDisponibles = ['2D', '3D', '4D', '5D'];
    opcionesDisponibilidad = ['no disponible', 'en cartelera', 'proximamente'];
    opcionesEdad: OpcionEdad[] = [
        { label: 'ATP (Apta para Todo Público)', valor: 0 },
        { label: 'SAM 13 (+13)', valor: 13 },
        { label: 'SAM 16 (+16)', valor: 16 },
        { label: 'SAM 18 (+18)', valor: 18 }
    ];

    async ngOnInit(): Promise<void> {
        this.cargando.set(true);
        const admin = await this.supabase.esAdministrador();
        this.esAdmin.set(admin);
        
        if (admin) {
            await Promise.all([
                this.cargarGeneros(),
                this.cargarPeliculas()
            ]);
        }
        this.cargando.set(false);
    }

    private async cargarGeneros(): Promise<void> {
        try {
            const { data, error } = await this.supabase.client
                .from('generos')
                .select('*')
                .order('nombre', { ascending: true });

            if (error) throw error;
            this.generosDisponibles.set(data || []);
        } catch (err) {
            console.error('Error al obtener géneros:', err);
        }
    }

    async cargarPeliculas(): Promise<void> {
        try {
            const { data, error } = await this.supabase.client
                .from('peliculas')
                .select('*, generos_peliculas(genero_id)')
                .order('titulo', { ascending: true });

            if (error) throw error;
            this.peliculasListado.set(data || []);
        } catch (err) {
            console.error('Error al cargar películas:', err);
        }
    }

    async seleccionarParaEditar(p: Pelicula): Promise<void> {
        this.mensajeError.set(null);
        this.mensajeExito.set(null);

        this.peliculaEdicionId.set(p.id);
        this.titulo.set(p.titulo || '');
        this.sinopsis.set(p.sinopsis || '');
        this.duracionMinutos.set(p.duracion_minutos || 120);
        this.formato.set(p.formato || '2D');
        this.restriccionEdad.set(p.restriccion_edad ?? 0);
        this.estreno.set(p.estreno || new Date().getFullYear());
        this.disponibilidad.set(p.disponibilidad || 'no disponible');
        this.vistaPreviaUrl.set(p.afiche_url || null);
        this.archivoSeleccionado.set(null);

        try {
            const { data: relGeneros } = await this.supabase.client
                .from('generos_peliculas')
                .select('genero_id')
                .eq('pelicula_id', p.id);

            if (relGeneros) {
                const ids = relGeneros.map(g => g.genero_id);
                this.generosSeleccionadosIds.set(ids);
            } else {
                this.generosSeleccionadosIds.set([]);
            }
        } catch (err) {
            console.error('Error al cargar géneros de la película:', err);
        }
    }

    onGeneroCheckboxChange(generoId: number | string, isChecked: boolean): void {
        const seleccionados = new Set(this.generosSeleccionadosIds());
        if (isChecked) {
            seleccionados.add(generoId);
        } else {
            seleccionados.delete(generoId);
        }
        this.generosSeleccionadosIds.set(Array.from(seleccionados));
    }

    onArchivoSeleccionado(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            const file = input.files[0];
            this.archivoSeleccionado.set(file);

            const reader = new FileReader();
            reader.onload = () => this.vistaPreviaUrl.set(reader.result as string);
            reader.readAsDataURL(file);
        }
    }

    async guardarPelicula(): Promise<void> {
    this.mensajeError.set(null);
    this.mensajeExito.set(null);

    // 1. Validaciones de cliente
    if (!this.titulo().trim() || !this.sinopsis().trim()) {
        this.mensajeError.set('Completá el título y la sinopsis.');
        return;
    }

    if (!this.peliculaEdicionId() && !this.archivoSeleccionado()) {
        this.mensajeError.set('Seleccioná un afiche para la nueva película.');
        return;
    }

    if (this.generosSeleccionadosIds().length === 0) {
        this.mensajeError.set('Seleccioná al menos un género para la película.');
        return;
    }

    this.guardando.set(true);

    try {
        let aficheUrl = this.vistaPreviaUrl();

        // Subir imagen si se seleccionó una nueva
        if (this.archivoSeleccionado()) {
            aficheUrl = await this.supabase.subirAfiche(this.archivoSeleccionado()!);
        }

        const datosPelicula = {
            titulo: this.titulo().trim(),
            sinopsis: this.sinopsis().trim(),
            afiche_url: aficheUrl,
            duracion_minutos: Number(this.duracionMinutos()),
            formato: this.formato(),
            restriccion_edad: Number(this.restriccionEdad()),
            disponibilidad: this.disponibilidad(),
            estreno: Number(this.estreno())
        };

        let targetId = this.peliculaEdicionId();

        if (targetId) {
            // MODO EDICIÓN
            const { error: errorUpdate } = await this.supabase.client
                .from('peliculas')
                .update(datosPelicula)
                .eq('id', targetId);

            if (errorUpdate) throw errorUpdate;

            // Intentamos limpiar las relaciones viejas
            const { error: errorDelete } = await this.supabase.client
                .from('generos_peliculas')
                .delete()
                .eq('pelicula_id', targetId);

            if (errorDelete) console.warn('Advertencia al eliminar géneros previos:', errorDelete);

        } else {
            // MODO CREACIÓN
            const { data: peliculaCreada, error: errorInsert } = await this.supabase.client
                .from('peliculas')
                .insert([{
                    ...datosPelicula,
                    ventas_totales: 0,
                    puntuacion_total: 0,
                    puntuacion_cantidad: 0
                }])
                .select('id')
                .single();

            if (errorInsert || !peliculaCreada) throw errorInsert;
            targetId = peliculaCreada.id;
        }

        // Preparar géneros únicos
        const generosUnicos = Array.from(new Set(this.generosSeleccionadosIds()));
        const relacionesGeneros = generosUnicos.map(generoId => ({
            pelicula_id: targetId,
            genero_id: generoId
        }));

        // Usar UPSERT para ignorar o actualizar si la clave primaria (pelicula_id, genero_id) ya existe
        const { error: errorGeneros } = await this.supabase.client
            .from('generos_peliculas')
            .upsert(relacionesGeneros, { onConflict: 'pelicula_id,genero_id' });

        if (errorGeneros) throw errorGeneros;

        // Éxito
        this.mensajeExito.set(this.peliculaEdicionId() ? '¡Película actualizada correctamente!' : '¡Película dada de alta correctamente!');
        this.limpiarFormulario();
        await this.cargarPeliculas();

    } catch (err: any) {
        // Log detallado en consola para desarrollo/debug
        console.error('Error detallado al guardar la película:', err);

        // Mensaje genérico e inofensivo para el usuario en la interfaz
        this.mensajeError.set('Ocurrió un error al procesar la solicitud. Por favor, reintente en unos instantes.');
    } finally {
        this.guardando.set(false);
    }
}

    limpiarFormulario(): void {
        this.peliculaEdicionId.set(null);
        this.titulo.set('');
        this.sinopsis.set('');
        this.duracionMinutos.set(120);
        this.formato.set('2D');
        this.restriccionEdad.set(0);
        this.disponibilidad.set('no disponible');
        this.estreno.set(new Date().getFullYear());
        this.archivoSeleccionado.set(null);
        this.vistaPreviaUrl.set(null);
        this.generosSeleccionadosIds.set([]);
    }
}