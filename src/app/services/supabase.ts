import { Injectable, signal } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { Pelicula } from '../models/pelicula';
import { Resena } from '../models/resena';
import { Usuario } from '../models/usuario';

@Injectable({
    providedIn: 'root'
})
export class SupabaseService {
    private supabase: SupabaseClient;

    constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
    }

    get client(): SupabaseClient {
        return this.supabase;
    }

  // --------------------------------------------- MÓDULO CLIENTE -------------------------------------------------------------------------

  // Catalogo
    async getPeliculas(busqueda: string = '') {
    let query = this.supabase.from('peliculas').select('*');
    if (busqueda.trim() !== '') {
        query = query.ilike('titulo', `%${busqueda}%`);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data;
    }

  // peliculas con mas tickets vendidas - 3
    async getPeliculasDestacadas() {
    const { data, error } = await this.supabase
        .from('peliculas')
        .select('*')
        .order('ventas_totales', { ascending: false })
        .limit(3);

    if (error) throw error;
    return data;
    }

    // pelicula-id (detalles de pelicula)
    async getPeliculaPorId(id: string): Promise<Pelicula | null> {
    const { data, error } = await this.supabase
        .from('peliculas')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error al obtener la película:', error.message);
        return null;
    }

    return data as Pelicula;
    }

    // Reseñas

    async getResenasPorPelicula(peliculaId: string): Promise<Resena[]> {
    const { data, error } = await this.supabase
        .from('resenas')
        .select('*')
        .eq('pelicula_id', peliculaId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
}

async agregarResena(
        peliculaId: string,
        usuarioId: string,
        estrellas: number,
        comentario: string,
        puntuacionTotalActual: number,
        puntuacionCantidadActual: number
    ): Promise<void> {
        const { error: errorResena } = await this.supabase
            .from('resenas')
            .insert([
                {
                    pelicula_id: peliculaId,
                    usuario_id: usuarioId,
                    estrellas: estrellas,
                    comentario: comentario
                }
            ]);

        if (errorResena) throw errorResena;

        const { error: errorPelicula } = await this.supabase
            .from('peliculas')
            .update({
                puntuacion_total: puntuacionTotalActual + estrellas,
                puntuacion_cantidad: puntuacionCantidadActual + 1
            })
            .eq('id', peliculaId);

        if (errorPelicula) throw errorPelicula;
    }

    // Iniciar
    usuarioActual = signal<Usuario | null>(null);

    async iniciarSesion(email: string, password: string) {
        const { data, error } = await this.supabase
            .from('perfiles')
            .select('*')
            .eq('email', email)
            .eq('password', password)
            .single();

        if (error) throw error;

        if (data) {
            this.usuarioActual.set({
                id: data.id,
                email: data.email,
                nombre: data.nombre,
                usuario: data.usuario
            });
        }

        return data;
    }

    cerrarSesion(): void {
        this.usuarioActual.set(null);
    }

    // Registrar
    async registrarUsuario(perfil: {
        nombre: string;
        apellido: string;
        usuario: string;
        email: string;
        password: string;
    }) {
        const { data, error } = await this.supabase
            .from('perfiles')
            .insert([perfil])
            .select()
            .single();

        if (error) throw error;
        return data;
    }   
}