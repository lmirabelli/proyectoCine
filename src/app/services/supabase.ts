import { Injectable, inject, signal } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { Router } from '@angular/router';
import { Pelicula } from '../models/pelicula';
import { Resena } from '../models/resena';
import { Usuario } from '../models/usuario';

@Injectable({
    providedIn: 'root'
})
export class SupabaseService {
    private supabase: SupabaseClient;
    private router = inject(Router);
    usuarioActual = signal<Usuario | null>(null);

    constructor() {
        this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey, {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true
            }
        });

        this.inicializarSuscripcionAuth();
    }

    get client(): SupabaseClient {
        return this.supabase;
    }

    private inicializarSuscripcionAuth(): void {
        this.supabase.auth.onAuthStateChange(async (event, session) => {
            if (session?.user) {
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
                        usuario: perfil.usuario,
                        fecha_nacimiento: perfil.fecha_nacimiento
                    };
                    this.usuarioActual.set(usuarioObj);
                    localStorage.setItem('usuario_sesion', JSON.stringify(usuarioObj));
                }
            } else {
                this.usuarioActual.set(null);
                localStorage.removeItem('usuario_sesion');
            }
        });
    }

    // --------------------------------------------- MODULO ADMINISTRADOR ------------------------------------------------------------------

    async obtenerPerfilActual(): Promise<{ id: string; rol?: string;[key: string]: any } | null> {
        const { data: { session } } = await this.client.auth.getSession();
        const userId = session?.user?.id || this.usuarioActual()?.id;

        if (!userId) return null;

        const { data, error } = await this.client
            .from('perfiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle();

        if (error || !data) return null;
        return data;
    }

    async esAdministrador(): Promise<boolean> {
        const perfil = await this.obtenerPerfilActual();
        if (!perfil || !perfil['rol']) return false;

        const rol = perfil['rol'].toString().trim().toLowerCase();
        return rol === 'administrador' || rol === 'admin';
    }

    async esEmpleado(): Promise<boolean> {
        const perfil = await this.obtenerPerfilActual();
        if (!perfil || !perfil['rol']) return false;

        const rol = perfil['rol'].toString().trim().toLowerCase();
        return rol === 'empleado' || rol === 'administrador' || rol === 'admin';
    }

    // --------------------------------------------- MODULO CUPONES Y DESCUENTOS ------------------------------------------------------------------

    async getCupones() {
        const { data, error } = await this.supabase
            .from('cupones')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    }

    async crearCupon(codigo: string, descuento: number) {
        const { data, error } = await this.supabase
            .from('cupones')
            .insert([{ codigo, descuento }])
            .select()
            .single();

        if (error) throw error;
        return data;
    }


    async getDescuentos() {
        const { data, error } = await this.supabase
            .from('descuentos')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    }

    async crearDescuento(descuentoObj: {
        nombre: string;
        edad_minima: number;
        porcentaje: number;
        tope_maximo: number;
    }) {
        const { data, error } = await this.supabase
            .from('descuentos')
            .insert([descuentoObj])
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async eliminarDescuento(id: string) {
        const { error } = await this.supabase
            .from('descuentos')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }

    async getDescuentosActivos() {
        const { data, error } = await this.supabase
            .from('descuentos')
            .select('*');
        if (error) throw error;
        return data || [];
    }

    async validarCupon(codigo: string) {
        const { data, error } = await this.supabase
            .from('cupones')
            .select('*')
            .ilike('codigo', codigo.trim())
            .maybeSingle();
        if (error) throw error;
        return data;
    }

    // --------------------------------------------- MODULO CLIENTE  ------------------------------------------------------------------

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
        const { data: authData, error: authError } = await this.supabase.auth.signUp({
            email: perfil.email,
            password: perfil.password
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error('No se pudo crear el usuario.');

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

    // Redireccionamientos

    irAlCandy(): void {
        this.router.navigate(['/candybar']);
    }

    // STORAGE PARA AFICHES

    async subirAfiche(file: File): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `afiches/${fileName}`;

    const { error: uploadError } = await this.client.storage
        .from('afiches')
        .upload(filePath, file);

    if (uploadError) {
        throw new Error(`Error al subir imagen: ${uploadError.message}`);
    }

    const { data } = this.client.storage
        .from('afiches')
        .getPublicUrl(filePath);

    return data.publicUrl;
}
}