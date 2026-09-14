export interface Pelicula {
    id: string;
    titulo: string;
    sinopsis: string;
    duracion_minutos: number;
    estreno: number;
    ventas_totales: number;
    afiche_url?: string;
    created_at?: string;
}