import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { Pelicula } from '../models/pelicula';

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
}