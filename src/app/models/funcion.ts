export interface FuncionPelicula {
    id: string;
    pelicula_id: string;
    sala_id: string;
    formato: string;
    idioma: string;
    precio: number;
    inicio: string;
    fin: string;
    salas?: {
        id?: string;
        nombre: string;
        formato?: string;
    };
    peliculas?: {
        titulo: string;
    };
}