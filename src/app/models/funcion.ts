export interface FuncionPelicula {
    id: string;
    pelicula_id: string;
    sala_id: string;
    formato: string;
    idioma: string;
    precio: number;
    inicio: string;
    fin: string;
    peliculas?: { titulo: string };
    salas?: { nombre: string; formato?: string };
}