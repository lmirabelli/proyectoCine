import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class SupabaseService {
    private supabase: SupabaseClient;

    constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
    }

  // --- MÓDULO CLIENTE ---

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

  // peliculas mas vendidas - 3
    async getPeliculasDestacadas() {
    const { data, error } = await this.supabase
        .from('peliculas')
        .select('*')
        .order('ventas_totales', { ascending: false })
        .limit(3);

    if (error) throw error;
    return data;
    }

  // promedio de calificaciones y comentarios
    async getResenasPelicula(peliculaId: string) {
    const { data, error } = await this.supabase
        .from('resenas')
        .select('estrellas, comentario, created_at, perfiles(nombre, apellido)')
        .eq('pelicula_id', peliculaId);

    if (error) throw error;

    const totalEstrellas = data.reduce((acc, curr) => acc + curr.estrellas, 0);
    const promedio = data.length > 0 ? (totalEstrellas / data.length).toFixed(1) : '0';

    return { resenas: data, promedio: Number(promedio) };
    }

  // registrar usuario
    async registrarUsuario(email: string, pass: string, datosPerfil: any) {
    const { data: authData, error: authError } = await this.supabase.auth.signUp({
        email,
        password: pass
    });

    if (authError) throw authError;

    if (authData.user) {
        const { error: profileError } = await this.supabase.from('perfiles').insert({
        id: authData.user.id,
        email,
        nombre: datosPerfil.nombre,
        apellido: datosPerfil.apellido,
        fecha_nacimiento: datosPerfil.fechaNacimiento,
        tipo_sangre: datosPerfil.tipoSangre,
        color_ojos: datosPerfil.colorOjos,
        dias_vacaciones_anio: datosPerfil.diasVacaciones,
        es_primera_compra: true
        });

        if (profileError) throw profileError;
    }

    return authData;
    }

  // compra con el descuento
    async procesarCompra(funcionId: string, usuarioId: string | null, precioBase: number) {
    let descuento = 0;
    let esInvitado = true;

    if (usuarioId) {
        esInvitado = false;
        const { data: perfil } = await this.supabase
        .from('perfiles')
        .select('es_primera_compra')
        .eq('id', usuarioId)
        .single();

        if (perfil?.es_primera_compra) {
        descuento = 0.20;
        }
    }

    const montoTotal = precioBase * (1 - descuento);
    const qrToken = `TICKET-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const { data, error } = await this.supabase.from('compras').insert({
        funcion_id: funcionId,
        usuario_id: usuarioId,
        es_invitado: esInvitado,
        monto_total: montoTotal,
        descuento_aplicado: descuento * 100,
        codigo_qr_token: qrToken
    }).select().single();

    if (error) throw error;

    if (usuarioId && descuento > 0) {
        await this.supabase.from('perfiles').update({ es_primera_compra: false }).eq('id', usuarioId);
    }

    return data;
    }

  // --- MÓDULO ADMINISTRADOR ---

  // funciones con 30 minutos
    async crearFuncion(salaId: string, peliculaId: string, formato: string, idioma: string, precio: number, inicio: Date, duracionMinutos: number) {
    const finPelicula = new Date(inicio.getTime() + duracionMinutos * 60000);
    const finConLimpieza = new Date(finPelicula.getTime() + 30 * 60000);

    const { data: funcionesExistentes, error } = await this.supabase
        .from('funciones')
        .select('inicio, fin')
        .eq('sala_id', salaId);

    if (error) throw error;

    const haySolapamiento = funcionesExistentes.some(f => {
        const fInicio = new Date(f.inicio).getTime();
        const fFinConLimpieza = new Date(f.fin).getTime() + (30 * 60000);
        const nuevoInicio = inicio.getTime();
        const nuevoFinConLimpieza = finConLimpieza.getTime();

        return (nuevoInicio < fFinConLimpieza && nuevoFinConLimpieza > fInicio);
    });

    if (haySolapamiento) {
        throw new Error('Conflicto de horario: La sala no dispone del margen mínimo de 30 minutos de limpieza entre proyecciones.');
    }

    const { data, error: insertError } = await this.supabase.from('funciones').insert({
        sala_id: salaId,
        pelicula_id: peliculaId,
        formato,
        idioma,
        precio,
        inicio: inicio.toISOString(),
        fin: finPelicula.toISOString()
    }).select().single();

    if (insertError) throw insertError;
    return data;
    }
}