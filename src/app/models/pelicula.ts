export interface Pelicula {
    id: string;
    titulo: string;
    sinopsis: string;
    duracion_minutos: number;
    afiche_url?: string;
    ventas_totales?: number;
    created_at?: string;
}