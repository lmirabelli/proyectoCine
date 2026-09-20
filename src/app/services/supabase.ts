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
    usuarioActual = signal<Usuario | null>(null);

    constructor() {
        this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey, {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true
            }
        });

        // Escuchar cambios de estado de autenticación nativos de Supabase
        this.inicializarSuscripcionAuth();
    }

    get client(): SupabaseClient {
        return this.supabase;
    }

    private inicializarSuscripcionAuth(): void {
        this.supabase.auth.onAuthStateChange(async (event, session) => {
            if (session?.user) {
                // Si hay sesión activa en Supabase Auth, cargar el perfil correspondiente
                const { data: perfil } = await this.supabase
                    .from('perfiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .maybeSingle();

                if (perfil) {
                    const usuarioObj: Usuario = {
                        id: perfil.id,
                        email: session.user.email || perfil.email,
                        nombre: perfil.nombre,
                        usuario: perfil.usuario
                    };
                    this.usuarioActual.set(usuarioObj);
                    localStorage.setItem('usuario_sesion', JSON.stringify(usuarioObj));
                }
            } else {
                // Si la sesión expiró o se cerró
                this.usuarioActual.set(null);
                localStorage.removeItem('usuario_sesion');
            }
        });
    }

    // --------------------------------------------- MÓDULO ADMINISTRADOR ------------------------------------------------------------------

    async esAdministrador(): Promise<boolean> {
        const { data: { session } } = await this.client.auth.getSession();
        const userId = session?.user?.id || this.usuarioActual()?.id;

        if (!userId) return false;

        const { data, error } = await this.client
            .from('perfiles')
            .select('categoria')
            .eq('id', userId)
            .maybeSingle();

        if (error || !data || !data.categoria) return false;

        return data.categoria.trim().toLowerCase() === 'administrador';
    }

    // --------------------------------------------- MÓDULO CLIENTE / AUTH ------------------------------------------------------------------

    async iniciarSesion(email: string, pass: string) {
        const { data, error } = await this.client.auth.signInWithPassword({
            email: email,
            password: pass,
        });

        if (error) throw error;

        if (data.user) {
            const { data: perfil } = await this.client
                .from('perfiles')
                .select('*')
                .eq('id', data.user.id)
                .single();

            if (perfil) {
                const usuarioObj: Usuario = {
                    id: perfil.id,
                    email: data.user.email || perfil.email,
                    nombre: perfil.nombre,
                    usuario: perfil.usuario
                };
                this.usuarioActual.set(usuarioObj);
                localStorage.setItem('usuario_sesion', JSON.stringify(usuarioObj));
            }
        }

        return data;
    }

    async cerrarSesion(): Promise<void> {
        // Cierra la sesión nativa de Supabase y destruye las cookies/tokens
        await this.client.auth.signOut();
        this.usuarioActual.set(null);
        localStorage.removeItem('usuario_sesion');
    }

    async registrarUsuario(perfil: {
    nombre: string;
    apellido: string;
    usuario: string;
    email: string;
    password: string;
    fecha_nacimiento: string;
    tipo_sangre: string;
    color_ojos: string;
    dias_vacaciones: number;
}) {
    // 1. Crear usuario en Auth
    const { data: authData, error: authError } = await this.supabase.auth.signUp({
        email: perfil.email,
        password: perfil.password
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('No se pudo crear el usuario.');

    // 2. Insertar en perfiles usando el ID nativo de Auth
    const { password, ...datosPerfilSinPassword } = perfil;
    const { data, error } = await this.supabase
        .from('perfiles')
        .insert([{
            id: authData.user.id,
            ...datosPerfilSinPassword
        }])
        .select()
        .single();

    if (error) throw error;
    return data;
}

    // Catálogo
    async getPeliculas(busqueda: string = '') {
        let query = this.supabase.from('peliculas').select('*');
        if (busqueda.trim() !== '') {
            query = query.ilike('titulo', `%${busqueda}%`);
        }
        const { data, error } = await query;
        if (error) throw error;
        return data;
    }

    async getPeliculasDestacadas() {
        const { data, error } = await this.supabase
            .from('peliculas')
            .select('*')
            .order('ventas_totales', { ascending: false })
            .limit(3);

        if (error) throw error;
        return data;
    }

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
}