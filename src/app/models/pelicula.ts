export interface Pelicula {
    id: string;
    titulo: string;
    sinopsis: string;
    afiche_url: string;
    duracion_minutos: number;
    formato: string;
    restriccion_edad: number;
    disponibilidad: 'no disponible' | 'en cartelera' | 'proximamente';
    estreno: number;
    generos?: { genero_id: string | number }[];
    ventas_totales?: number;
    puntuacion_total?: number;
    puntuacion_cantidad?: number;
}

export interface Genero {
    id: string;
    nombre: string;
}

export interface OpcionEdad {
    label: string;
    valor: number;
}